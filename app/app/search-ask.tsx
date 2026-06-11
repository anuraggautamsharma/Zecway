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

export default function SearchAsk({
  workspaceId,
  hasDocuments,
  suggestions = [],
}: {
  workspaceId: string;
  hasDocuments: boolean;
  suggestions?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [askError, setAskError] = useState("");

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
        const res = await fetch(
          `/api/search?workspace_id=${workspaceId}&q=${encodeURIComponent(q)}`,
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
  }, [query, workspaceId]);

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
        body: JSON.stringify({ workspace_id: workspaceId, question: query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAskError(data.error ?? "Something went wrong, please try again.");
        return;
      }
      setAnswer(data.answer);
      setCitations(data.citations ?? []);
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

      {/* nudge the blank-page moment: tap a question about your own library */}
      {!query && suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs text-mist transition hover:border-accent/50 hover:text-accent active:scale-[0.97]"
            >
              {s}
            </button>
          ))}
        </div>
      )}

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
