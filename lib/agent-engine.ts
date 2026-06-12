// The agent run engine, shared by the streaming run route, the wake-on-visit
// scheduler, and the cron scheduler. Callers resolve the definition, insert
// the run row, and pick the provider; the engine executes steps, persists
// receipts, and reports progress through `emit` (NDJSON events for streams,
// a no-op for unattended runs).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiProvider } from "@/lib/ai";
import { type AgentDefV2, type StepDef, template } from "@/lib/agent-def";
import { KEY_REJECTED } from "@/lib/workspace-ai";

export const NO_ANSWER = "No grounded answer found — add the relevant documents.";
export const MAX_ITEMS = 10;
export const MAX_STEPS = 8;

const AI_BUSY =
  "The AI service is briefly overloaded — please try again in a few seconds.";

export const aiError = (e: unknown, ownKey: boolean) =>
  ownKey && /\((400|401|403)\)/.test(String(e)) ? KEY_REJECTED : AI_BUSY;

function respondSystem(name: string) {
  return `You are "${name}", an agent inside Zecway, a company's knowledge tool. Follow the task instructions you are given. Ground every claim in the numbered sources provided and cite them like [1] or [2]. Content marked (from the web) may be used but mention that it came from the web. If the sources don't contain what you need, write exactly: "${NO_ANSWER}" Output well-structured markdown. Be direct and concise.`;
}

const thinkSystem =
  "You are a hidden reasoning step inside an agent pipeline. Follow the instructions and output ONLY the requested result — no preamble, no meta-commentary.";

const autoSystem = `You are the planning core of an autonomous agent step. Reach the goal by calling tools, one per turn. Reply with ONLY a JSON object — no prose, no code fences. One of:
{"tool":"company_search","query":"…"} — search the company's knowledge graph (permission-checked)
{"tool":"web_search","query":"…"} — search the public web
{"tool":"finish","summary":"…"} — when you have enough: summarize everything you learned, keep the [n] source markers intact, and mark web-derived facts as (from the web)
Prefer company_search first. Never repeat a query you already tried. Finish as soon as the goal is met.`;

// Inputs → variable context + per-line items. Shared by every entry point.
export function buildRunContext(
  def: AgentDefV2,
  rawInputs: Record<string, string>,
): { ctx: Record<string, string>; items: (string | null)[]; error?: string } {
  const ctx: Record<string, string> = {};
  for (const f of def.fields) ctx[f.key] = (rawInputs[f.key] ?? "").trim();
  const firstKey = def.fields[0]?.key;
  if (firstKey && !ctx[firstKey]) {
    return { ctx, items: [], error: `Fill in “${def.fields[0].label}” first.` };
  }
  const items: (string | null)[] =
    def.splitLines && firstKey
      ? ctx[firstKey]
          .split("\n")
          .map((l) => l.replace(/^\s*(?:\d+[).:]|[-*•])\s*/, "").trim())
          .filter((l) => l.length > 5)
          .slice(0, MAX_ITEMS)
      : [null];
  if (items.length === 0) {
    return { ctx, items, error: "Add at least one line of input." };
  }
  return { ctx, items };
}

