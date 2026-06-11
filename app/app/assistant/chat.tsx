"use client";

import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";

type Citation = { n: number; title: string; url: string | null };
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  searching?: string; // transient: the retrieval query, shown while it runs
  work?: { query: string }; // kept after the answer: the "show work" receipt
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

export default function Chat({
  workspaceId,
  conversations,
  initialId,
  initialMessages,
  sources = [],
  initialAsk = null,
  suggestions = [],
}: {
  workspaceId: string;
  conversations: Conversation[];
  initialId: string | null;
  initialMessages: ChatMessage[];
  sources?: string[];
  initialAsk?: string | null;
  suggestions?: string[];
}) {
  const [convId, setConvId] = useState<string | null>(initialId);
  const [msgs, setMsgs] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // per-conversation scope, sent with every turn
  const [days, setDays] = useState(0);
  const [selSources, setSelSources] = useState<string[]>([]);
  const [scopeOpen, setScopeOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  // a question handed over from the Home bar starts the chat immediately
  const autoSent = useRef(false);
  useEffect(() => {
    if (initialAsk && initialMessages.length === 0 && !autoSent.current) {
      autoSent.current = true;
      sendMessage(initialAsk);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(message: string) {
    if (!message || busy) return;
    setError("");
    setBusy(true);
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
          ...(days > 0 ? { days } : {}),
          ...(selSources.length > 0 ? { sources: selSources } : {}),
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
            query?: string;
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
          } else if (m.type === "searching" && m.query) {
            patchLast({ searching: m.query });
          } else if (m.type === "delta" && m.text) {
            acc += m.text;
            patchLast({ content: acc });
          } else if (m.type === "done") {
            setMsgs((mm) => {
              const next = [...mm];
              const last = next[next.length - 1];
              next[next.length - 1] = {
                ...last,
                citations: m.citations ?? [],
                work: last.searching ? { query: last.searching } : undefined,
                searching: undefined,
              };
              return next;
            });
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
              {suggestions.length > 0 && (
                <div className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-1.5">
                  {suggestions.map((sg) => (
                    <button
                      key={sg}
                      type="button"
                      onClick={() => sendMessage(sg)}
                      className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs text-mist transition hover:border-accent/50 hover:text-accent active:scale-[0.97]"
                    >
                      {sg}
                    </button>
                  ))}
                </div>
              )}
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
                {m.searching && (
                  <p className="mb-2 font-mono text-[11px] text-mist">
                    <span className="text-accent">⌕</span> searching the graph:{" "}
                    {m.searching}
                  </p>
                )}
                {m.work && (
                  <p className="mb-2 font-mono text-[11px] text-mist/80">
                    <span className="text-accent">⌕</span> searched:{" "}
                    <a
                      href={`/app?q=${encodeURIComponent(m.work.query)}`}
                      className="underline decoration-line underline-offset-2 hover:text-accent"
                    >
                      {m.work.query}
                    </a>
                  </p>
                )}
                {m.content ? (
                  <div className="md-body text-sm leading-relaxed text-ink">
                    <Markdown>{m.content}</Markdown>
                  </div>
                ) : (
                  <p className="text-sm text-mist">
                    {busy && i === msgs.length - 1 && !m.searching ? "…" : ""}
                  </p>
                )}
                <Citations list={m.citations ?? []} />
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const m = input.trim();
            setInput("");
            sendMessage(m);
          }}
          className="sticky bottom-4 mt-6 flex items-center gap-2 rounded-xl border border-line bg-paper p-1.5 shadow-[0_8px_24px_-12px_rgba(20,20,19,0.25)] transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setScopeOpen(!scopeOpen)}
              aria-label="Scope"
              className={`ml-1 flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                days > 0 || selSources.length > 0
                  ? "border-accent/60 bg-accent-soft text-accent-deep"
                  : "border-line text-mist hover:text-ink"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
              </svg>
            </button>
            {scopeOpen && (
              <div className="animate-pop absolute bottom-11 left-0 z-20 w-60 rounded-xl border border-line bg-paper p-3 shadow-xl">
                <p className="font-mono text-[10px] uppercase tracking-wider text-mist">time</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {TIME_SCOPES.map((t) => (
                    <button
                      key={t.days}
                      type="button"
                      onClick={() => setDays(t.days)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                        days === t.days
                          ? "border-accent/60 bg-accent-soft text-accent-deep"
                          : "border-line text-mist hover:text-ink"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {sources.length > 1 && (
                  <>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-mist">sources</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {sources.map((s) => {
                        const on = selSources.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setSelSources(on ? selSources.filter((x) => x !== s) : [...selSources, s])
                            }
                            className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                              on
                                ? "border-accent/60 bg-accent-soft text-accent-deep"
                                : "border-line text-mist hover:text-ink"
                            }`}
                          >
                            {sourceLabel(s)}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <p className="mt-3 text-[10px] leading-relaxed text-mist/80">
                  Applies to every question in this chat. Permissions are always enforced.
                </p>
              </div>
            )}
          </div>
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
