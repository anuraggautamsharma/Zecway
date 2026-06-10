"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Upload({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let done = 0;
    for (const file of Array.from(files)) {
      setStatus(`Adding ${file.name} to the graph…`);
      const form = new FormData();
      form.set("workspace_id", workspaceId);
      form.set("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: form });
      if (res.ok) {
        done++;
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus(`${file.name}: ${data.error ?? "upload failed"}`);
        setUploading(false);
        router.refresh();
        return;
      }
    }
    setStatus(`${done} document${done === 1 ? "" : "s"} added to the graph.`);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  return (
    <section className="dot-grid rounded-xl border border-dashed border-line p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mist">
        Add to the library
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
          className="text-xs text-mist file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-dark-elevated"
        />
      </div>
      {status && <p className="mt-3 text-xs text-mist">{status}</p>}
    </section>
  );
}
