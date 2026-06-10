"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Doc = { id: string; title: string; source: string; created_at: string };
type Citation = { n: number; title: string; url: string | null };

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

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [askError, setAskError] = useState("");

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

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    setAskError("");
    setAnswer(null);
    setCitations([]);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId, question }),
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{workspaceName}</h1>
        <p className="mt-1 text-sm text-mist">
          {documents.length === 0
            ? "Your graph is empty — add the first documents below."
            : `${documents.length} document${documents.length === 1 ? "" : "s"} in the graph.`}
        </p>
      </div>

      {/* Ask */}
      <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_20px_60px_-30px_rgba(240,89,10,0.35)]">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">Ask</h2>
        <form onSubmit={ask} className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your company…"
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-mist focus:border-accent/50 focus:outline-none"
          />
          <button
            disabled={asking || documents.length === 0}
            className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep disabled:opacity-50"
          >
            {asking ? "Thinking…" : "Ask"}
          </button>
        </form>

        {askError && <p className="mt-3 text-xs text-red-500">{askError}</p>}

        {answer && (
          <div className="animate-pop mt-5 rounded-xl border border-line bg-paper p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{answer}</p>
            {citations.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-mist">
                  Sources
                </p>
                <ul className="mt-2 space-y-1">
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
      </section>

      {/* Upload */}
      <section className="dot-grid rounded-2xl border border-dashed border-line p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">
          Add to the graph
        </h2>
        <p className="mt-1 text-sm text-mist">
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
            className="text-xs text-mist file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-accent-deep"
          />
        </div>
        {uploadStatus && <p className="mt-3 text-xs text-mist">{uploadStatus}</p>}
      </section>

      {/* Documents */}
      {documents.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-mist">
            In the graph
          </h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
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