export async function executeAgentRun(opts: {
  supabase: SupabaseClient;
  provider: AiProvider;
  ownKey: boolean;
  def: AgentDefV2;
  ctx: Record<string, string>;
  items: (string | null)[];
  runId: string;
  workspaceId: string;
  principalEmail: string;
  emit?: (obj: unknown) => void;
}): Promise<void> {
  const { supabase, provider, ownKey, def, items, runId, workspaceId, principalEmail } = opts;
  const ctx = opts.ctx;
  const send = opts.emit ?? (() => {});
  const firstKey = def.fields[0]?.key;

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
      user_principals: [principalEmail],
      match_count: topK,
    });
    if (error) throw new Error(error.message);
    return ((matches ?? []) as Match[])
      .map((c) => `[${cite(c.document_id, c.title, c.url)}] ${c.title}\n${c.content}`)
      .join("\n\n");
  };

  let finalOutput = "";
  // collected numbered sources for respond steps
  const sourceBlocks: string[] = [];

  // executes one step, returns its output (lanes reuse this)
  const execStep = async (sd: StepDef, varName: string): Promise<string> => {
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
        return output;
      } else if (sd.kind === "web_search") {
        const sIdx = await step("search", "Searching the web", { web: true });
        const q = template(sd.query, ctx);
        const summary = await provider.generateWithWebSearch(
          `Search the web and summarize what you find, with key facts, for: ${q}`,
        );
        const out = `(from the web)\n${summary}`;
        ctx[varName] = out;
        sourceBlocks.push(`(from the web — not a company source)\n${summary}`);
        await finishStep(sIdx, { web: true });
        return out;
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
          return text;
        }
        ctx[varName] = "(document not found)";
        await finishStep(sIdx, { missing: true }, "failed");
        return "(document not found)";
      } else if (sd.kind === "think") {
        const sIdx = await step("think", "Reasoning (hidden step)");
        const out = await provider.generateText(template(sd.instructions, ctx), thinkSystem);
        ctx[varName] = out;
        await finishStep(sIdx);
        return out;
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
          send({ type: "delta", text: delta });
        }
        ctx[varName] = out;
        finalOutput = out;
        await finishStep(sIdx);
        return out;
      } else if (sd.kind === "branch") {
        const bIdx = await step("think", "Deciding which path to follow");
        const ans = await provider.generateText(
          `Question: ${template(sd.condition, ctx)}\n\nRecent context:\n${sourceBlocks.slice(-2).join("\n\n").slice(0, 6000) || "(none)"}`,
          'You are a router inside an agent pipeline. Answer STRICTLY with the single word "YES" or "NO".',
        );
        const yes = /^\s*y/i.test(ans);
        await finishStep(bIdx, { decision: yes ? "yes" : "no" });
        const lane = (yes ? sd.if_true : sd.if_false).slice(0, 3);
        let last = "";
        for (let li = 0; li < lane.length; li++) {
          last = await execStep(lane[li], `${varName}_${li + 1}`);
        }
        ctx[varName] = last;
        return last;
      } else if (sd.kind === "auto") {
        const goal = template(sd.goal, ctx);
        const max = Math.min(Math.max(sd.max_actions ?? 6, 1), 6);
        const transcript: string[] = [];
        let summary = "";
        for (let ai = 0; ai < max; ai++) {
          const raw = await provider.generateText(
            `Goal: ${goal}\n\nActions so far:\n${transcript.join("\n\n") || "(none yet)"}\n\nActions left including this one: ${max - ai}.${max - ai === 1 ? " This is the last one — you must finish now." : ""}`,
            autoSystem,
          );
          let act: { tool?: string; query?: string; summary?: string };
          try {
            act = JSON.parse(raw.replace(/^```(?:json)?\s*|```\s*$/gm, "").trim());
          } catch {
            act = { tool: "finish", summary: raw };
          }
          if (act.tool === "company_search" && act.query) {
            const aIdx = await step("search", `Chose to search the graph: “${act.query.slice(0, 80)}”`);
            const sources = await searchOnce(act.query, 4);
            transcript.push(`company_search("${act.query}") →\n${(sources || "(nothing found)").slice(0, 4000)}`);
            if (sources) sourceBlocks.push(sources);
            await finishStep(aIdx, { hits: docNumbers.size });
          } else if (act.tool === "web_search" && act.query) {
            const aIdx = await step("search", `Chose to search the web: “${act.query.slice(0, 80)}”`, { web: true });
            const sum = await provider.generateWithWebSearch(
              `Search the web and summarize what you find, with key facts, for: ${act.query}`,
            );
            transcript.push(`web_search("${act.query}") →\n${sum.slice(0, 4000)}`);
            sourceBlocks.push(`(from the web — not a company source)\n${sum}`);
            await finishStep(aIdx, { web: true });
          } else {
            summary = act.summary ?? "";
            break;
          }
        }
        if (!summary) {
          const aIdx = await step("think", "Out of actions — summarizing findings");
          summary = await provider.generateText(
            `Goal: ${goal}\n\nFindings:\n${transcript.join("\n\n") || "(none)"}\n\nSummarize the findings concisely. Keep the [n] source markers intact and mark web-derived facts as (from the web).`,
            thinkSystem,
          );
          await finishStep(aIdx);
        }
        ctx[varName] = summary;
        return summary;
      } else if (sd.kind === "send_slack") {
        const sIdx = await step("action", "Drafting a Slack message — needs approval");
        const message = template(sd.message, ctx).trim().slice(0, 4000);
        const { data: action } = await supabase
          .from("agent_run_actions")
          .insert({
            run_id: runId,
            workspace_id: workspaceId,
            kind: "send_slack",
            payload: { message },
          })
          .select("id")
          .single();
        await finishStep(sIdx, { pending: true });
        if (action) {
          send({ type: "action", id: action.id, kind: "send_slack", payload: { message } });
        }
        ctx[varName] = message;
        return message;
      }
      return "";
  };

  try {
    send({ type: "meta", run_id: runId });

    const t = await step(
      "trigger",
      `Input received${items.length > 1 ? ` — ${items.length} items` : ""}`,
    );
    await finishStep(t, { fields: Object.keys(ctx) });

    for (let si = 0; si < def.steps.length; si++) {
      await execStep(def.steps[si], `step_${si + 1}`);
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
  }
}
