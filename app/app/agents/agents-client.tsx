"use client";

import { useState } from "react";

type Citation = { n: number; title: string; url: string | null };
export type RunSummary = {
  id: string;
  agent_slug: string;
  status: string;
  created_at: string;
};
export type RunDetail = {
  id: string;
  status: string;
  output: string | null;
  citations: Citation[];
  steps: { idx: number; kind: string; title: string; status: string; detail: object }[];
};

type StepView = { idx: number; kind: string; title: string; status: string };

const KIND_ICON: Record<string, string> = {
  trigger: "⚡",
  search: "⌕",
  read: "📄",
  think: "🧠",
  respond: "✎",
};

// Minimal markdown: bold + headings render, everything else stays literal.
function Output({ text }: { text: string }) {
  return (
    <div className="whitespace-pre-wrap font-display text-base leading-relaxed text-ink">
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>,
      )}
    </div>
  );
}

export default function AgentsClient({
  workspaceId,
  runs,
  initialRun,
}: {
  workspaceId: string;
  runs: RunSummary[];
  initialRun: RunDetail | null;
}) {
  const [questions, setQuestions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [steps, setSteps] = useState<StepView[]>(initialRun?.steps ?? []);
  const [output, setOutput] = useState(initialRun?.output ?? "");
  const [citations, setCitations] = useState<Citation[]>(initialRun?.citations ?? []);
  const [progress, setProgress] = useState("");
  const [copied, setCopied] = useState(false);
  const viewingHistory = Boolean(initialRun);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !questions.trim()) return;
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
          agent_slug: "rfp-answerer",
          input: { questions },
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
            type: string;
            idx?: number;
            kind?: string;
            title?: string;
            status?: string;
            text?: string;
            done?: number;
            total?: number;
            run_id?: string;
            citations?: Citation[];
            error?: string;
          };
          try {
            m = JSON.parse(line);
          } catch {
            continue;
          }
          if (m.type === "meta" && m.run_id) {
            window.history.replaceState(null, "", `/app/agents?run=${m.run_id}`);
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
            setProgress(`question ${m.done}/${m.total}`);
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
    <div className="flex gap-8">
      {/* run history rail */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <a
          href="/app/agents"
          className="block rounded-lg bg-ink px-3.5 py-2 text-center text-xs font-medium text-white transition active:scale-[0.97]"
        >
          New run
        </a>
        <p className="mt-4 px-3 font-mono text-[10px] uppercase tracking-wider text-mist">
          run history
        </p>
        <div className="mt-1 space-y-0.5">
          {runs.map((r) => (
            <a
              key={r.id}
              href={`/app/agents?run=${r.id}`}
              className={`block truncate rounded-lg px-3 py-2 text-xs transition ${
                r.id === initialRun?.id
                  ? "bg-card font-medium text-ink"
                  : "text-mist hover:bg-paper/60 hover:text-ink"
              }`}
            >
              {r.status === "failed" ? "✕ " : ""}
              RFP answers ·{" "}
              {new Date(r.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </a>
          ))}
          {runs.length === 0 && <p className="px-3 py-2 text-xs text-mist/70">No runs yet</p>}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl border border-line bg-paper p-6">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-lg font-semibold text-ink">RFP answerer</h1>
            <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-deep">
              agent
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-mist">
            Paste questionnaire questions — one per line, up to 10. The agent
            searches the graph per question and drafts cited answers.
          </p>
          <p className="mt-2 font-mono text-[11px] text-mist/80">
            runs as you · sees only what you can see · every claim cited
          </p>

          {!viewingHistory && (
            <form onSubmit={run} className="mt-5">
              <textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                rows={5}
                placeholder={
                  "What is your data retention policy?\nDo you support SSO?\nWhere is customer data stored?"
                }
                className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
              />
              <div className="mt-3 flex items-center gap-3">
                <button
                  disabled={busy || !questions.trim()}
                  className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97] disabled:opacity-40"
                >
                  {busy ? "Running…" : "Run agent"}
                </button>
                {progress && (
                  <span className="font-mono text-[11px] text-mist">{progress}</span>
                )}
              </div>
            </form>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        {/* the run, step by step — receipts before results */}
        {steps.length > 0 && (
          <div className="mt-5 space-y-2">
            {steps.map((s) => (
              <div
                key={s.idx}
                className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3"
              >
                <span className="text-base">{KIND_ICON[s.kind] ?? "·"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{s.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-mist">
                    step {s.idx + 1} · {s.kind}
                  </p>
                </div>
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
                Answer document
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
            <div className="mt-4">
              <Output text={output} />
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
  );
}
