"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Doc = { id: string; title: string; source: string; created_at: string };
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

export default function Workspace({
  workspaceId,
  workspaceName,
  documents,
}: {
  workspaceId: string;
  workspaceName: string;
  documents: Doc[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploading, setUploading] = useState(false);

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

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let done = 0;
    for (const file of Array.from(files)) {
      setUploadStatus(`Adding ${file.name} to the graph…`);
      const form = new FormData();
      form.set("workspace_id", workspaceId);
      form.set("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: form });
      if (res.ok) {
        done++;
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadStatus(`${file.name}: ${data.error ?? "upload failed"}`);
        setUploading(false);
        router.refresh();
        return;
      }
    }
    setUploadStatus(`${done} document${done === 1 ? "" : "s"} added to the graph.`);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  const showResults = query.trim().length >= 2;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{workspaceName}</h1>
        <p className="mt-1 text-sm text-mist">
          {documents.length === 0
            ? "Your graph is empty — add the first documents below."
            : `${documents.length} document${documents.length === 1 ? "" : "s"} in the graph.`}
        </p>
      </div>

      {/* Search + Ask */}
      <section>
        <form
          onSubmit={ask}
          className="flex items-center gap-2 rounded-xl border border-line bg-white p-1.5 shadow-[0_1px_2px_rgba(23,21,19,0.04)] transition focus-within:border-ink/30"
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
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-mist focus:outline-none"
          />
          <button
            type="submit"
            disabled={asking || documents.length === 0 || !query.trim()}
            className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent disabled:opacity-40"
          >
            {asking ? "Thinking…" : "Ask AI"}
          </button>
        </form>

        {askError && <p className="mt-3 text-xs text-red-500">{askError}</p>}

        {/* AI answer */}
        {answer && (
          <div className="animate-pop mt-4 rounded-xl border border-line bg-white p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              Answer
            </div>
            <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {answer}
            </p>
            {citations.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <ul className="space-y-1">
                  {citations.map((c) => (
                    <li key={c.n} className="text-xs text-mist">
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

        {/* Instant results */}
        {showResults && (
          <div className="mt-4">
            {results.length > 0 ? (
              <ul className="divide-y divide-line rounded-xl border border-line bg-white">
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
                      <span className="shrink-0 text-xs text-mist">{r.source}</span>
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
      </section>

      {/* Upload */}
      <section className="dot-grid rounded-xl border border-dashed border-line p-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mist">
          Add to the graph
        </h2>
        <p className="mt-1.5 text-sm text-mist">
          Drop in PDFs, Word docs, markdown, or text files — they become searchable,
          cited knowledge. Connectors (Google Drive, Slack) are coming next.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".md,.markdown,.txt,.pdf,.docx"
            onChange={(e) => uploadFiles(e.target.files)}
            disabled={uploading}
            className="text-xs text-mist file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-accent"
          />
        </div>
        {uploadStatus && <p className="mt-3 text-xs text-mist">{uploadStatus}</p>}
      </section>

      {/* Documents */}
      {documents.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mist">
            In the graph
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-5 py-3">
                <span className="truncate text-sm text-ink">{d.title}</span>
                <span className="ml-4 shrink-0 text-xs text-mist">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
