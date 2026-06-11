"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { StepGlyph } from "../new/builder";
import { STEP_META, type FieldDef, type StepDef } from "@/lib/agent-def";

type Citation = { n: number; title: string; url: string | null };
export type AgentView = {
  id: string | null;
  slug: string;
  name: string;
  description: string;
  emoji: string;
  splitLines: boolean;
  fields: FieldDef[];
  steps: StepDef[];
  builtin: boolean;
};
export type RunSummary = { id: string; status: string; created_at: string };
export type RunDetail = {
  id: string;
  status: string;
  output: string | null;
  citations: Citation[];
  steps: { idx: number; kind: string; title: string; status: string }[];
};

type StepView = { idx: number; kind: string; title: string; status: string };

// The recipe, drawn from the agent's actual steps.
function Flow({ agent }: { agent: AgentView }) {
  const steps: { kind: string; label: string; text: string }[] = [
    {
      kind: "trigger",
      label: "Trigger",
      text: `Runs manually with ${agent.fields.map((f) => `“${f.label}”`).join(", ")}${agent.splitLines ? " — first field one item per line" : ""}`,
    },
    ...agent.steps.map((s) => ({
      kind: s.kind,
      label: STEP_META[s.kind].label,
      text: STEP_META[s.kind].blurb,
    })),
  ];
  return (
    <ol className="relative space-y-0">
      {steps.map((s, i) => (
        <li key={s.kind} className="relative flex gap-3 pb-4">
          {i < steps.length - 1 && (
            <span className="absolute left-[15px] top-8 h-full w-px bg-line" aria-hidden />
          )}
          <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper font-mono text-[10px] text-mist">
            {i}
          </span>
          <div className="pt-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
              {s.label}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-mist">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function RunClient({
  workspaceId,
  agent,
  runs,
  initialRun,
}: {
  workspaceId: string;
  agent: AgentView;
  runs: RunSummary[];
  initialRun: RunDetail | null;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState<StepView[]>(initialRun?.steps ?? []);
  const [output, setOutput] = useState(initialRun?.output ?? "");
  const [citations, setCitations] = useState<Citation[]>(initialRun?.citations ?? []);
  const [progress, setProgress] = useState("");
  const [copied, setCopied] = useState(false);
  const viewingHistory = Boolean(initialRun);
  const base = `/app/agents/${agent.id ?? agent.slug}`;

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const firstVal = (inputs[agent.fields[0]?.key] ?? "").trim();
    if (busy || !firstVal) return;
    setBusy(true);
    setError("");
    setSteps([]);
    setOutput("");
    setCitations([]);

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          ...(agent.id ? { agent_id: agent.id } : { agent_slug: agent.slug }),
          input: { inputs },
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        setError(data.error ?? "Something went wrong, please try again.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let m: {
            type: string; idx?: number; kind?: string; title?: string;
            status?: string; text?: string; done?: number; total?: number;
            run_id?: string; citations?: Citation[]; error?: string;
          };
          try {
            m = JSON.parse(line);
          } catch {
            continue;
          }
          if (m.type === "meta" && m.run_id) {
            window.history.replaceState(null, "", `${base}?run=${m.run_id}`);
          } else if (m.type === "step" && typeof m.idx === "number") {
            const idx = m.idx;
            setSteps((s) => {
              const next = [...s];
              const at = next.findIndex((x) => x.idx === idx);
              if (at >= 0) {
                next[at] = { ...next[at], status: m.status ?? next[at].status };
              } else {
                next.push({
                  idx,
                  kind: m.kind ?? "think",
                  title: m.title ?? "",
                  status: m.status ?? "running",
                });
              }
              return next.sort((a, b) => a.idx - b.idx);
            });
          } else if (m.type === "search_progress") {
            setProgress(`item ${m.done}/${m.total}`);
          } else if (m.type === "delta" && m.text) {
            acc += m.text;
            setOutput(acc);
          } else if (m.type === "done") {
            setCitations(m.citations ?? []);
            setProgress("");
          } else if (m.type === "error" && m.error) {
            setError(m.error);
          }
        }
      }
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 font-mono text-[11px] text-mist">
        <a href="/app/agents" className="hover:text-accent">
          agents
        </a>
        <span>/</span>
        <span className="text-ink">{agent.name.toLowerCase()}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* left: identity + recipe + history */}
        <aside>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-xl">
              {agent.emoji}
            </span>
            <div>
              <h1 className="text-base font-semibold text-ink">{agent.name}</h1>
              <p className="font-mono text-[10px] uppercase tracking-wide text-mist">
                {agent.builtin ? "built-in" : "custom"} agent
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-mist">{agent.description}</p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-mist/80">
            runs as you · sees only what you can see · every claim cited
          </p>
          {!agent.builtin && (
            <a
              href={`/app/agents/${agent.id}/edit`}
              className="mt-3 inline-block rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mist transition hover:border-accent/50 hover:text-accent"
            >
              Edit agent
            </a>
          )}

          <h2 className="mb-3 mt-7 font-mono text-[10px] uppercase tracking-wider text-mist">
            how it works
          </h2>
          <Flow agent={agent} />

          <h2 className="mb-2 mt-7 font-mono text-[10px] uppercase tracking-wider text-mist">
            run history
          </h2>
          <div className="space-y-0.5">
            {runs.map((r) => (
              <a
                key={r.id}
                href={`${base}?run=${r.id}`}
                className={`block truncate rounded-lg px-2.5 py-1.5 text-xs transition ${
                  r.id === initialRun?.id
                    ? "bg-card font-medium text-ink"
                    : "text-mist hover:bg-cream hover:text-ink"
                }`}
              >
                {r.status === "failed" ? "✕ " : ""}
                {new Date(r.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </a>
            ))}
            {runs.length === 0 && <p className="px-2.5 py-1.5 text-xs text-mist/70">No runs yet</p>}
          </div>
        </aside>

        {/* right: run it */}
        <div className="min-w-0">
          {!viewingHistory && (
            <form onSubmit={run} className="space-y-4 rounded-2xl border border-line bg-paper p-5">
              {agent.fields.map((f, fi) => (
                <div key={f.key}>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    {f.label}
                    {fi === 0 && agent.splitLines && (
                      <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-mist">
                        one item per line · up to 10
                      </span>
                    )}
                  </label>
                  {f.long ? (
                    <textarea
                      value={inputs[f.key] ?? ""}
                      onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })}
                      rows={fi === 0 ? 5 : 3}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
                    />
                  ) : (
                    <input
                      value={inputs[f.key] ?? ""}
                      onChange={(e) => setInputs({ ...inputs, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-line bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
                    />
                  )}
                </div>
              ))}
              <div className="mt-3 flex items-center gap-3">
                <button
                  disabled={busy || !(inputs[agent.fields[0]?.key] ?? "").trim()}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97] disabled:opacity-40"
                >
                  {busy ? "Running…" : "Run agent"}
                </button>
                {progress && <span className="font-mono text-[11px] text-mist">{progress}</span>}
                {viewingHistory ? null : (
                  <a href={base} className="ml-auto text-xs text-mist hover:text-ink">
                    reset
                  </a>
                )}
              </div>
            </form>
          )}
          {viewingHistory && (
            <a
              href={base}
              className="inline-block rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white transition active:scale-[0.97]"
            >
              ← New run
            </a>
          )}

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

          {steps.length > 0 && (
            <div className="mt-5 space-y-2">
              {steps.map((s) => (
                <div
                  key={s.idx}
                  className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-2.5"
                >
                  <span className="font-mono text-[10px] text-mist">{s.idx}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{s.title}</p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-mist">
                    {s.kind}
                  </span>
                  {s.status === "running" ? (
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent" />
                  ) : s.status === "failed" ? (
                    <span className="text-xs text-red-500">failed</span>
                  ) : (
                    <span className="text-xs text-accent">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {output && (
            <div className="animate-pop mt-5 rounded-2xl border border-line bg-paper p-6 shadow-[0_1px_1px_rgba(20,20,19,0.03),0_12px_24px_-16px_rgba(20,20,19,0.25)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  Output
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(output);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1600);
                  }}
                  className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mist transition hover:border-accent/50 hover:text-accent"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <div className="md-body mt-4 text-[15px] leading-relaxed text-ink">
                <Markdown>{output}</Markdown>
              </div>
              {citations.length > 0 && (
                <ul className="mt-5 space-y-1 border-t border-line pt-3">
                  {citations.map((c) => (
                    <li key={c.n} className="font-mono text-[11px] text-mist">
                      <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-deep">
                        {c.n}
                      </span>
                      {c.url ? (
                        <a href={c.url} className="text-accent hover:text-accent-deep">
                          {c.title}
                        </a>
                      ) : (
                        c.title
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
