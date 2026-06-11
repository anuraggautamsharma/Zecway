import { NextResponse } from "next/server";
import { ai } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

const AI_BUSY =
  "The AI service is briefly overloaded — please try again in a few seconds.";

// v1 quota guard: one embedding batch + one generation per run.
const MAX_QUESTIONS = 10;
const CHUNKS_PER_QUESTION = 3;

const SYSTEM = `You are Zecway's RFP-answering agent. You will receive a list of questionnaire questions, each with its own numbered sources retrieved from the company's knowledge graph. Answer every question using ONLY its sources. After every claim, cite its source like [1] or [2]. If a question's sources don't contain the answer, write exactly: "No grounded answer found — add the relevant documents." Format the output as markdown: each question as a bold line, its answer below. Be direct and concise.`;

// Split a pasted questionnaire into individual questions.
function parseQuestions(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.replace(/^\s*(?:\d+[).:]|[-*•])\s*/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, MAX_QUESTIONS);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { workspace_id?: string; agent_slug?: string; input?: { questions?: string } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const workspaceId = body.workspace_id;
  if (!workspaceId || body.agent_slug !== "rfp-answerer") {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }
  const questions = parseQuestions(body.input?.questions ?? "");
  if (questions.length === 0) {
    return NextResponse.json(
      { error: "Paste at least one question (one per line)." },
      { status: 400 },
    );
  }

  // The run is owned by the caller; RLS enforces both insert and later reads.
  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      agent_slug: "rfp-answerer",
      input: { questions: questions.join("\n") },
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

        const t = await step("trigger", `Input received — ${questions.length} question${questions.length === 1 ? "" : "s"}`);
        await finishStep(t, { questions });

        // one embedding batch for all questions
        const s = await step("search", "Searching the graph per question");
        const embeddings = await ai().embedTexts(questions);

        type Match = {
          chunk_id: string; document_id: string; content: string;
          title: string; url: string | null; similarity: number;
        };
        const perQuestion: { question: string; chunks: Match[] }[] = [];
        for (let qi = 0; qi < questions.length; qi++) {
          const { data: matches, error } = await supabase.rpc("match_chunks", {
            ws: workspaceId,
            query_embedding: JSON.stringify(embeddings[qi]),
            user_principals: [user.email],
            match_count: CHUNKS_PER_QUESTION,
          });
          if (error) throw new Error(error.message);
          perQuestion.push({ question: questions[qi], chunks: (matches ?? []) as Match[] });
          send({ type: "search_progress", done: qi + 1, total: questions.length });
        }
        const totalHits = perQuestion.reduce((n, q) => n + q.chunks.length, 0);
        await finishStep(s, { queries: questions, hits: totalHits });

        // citation numbering across the whole run, one number per document
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

        const blocks = perQuestion
          .map((q, i) => {
            const sources = q.chunks
              .map((c) => `[${cite(c)}] ${c.title}\n${c.content}`)
              .join("\n\n");
            return `Question ${i + 1}: ${q.question}\nSources:\n${sources || "(none)"}`;
          })
          .join("\n\n=====\n\n");

        const th = await step("think", "Drafting grounded answers");
        let output = "";
        for await (const delta of ai().generateTextStream(blocks, SYSTEM)) {
          output += delta;
          send({ type: "delta", text: delta });
        }
        await finishStep(th, { model: "gemini-2.5-flash" });

        const r = await step("respond", "Assembling the answer document");
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
