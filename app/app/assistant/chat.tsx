"use client";

import { useEffect, useRef, useState } from "react";

type Citation = { n: number; title: string; url: string | null };
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};
type Conversation = { id: string; title: string; updated_at: string };

function Citations({ list }: { list: Citation[] }) {
  if (!list || list.length === 0) return null;
  return (
    <ul className="mt-3 space-y-1 border-t border-line pt-2.5">
      {list.map((c) => (
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
  );
}

export default function Chat({
  workspaceId,
  conversations,
  initialId,
  initialMessages,
}: {
  workspaceId: string;
  conversations: Conversation[];
  initialId: string | null;
  initialMessages: ChatMessage[];
}) {
  const [convId, setConvId] = useState<string | null>(initialId);
  const [msgs, setMsgs] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || busy) return;
    setError("");
    setBusy(true);
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: message }, { role: "assistant", content: "" }]);

    const patchLast = (patch: Partial<ChatMessage>) =>
      setMsgs((m) => {
        const next = [...m];
        next[next.length - 1] = { ...next[next.length - 1], ...patch };
        return next;
      });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          conversation_id: convId ?? undefined,
          message,
        }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        setError(data.error ?? "Something went wrong, please try again.");
        setMsgs((m) => m.slice(0, -1));
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
            text?: string;
            citations?: Citation[];
            conversation_id?: string;
            error?: string;
          };
          try {
            m = JSON.parse(line);
          } catch {
            continue;
          }
          if (m.type === "meta" && m.conversation_id) {
            if (!convId) {
              setConvId(m.conversation_id);
              window.history.replaceState(null, "", `/app/assistant?c=${m.conversation_id}`);
            }
          } else if (m.type === "delta" && m.text) {
            acc += m.text;
            patchLast({ content: acc });
          } else if (m.type === "done") {
            patchLast({ citations: m.citations ?? [] });
          } else if (m.type === "error" && m.error) {
            setError(m.error);
            if (!acc) setMsgs((mm) => mm.slice(0, -1));
          }
        }
      }
    } catch {
      setError("Something went wrong, please try again.");
      setMsgs((m) => (m[m.length - 1]?.content === "" ? m.slice(0, -1) : m));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-8">
      {/* conversation rail */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <a
          href="/app/assistant"
          className="block rounded-lg bg-ink px-3.5 py-2 text-center text-xs font-medium text-white transition active:scale-[0.97]"
        >
          New chat
        </a>
        <div className="mt-4 space-y-0.5">
          {conversations.map((c) => (
            <a
              key={c.id}
              href={`/app/assistant?c=${c.id}`}
              className={`block truncate rounded-lg px-3 py-2 text-xs transition ${
                c.id === convId
                  ? "bg-card font-medium text-ink"
                  : "text-mist hover:bg-paper/60 hover:text-ink"
              }`}
            >
              {c.title}
            </a>
          ))}
          {conversations.length === 0 && (
            <p className="px-3 py-2 text-xs text-mist/70">No chats yet</p>
          )}
        </div>
      </aside>

      {/* thread */}
      <div className="flex min-h-[70vh] min-w-0 flex-1 flex-col">
        <div className="flex-1 space-y-4">
          {msgs.length === 0 && (
            <div className="pt-10 text-center">
              <h1 className="font-display text-3xl text-ink">Assistant</h1>
              <p className="mx-auto mt-2 max-w-sm text-sm text-mist">
                A conversation grounded in your company&apos;s knowledge. Ask,
                then ask follow-ups — every claim cited, permissions always
                respected.
              </p>
            </div>
          )}
          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-sm leading-relaxed text-white">
                  {m.content}
                </p>
              </div>
            ) : (
              <div
                key={i}
                className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-paper px-5 py-4 shadow-[0_1px_1px_rgba(20,20,19,0.03),0_12px_24px_-16px_rgba(20,20,19,0.2)]"
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                  {m.content || (busy && i === msgs.length - 1 ? "…" : "")}
                </p>
                <Citations list={m.citations ?? []} />
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <form
          onSubmit={send}
          className="sticky bottom-4 mt-6 flex items-center gap-2 rounded-xl border border-line bg-paper p-1.5 shadow-[0_8px_24px_-12px_rgba(20,20,19,0.25)] transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={msgs.length === 0 ? "Ask your company anything…" : "Ask a follow-up…"}
            autoFocus
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-ink placeholder:text-mist focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-dark-elevated active:scale-[0.97] disabled:opacity-40"
          >
            {busy ? "Thinking…" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
