"use client";

import { useEffect, useRef, useState } from "react";

type Citation = { n: number; title: string; url: string | null };
type Result = {
  document_id: string;
  title: string;
  url: string | null;
  source: string;
  snippet: string;
};

// Snippets arrive with [[term]] markers from Postgres; render them as
// highlights without ever injecting HTML.
function Snippet({ text }: { text: string }) {
  const parts = text.split(/\[\[(.+?)\]\]/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-accent-soft px-0.5 text-accent-deep">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  upload: "Uploads",
  gdrive: "Google Drive",
  slack: "Slack",
  notion: "Notion",
};
const sourceLabel = (s: string) =>
  SOURCE_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

const TIME_SCOPES = [
  { days: 0, label: "All time" },
  { days: 30, label: "Past 30 days" },
  { days: 7, label: "Past week" },
] as const;

export default function SearchAsk({
  workspaceId,
  hasDocuments,
  sources = [],
  initialQuery = "",
}: {
  workspaceId: string;
  hasDocuments: boolean;
  sources?: string[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [askError, setAskError] = useState("");
  // scope: 0 = all time; empty source list = all sources
  const [days, setDays] = useState(0);
  const [selSources, setSelSources] = useState<string[]>([]);

  // Instant search: debounce keystrokes, drop stale responses
  const searchSeq = useRef(0);
  useEffect(() => {
    const q = query.trim();
    setAnswer(null);
    setAskError("");
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const seq = ++searchSeq.current;
    const t = setTimeout(async () => {
      try {
        const scope =
          (days > 0 ? `&days=${days}` : "") +
          (selSources.length > 0 ? `&sources=${selSources.join(",")}` : "");
        const res = await fetch(
          `/api/search?workspace_id=${workspaceId}&q=${encodeURIComponent(q)}${scope}`,
        );
        const data = await res.json();
        if (seq === searchSeq.current) {
          setResults(data.results ?? []);
          setSearching(false);
        }
      } catch {
        if (seq === searchSeq.current) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, workspaceId, days, selSources]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || asking) return;
    setAsking(true);
    setAskError("");
    setAnswer(null);
    setCitations([]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          question: query,
          ...(days > 0 ? { days } : {}),
          ...(selSources.length > 0 ? { sources: selSources } : {}),
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        setAskError(data.error ?? "Something went wrong, please try again.");
        return;
      }
      // NDJSON stream: render the answer while the model writes it
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
          let msg: { type: string; text?: string; citations?: Citation[]; error?: string };
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }
          if (msg.type === "delta" && msg.text) {
            acc += msg.text;
            setAnswer(acc);
          } else if (msg.type === "done") {
            setCitations(msg.citations ?? []);
          } else if (msg.type === "error" && msg.error) {
            if (!acc) setAnswer(null);
            setAskError(msg.error);
          }
        }
      }
    } catch {
      setAskError("Something went wrong, please try again.");
    } finally {
      setAsking(false);
    }
  }

  const showResults = query.trim().length >= 2;

  return (
    <div>
      <form
        onSubmit={ask}
        className="flex items-center gap-2 rounded-xl border border-line bg-paper p-1.5 transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="ml-2.5 shrink-0 text-mist"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, or ask a question…"
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-mist focus:outline-none"
        />
        <button
          type="submit"
          disabled={asking || !hasDocuments || !query.trim()}
          className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-dark-elevated active:scale-[0.97] disabled:opacity-40"
        >
          {asking ? "Thinking…" : "Ask AI"}
        </button>
      </form>

      {/* scope panel: time + source filters, permission-checked server-side */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {TIME_SCOPES.map((t) => (
          <button
            key={t.days}
            type="button"
            onClick={() => setDays(t.days)}
            className={`rounded-full border px-3 py-1 text-[11px] font-medium transition active:scale-[0.97] ${
              days === t.days
                ? "border-accent/60 bg-accent-soft text-accent-deep"
                : "border-line bg-paper text-mist hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
        {sources.length > 1 && (
          <>
            <span className="mx-1 h-4 w-px bg-line" aria-hidden />
            {sources.map((s) => {
              const on = selSources.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    setSelSources(
                      on ? selSources.filter((x) => x !== s) : [...selSources, s],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition active:scale-[0.97] ${
                    on
                      ? "border-accent/60 bg-accent-soft text-accent-deep"
                      : "border-line bg-paper text-mist hover:text-ink"
                  }`}
                >
                  {sourceLabel(s)}
                </button>
              );
            })}
          </>
        )}
      </div>

      {askError && <p className="mt-3 text-xs text-red-500">{askError}</p>}

      {answer && (
        <div className="animate-pop mt-4 rounded-xl border border-line bg-paper p-5 shadow-[0_1px_1px_rgba(20,20,19,0.03),0_12px_24px_-16px_rgba(20,20,19,0.25)]">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Answer
          </div>
          <p className="mt-3 whitespace-pre-wrap font-display text-lg leading-relaxed text-ink">{answer}</p>
          {citations.length > 0 && (
            <div className="mt-4 border-t border-line pt-3">
              <ul className="space-y-1">
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
            </div>
          )}
        </div>
      )}

      {showResults && (
        <div className="mt-4">
          {results.length > 0 ? (
            <ul className="divide-y divide-line rounded-xl border border-line bg-paper shadow-[0_1px_1px_rgba(20,20,19,0.03),0_12px_24px_-16px_rgba(20,20,19,0.25)]">
              {results.map((r) => (
                <li key={r.document_id} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium text-ink">
                      {r.url ? (
                        <a href={r.url} className="hover:text-accent">
                          {r.title}
                        </a>
                      ) : (
                        r.title
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-mist">{r.source}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist">
                    <Snippet text={r.snippet} />
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            !searching &&
            !answer && (
              <p className="px-1 text-xs text-mist">
                No matches — try different words, or press Ask AI for a synthesized
                answer.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
