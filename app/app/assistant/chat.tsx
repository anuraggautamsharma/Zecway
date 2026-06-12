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
  userName = "there",
}: {
  workspaceId: string;
  conversations: Conversation[];
  initialId: string | null;
  initialMessages: ChatMessage[];
  sources?: string[];
  initialAsk?: string | null;
  suggestions?: string[];
  userName?: string;
}) {
  const [convId, setConvId] = useState<string | null>(initialId);
  const [msgs, setMsgs] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
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

  const visibleConvs = conversations.filter((c) =>
    c.title.toLowerCase().includes(filter.toLowerCase()),
  );
  const empty = msgs.length === 0;

  const composer = (
    <div className="shrink-0 px-4 pb-4 pt-2">
      {error && (
        <p className="mx-auto mb-2 w-full max-w-2xl text-xs text-red-500">{error}</p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const m = input.trim();
          setInput("");
          sendMessage(m);
        }}
        className="glass-chrome mx-auto flex w-full max-w-2xl items-center gap-1.5 rounded-2xl border border-line p-2 shadow-[0_12px_32px_-12px_rgba(20,20,19,0.25)] transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10"
      >
        <div className="relative">
          <button
            type="button"
            onClick={() => setScopeOpen(!scopeOpen)}
            aria-label="Scope"
            className={`ml-0.5 flex h-9 w-9 items-center justify-center rounded-xl border transition ${
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
            <div className="animate-pop absolute bottom-12 left-0 z-20 w-60 rounded-xl border border-line bg-paper p-3 shadow-xl">
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
          placeholder={empty ? "Ask your company anything…" : "Ask a follow-up…"}
          autoFocus
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-ink placeholder:text-mist focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="mr-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-deep active:scale-[0.95] disabled:opacity-40"
        >
          {busy ? (
            <span className="inline-block h-2 w-2 animate-pulse rounded-sm bg-white" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          )}
        </button>
      </form>
      <p className="mx-auto mt-2 w-full max-w-2xl text-center font-mono text-[10px] tracking-wide text-mist/70">
        every claim cited · permissions always enforced
      </p>
    </div>
  );

  return (
    <div className="flex h-[calc(100svh-3.5rem)] md:h-svh">
      {/* conversations sidebar — the chat app's own rail */}
      <aside className="glass-chrome hidden w-64 shrink-0 flex-col border-r border-line lg:flex">
        <div className="p-3">
          <a
            href="/app/assistant"
            className="flex items-center justify-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-medium text-ink shadow-sm transition hover:border-accent/40 hover:text-accent-deep"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New chat
          </a>
        </div>
        <div className="px-3 pb-1">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search chats…"
            className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-mist-soft focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="px-2 pb-1 pt-3 font-mono text-[10px] uppercase tracking-wider text-mist">
            Recents
          </p>
          <div className="space-y-0.5">
            {visibleConvs.map((c) => (
              <a
                key={c.id}
                href={`/app/assistant?c=${c.id}`}
                className={`block truncate rounded-lg px-2.5 py-2 text-[13px] transition ${
                  c.id === convId
                    ? "bg-card font-medium text-ink"
                    : "text-mist hover:bg-paper hover:text-ink"
                }`}
              >
                {c.title}
              </a>
            ))}
            {visibleConvs.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-mist/70">
                {filter ? "No matches" : "No chats yet"}
              </p>
            )}
          </div>
        </div>
        <div className="border-t border-line p-3">
          <p className="px-2 font-mono text-[10px] leading-relaxed text-mist/70">
            chats are private to you
          </p>
        </div>
      </aside>

      {/* main canvas */}
      <div className="flex min-w-0 flex-1 flex-col">
        {empty ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
              <h1 className="text-center font-display text-3xl text-ink sm:text-4xl">
                What can I find for you, {userName}?
              </h1>
              <p className="mt-3 max-w-sm text-center text-sm text-mist">
                Grounded in your company&apos;s knowledge — ask, then keep asking.
              </p>
              {suggestions.length > 0 && (
                <div className="mt-7 flex max-w-md flex-wrap justify-center gap-1.5">
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
            {composer}
          </>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-2xl space-y-7 px-4 pb-6 pt-8">
                {msgs.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <p className="max-w-[90%] whitespace-pre-wrap rounded-2xl bg-cream px-4 py-3 text-[15px] leading-relaxed text-ink">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <div key={i} className="px-0.5">
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
                        <div className="md-body text-[15px] leading-relaxed text-ink">
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
            </div>
            {composer}
          </>
        )}
      </div>
    </div>
  );
}
