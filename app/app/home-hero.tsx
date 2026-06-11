"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SearchAsk from "./search-ask";

// Time-of-day greeting; resolved after mount to keep SSR hydration clean.
function Greeting({ name }: { name: string }) {
  const [greet, setGreet] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  return (
    <h1 className="font-display text-3xl text-ink sm:text-4xl">
      {greet}, {name}
    </h1>
  );
}

export default function HomeHero({
  workspaceId,
  hasDocuments,
  sources,
  suggestions,
  initialQuery,
  userName,
}: {
  workspaceId: string;
  hasDocuments: boolean;
  sources: string[];
  suggestions: string[];
  initialQuery: string;
  userName: string;
}) {
  const [tab, setTab] = useState<"search" | "chat">("search");
  const [chatQ, setChatQ] = useState("");
  const router = useRouter();
  const chatInput = useRef<HTMLInputElement>(null);

  return (
    <div>
      <Greeting name={userName} />

      <div className="mt-6 rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_1px_rgba(20,20,19,0.03),0_16px_32px_-24px_rgba(20,20,19,0.3)]">
        {/* search / chat tabs, one bar */}
        <div className="mb-4 flex items-center gap-5 border-b border-line pb-0">
          {(
            [
              ["search", "Search"],
              ["chat", "Chat"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                if (key === "chat") setTimeout(() => chatInput.current?.focus(), 0);
              }}
              className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition ${
                tab === key
                  ? "border-accent text-ink"
                  : "border-transparent text-mist hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto pb-2.5 font-mono text-[10px] uppercase tracking-wider text-mist/70">
            {tab === "search" ? "instant · permission-checked" : "grounded · cited"}
          </span>
        </div>

        {tab === "search" ? (
          <SearchAsk
            workspaceId={workspaceId}
            hasDocuments={hasDocuments}
            sources={sources}
            initialQuery={initialQuery}
          />
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatQ.trim()) return;
              router.push(`/app/assistant?ask=${encodeURIComponent(chatQ.trim())}`);
            }}
            className="flex items-center gap-2 rounded-xl border border-line bg-paper p-1.5 transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2.5 shrink-0 text-mist">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <input
              ref={chatInput}
              value={chatQ}
              onChange={(e) => setChatQ(e.target.value)}
              placeholder="Ask anything — follow-ups welcome…"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-ink placeholder:text-mist focus:outline-none"
            />
            <button
              type="submit"
              disabled={!chatQ.trim()}
              className="shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-dark-elevated active:scale-[0.97] disabled:opacity-40"
            >
              Start chat
            </button>
          </form>
        )}

        {/* suggested questions from the workspace's own library */}
        {suggestions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <a
                key={s}
                href={`/app?q=${encodeURIComponent(s)}`}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs text-mist transition hover:border-accent/50 hover:text-accent"
              >
                {s}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
