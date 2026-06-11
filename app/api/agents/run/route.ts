import { NextResponse } from "next/server";
import { workspaceAi, KEY_REJECTED, TRIAL_CAPPED } from "@/lib/workspace-ai";
import { createClient } from "@/lib/supabase/server";
import {
  type AgentDefV2,
  type StepDef,
  type FieldDef,
  template,
  synthesizeLegacy,
  BUILTIN_RFP,
} from "@/lib/agent-def";

const AI_BUSY =
  "The AI service is briefly overloaded — please try again in a few seconds.";

const aiError = (e: unknown, ownKey: boolean) =>
  ownKey && /\((400|401|403)\)/.test(String(e)) ? KEY_REJECTED : AI_BUSY;

const NO_ANSWER = "No grounded answer found — add the relevant documents.";
const MAX_ITEMS = 10;
const MAX_STEPS = 8;

function respondSystem(name: string) {
  return `You are "${name}", an agent inside Zecway, a company's knowledge tool. Follow the task instructions you are given. Ground every claim in the numbered sources provided and cite them like [1] or [2]. Content marked (from the web) may be used but mention that it came from the web. If the sources don't contain what you need, write exactly: "${NO_ANSWER}" Output well-structured markdown. Be direct and concise.`;
}

const thinkSystem =
  "You are a hidden reasoning step inside an agent pipeline. Follow the instructions and output ONLY the requested result — no preamble, no meta-commentary.";

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
    preview?: {
      name?: string;
      split_lines?: boolean;
      fields?: FieldDef[];
      steps?: StepDef[];
      // legacy preview shape
      search_hint?: string;
      respond_instructions?: string;
    };
    input?: { text?: string; questions?: string; inputs?: Record<string, string> };
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

  // ── resolve the definition: preview draft, saved agent, or built-in ──
  let def: AgentDefV2;
  if (body.preview) {
    const p = body.preview;
    if (Array.isArray(p.steps) && p.steps.length > 0) {
      def = {
        id: null,
        slug: "preview",
        name: p.name || "Untitled agent",
        splitLines: Boolean(p.split_lines),
        fields: Array.isArray(p.fields) ? p.fields : [],
        steps: p.steps.slice(0, MAX_STEPS),
      };
    } else if (p.respond_instructions) {
      const synth = synthesizeLegacy({
        input_label: "Input",
        input_placeholder: "",
        split_lines: Boolean(p.split_lines),
        search_hint: p.search_hint ?? "",
        respond_instructions: p.respond_instructions,
      });
      def = {
        id: null,
        slug: "preview",
        name: p.name || "Untitled agent",
        splitLines: Boolean(p.split_lines),
        ...synth,
      };
    } else {
      return NextResponse.json({ error: "Nothing to preview yet" }, { status: 400 });
    }
  } else if (body.agent_id) {
    const { data: a, error } = await supabase
      .from("agents")
      .select(
        "id, name, split_lines, search_hint, respond_instructions, input_label, input_placeholder, workspace_id, fields, steps",
      )
      .eq("id", body.agent_id)
      .single();
    if (error || !a || a.workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const v2 = Array.isArray(a.steps) && a.steps.length > 0;
    const synth = v2 ? null : synthesizeLegacy(a);
    def = {
      id: a.id,
      slug: "custom",
      name: a.name,
      splitLines: a.split_lines,
      fields: v2 ? (a.fields as FieldDef[]) : synth!.fields,
      steps: (v2 ? (a.steps as StepDef[]) : synth!.steps).slice(0, MAX_STEPS),
    };
  } else if (body.agent_slug === "rfp-answerer") {
    def = BUILTIN_RFP;
  } else {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  // ── inputs → variable context ──
  const rawInputs = body.input?.inputs ?? {};
  if (def.fields.length > 0 && Object.keys(rawInputs).length === 0) {
    // legacy clients send a single text blob — map it to the first field
    const legacyText = body.input?.text ?? body.input?.questions ?? "";
    if (legacyText) rawInputs[def.fields[0].key] = legacyText;
  }
  const ctx: Record<string, string> = {};
  for (const f of def.fields) ctx[f.key] = (rawInputs[f.key] ?? "").trim();
  const firstKey = def.fields[0]?.key;
  if (firstKey && !ctx[firstKey]) {
    return NextResponse.json(
      { error: `Fill in “${def.fields[0].label}” first.` },
      { status: 400 },
    );
  }

  // per-line items over the first field, when enabled
  const items: (string | null)[] =
    def.splitLines && firstKey
      ? ctx[firstKey]
          .split("\n")
          .map((l) => l.replace(/^\s*(?:\d+[).:]|[-*•])\s*/, "").trim())
          .filter((l) => l.length > 5)
          .slice(0, MAX_ITEMS)
      : [null];
  if (items.length === 0) {
    return NextResponse.json({ error: "Add at least one line of input." }, { status: 400 });
  }

  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      agent_slug: def.slug,
      agent_id: def.id,
      agent_name: def.name,
      input: { inputs: ctx },
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
  const { provider, ownKey, capped } = await workspaceAi(supabase, workspaceId);
  if (capped) {
    await supabase
      .from("agent_runs")
      .update({ status: "failed", finished_at: new Date().toISOString() })
      .eq("id", runId);
    return NextResponse.json({ error: TRIAL_CAPPED }, { status: 429 });
  }

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

      // run-wide citation pool
      const citations: { n: number; title: string; url: string | null; document_id: string }[] = [];
      const docNumbers = new Map<string, number>();
      const cite = (document_id: string, title: string, url: string | null) => {
        if (!docNumbers.has(document_id)) {
          docNumbers.set(document_id, docNumbers.size + 1);
          citations.push({ n: docNumbers.size, title, url, document_id });
        }
        return docNumbers.get(document_id);
      };

      type Match = {
        chunk_id: string; document_id: string; content: string;
        title: string; url: string | null; similarity: number;
      };
      const searchOnce = async (query: string, topK: number): Promise<string> => {
        const [embedding] = await provider.embedTexts([query]);
        const { data: matches, error } = await supabase.rpc("match_chunks", {
          ws: workspaceId,
          query_embedding: JSON.stringify(embedding),
          user_principals: [user.email],
          match_count: topK,
        });
        if (error) throw new Error(error.message);
        return ((matches ?? []) as Match[])
          .map((c) => `[${cite(c.document_id, c.title, c.url)}] ${c.title}\n${c.content}`)
          .join("\n\n");
      };

      let finalOutput = "";
      try {
        send({ type: "meta", run_id: runId });

        const t = await step(
          "trigger",
          `Input received${items.length > 1 ? ` — ${items.length} items` : ""}`,
        );
        await finishStep(t, { fields: Object.keys(ctx) });

        // collected numbered sources for the respond step
        const sourceBlocks: string[] = [];

        for (let si = 0; si < def.steps.length; si++) {
          const sd = def.steps[si];
          const varName = `step_${si + 1}`;

          if (sd.kind === "search") {
            const sIdx = await step("search", `Searching the graph`);
            const topK = sd.top_k ?? (items.length > 1 ? 3 : 6);
            let output: string;
            const usesFirst = firstKey && sd.query.includes(`[[${firstKey}]]`);
            if (items.length > 1 && usesFirst) {
              const blocks: string[] = [];
              for (let qi = 0; qi < items.length; qi++) {
                const q = template(sd.query, { ...ctx, [firstKey!]: items[qi]! });
                const sources = await searchOnce(q, topK);
                blocks.push(`Item ${qi + 1}: ${items[qi]}\nSources:\n${sources || "(none)"}`);
                send({ type: "search_progress", done: qi + 1, total: items.length });
              }
              output = blocks.join("\n\n=====\n\n");
            } else {
              output = (await searchOnce(template(sd.query, ctx), topK)) || "(none)";
            }
            ctx[varName] = output;
            sourceBlocks.push(output);
            await finishStep(sIdx, { hits: docNumbers.size });
          } else if (sd.kind === "web_search") {
            const sIdx = await step("search", "Searching the web", { web: true });
            const q = template(sd.query, ctx);
            const summary = await provider.generateWithWebSearch(
              `Search the web and summarize what you find, with key facts, for: ${q}`,
            );
            ctx[varName] = `(from the web)\n${summary}`;
            sourceBlocks.push(`(from the web — not a company source)\n${summary}`);
            await finishStep(sIdx, { web: true });
          } else if (sd.kind === "read_doc") {
            const sIdx = await step("read", `Reading “${sd.title ?? "document"}”`);
            const { data: doc } = await supabase
              .from("documents")
              .select("id, title, url, markdown")
              .eq("id", sd.document_id)
              .single();
            if (doc) {
              const n = cite(doc.id, doc.title, doc.url);
              const text = `[${n}] ${doc.title}\n${String(doc.markdown ?? "").slice(0, 8000)}`;
              ctx[varName] = text;
              sourceBlocks.push(text);
              await finishStep(sIdx);
            } else {
              ctx[varName] = "(document not found)";
              await finishStep(sIdx, { missing: true }, "failed");
            }
          } else if (sd.kind === "think") {
            const sIdx = await step("think", "Reasoning (hidden step)");
            const out = await provider.generateText(template(sd.instructions, ctx), thinkSystem);
            ctx[varName] = out;
            await finishStep(sIdx);
          } else if (sd.kind === "respond") {
            const sIdx = await step("respond", "Writing the answer document");
            const instructions = template(sd.instructions, ctx);
            const prompt =
              `Task instructions: ${instructions}\n\n` +
              (items.length > 1
                ? `The input was split into items; address each one.\n\n`
                : "") +
              `Sources:\n\n${sourceBlocks.join("\n\n---\n\n") || "(none)"}`;
            let out = "";
            for await (const delta of provider.generateTextStream(
              prompt,
              respondSystem(def.name),
            )) {
              out += delta;
              send({ type: "delta", text: out.length === delta.length ? delta : delta });
            }
            ctx[varName] = out;
            finalOutput = out;
            await finishStep(sIdx);
          }
        }

        const used = finalOutput.includes(NO_ANSWER)
          ? []
          : citations.filter((c) => finalOutput.includes(`[${c.n}]`));
        await supabase
          .from("agent_runs")
          .update({
            status: "done",
            output: finalOutput,
            citations: used,
            finished_at: new Date().toISOString(),
          })
          .eq("id", runId);
        send({ type: "done", citations: used });
      } catch (e) {
        console.error("agent run failed:", e);
        await supabase
          .from("agent_runs")
          .update({ status: "failed", finished_at: new Date().toISOString() })
          .eq("id", runId);
        send({ type: "error", error: aiError(e, ownKey) });
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
