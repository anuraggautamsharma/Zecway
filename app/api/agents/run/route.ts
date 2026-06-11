import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

const AI_BUSY =
  "The AI service is briefly overloaded — please try again in a few seconds.";

// quota guard: one embedding batch + one generation per run
const MAX_ITEMS = 10;
const CHUNKS_PER_ITEM = 3;
const NO_ANSWER = "No grounded answer found — add the relevant documents.";

type AgentDef = {
  id: string | null;
  slug: string;
  name: string;
  splitLines: boolean;
  searchHint: string;
  system: string;
};

const RFP_SYSTEM = `You are Zecway's RFP-answering agent. You will receive a list of questionnaire questions, each with its own numbered sources retrieved from the company's knowledge graph. Answer every question using ONLY its sources. After every claim, cite its source like [1] or [2]. If a question's sources don't contain the answer, write exactly: "${NO_ANSWER}" Format the output as markdown: each question as a bold line, its answer below. Be direct and concise.`;

function customSystem(name: string, instructions: string) {
  return `You are "${name}", an agent inside Zecway, a company's knowledge tool. The agent author's instructions for what to produce: ${instructions}

You will receive the user's input split into items, each with its own numbered sources retrieved from the company's knowledge graph. Follow the author's instructions using ONLY those sources. After every claim, cite its source like [1] or [2]. If the sources don't contain what you need for an item, write exactly: "${NO_ANSWER}" Output well-structured markdown. Be direct and concise.`;
}

function parseItems(raw: string, splitLines: boolean): string[] {
  if (!splitLines) {
    const t = raw.trim();
    return t ? [t.slice(0, 2000)] : [];
  }
  return raw
    .split("\n")
    .map((l) => l.replace(/^\s*(?:\d+[).:]|[-*•])\s*/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, MAX_ITEMS);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: {
    workspace_id?: string;
    agent_slug?: string;
    agent_id?: string;
    input?: { text?: string; questions?: string };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const workspaceId = body.workspace_id;
  if (!workspaceId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // resolve the recipe: built-in template or a workspace-built agent (RLS-read)
  let def: AgentDef;
  if (body.agent_id) {
    const { data: agent, error } = await supabase
      .from("agents")
      .select("id, name, split_lines, search_hint, respond_instructions, workspace_id")
      .eq("id", body.agent_id)
      .single();
    if (error || !agent || agent.workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    def = {
      id: agent.id,
      slug: "custom",
      name: agent.name,
      splitLines: agent.split_lines,
      searchHint: agent.search_hint,
      system: customSystem(agent.name, agent.respond_instructions),
    };
  } else if (body.agent_slug === "rfp-answerer") {
    def = {
      id: null,
      slug: "rfp-answerer",
      name: "RFP answerer",
      splitLines: true,
      searchHint: "",
      system: RFP_SYSTEM,
    };
  } else {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  const rawInput = body.input?.text ?? body.input?.questions ?? "";
  const items = parseItems(rawInput, def.splitLines);
  if (items.length === 0) {
    return NextResponse.json(
      { error: def.splitLines ? "Add at least one line of input." : "Add some input first." },
      { status: 400 },
    );
  }

  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      agent_slug: def.slug,
      agent_id: def.id,
      agent_name: def.name,
      input: { text: rawInput },
    })
    .select("id")
    .single();
  if (runError || !run) {
    return NextResponse.json(
      { error: runError?.message ?? "Could not start run" },
      { status: 500 },
    );
  }
  const runId = run.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      let idx = 0;
      const step = async (kind: string, title: string, detail: object = {}) => {
        const i = idx++;
        await supabase.from("agent_run_steps").insert({
          run_id: runId, idx: i, kind, title, detail,
        });
        send({ type: "step", idx: i, kind, title, status: "running" });
        return i;
      };
      const finishStep = async (i: number, detail?: object, status = "done") => {
        await supabase
          .from("agent_run_steps")
          .update({
            status,
            finished_at: new Date().toISOString(),
            ...(detail ? { detail } : {}),
          })
          .eq("run_id", runId)
          .eq("idx", i);
        send({ type: "step", idx: i, status, ...(detail ? { detail } : {}) });
      };

      try {
        send({ type: "meta", run_id: runId });

        const t = await step(
          "trigger",
          `Input received — ${items.length} item${items.length === 1 ? "" : "s"}`,
        );
        await finishStep(t, { items });

        const s = await step("search", "Searching the graph");
        const retrievalTexts = items.map((q) =>
          def.searchHint ? `${def.searchHint}\n${q}` : q,
        );
        const embeddings = await ai().embedTexts(retrievalTexts);

        type Match = {
          chunk_id: string; document_id: string; content: string;
          title: string; url: string | null; similarity: number;
        };
        const perItem: { item: string; chunks: Match[] }[] = [];
        for (let qi = 0; qi < items.length; qi++) {
          const { data: matches, error } = await supabase.rpc("match_chunks", {
            ws: workspaceId,
            query_embedding: JSON.stringify(embeddings[qi]),
            user_principals: [user.email],
            match_count: def.splitLines ? CHUNKS_PER_ITEM : 8,
          });
          if (error) throw new Error(error.message);
          perItem.push({ item: items[qi], chunks: (matches ?? []) as Match[] });
          if (items.length > 1)
            send({ type: "search_progress", done: qi + 1, total: items.length });
        }
        const totalHits = perItem.reduce((n, q) => n + q.chunks.length, 0);
        await finishStep(s, { queries: items, hits: totalHits });

        const citations: { n: number; title: string; url: string | null; document_id: string }[] = [];
        const docNumbers = new Map<string, number>();
        const cite = (m: Match) => {
          if (!docNumbers.has(m.document_id)) {
            docNumbers.set(m.document_id, docNumbers.size + 1);
            citations.push({
              n: docNumbers.size, title: m.title, url: m.url, document_id: m.document_id,
            });
          }
          return docNumbers.get(m.document_id);
        };

        const blocks = perItem
          .map((q, i) => {
            const sources = q.chunks
              .map((c) => `[${cite(c)}] ${c.title}\n${c.content}`)
              .join("\n\n");
            return `Item ${i + 1}: ${q.item}\nSources:\n${sources || "(none)"}`;
          })
          .join("\n\n=====\n\n");

        const th = await step("think", "Drafting from what it found");
        let output = "";
        for await (const delta of ai().generateTextStream(blocks, def.system)) {
          output += delta;
          send({ type: "delta", text: delta });
        }
        await finishStep(th, { model: "gemini-2.5-flash" });

        const r = await step("respond", "Assembling the document");
        const used = citations.filter((c) => output.includes(`[${c.n}]`));
        await supabase
          .from("agent_runs")
          .update({
            status: "done",
            output,
            citations: used,
            finished_at: new Date().toISOString(),
          })
          .eq("id", runId);
        await finishStep(r, { citations: used.length });
        send({ type: "done", citations: used });
      } catch (e) {
        console.error("agent run failed:", e);
        await supabase
          .from("agent_runs")
          .update({ status: "failed", finished_at: new Date().toISOString() })
          .eq("id", runId);
        send({ type: "error", error: AI_BUSY });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
