"use client";

import { useEffect, useState } from "react";

const DEMOS = [
  {
    query: "Where's the latest pricing deck?",
    answer:
      "Pricing v4.2, updated Tuesday by Marcus — here's the deck, and the thread explaining what changed for annual plans.",
    sources: [
      { icon: "📁", label: "Pricing v4.2 · Drive" },
      { icon: "💬", label: "#go-to-market · Slack" },
    ],
  },
  {
    query: "Who owns customer onboarding?",
    answer:
      "Priya has owned onboarding since the March reorg. The runbook, checklist, and handoff doc are all linked from the team page.",
    sources: [
      { icon: "📝", label: "Onboarding runbook · Notion" },
      { icon: "💬", label: "#announcements · Slack" },
    ],
  },
  {
    query: "What's our parental leave policy?",
    answer:
      "Full-time employees get 18 weeks of fully paid parental leave, extendable by 4 unpaid weeks.",
    sources: [
      { icon: "📄", label: "HR Policy 2026 · Google Drive" },
      { icon: "💬", label: "#people-ops · Slack" },
    ],
  },
];

export default function SearchDemo() {
  const [demo, setDemo] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "answer">("typing");

  // Let the page (e.g. the hero's particle field) react to the demo's rhythm
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("zecway-demo-phase", { detail: phase }));
  }, [phase]);

  useEffect(() => {
    const { query } = DEMOS[demo];
    if (phase === "typing") {
      if (typed.length < query.length) {
        const t = setTimeout(() => setTyped(query.slice(0, typed.length + 1)), 45);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("answer"), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setTyped("");
      setPhase("typing");
      setDemo((demo + 1) % DEMOS.length);
    }, 4200);
    return () => clearTimeout(t);
  }, [typed, phase, demo]);

  const current = DEMOS[demo];

  return (
    <div className="relative mx-auto w-full max-w-2xl rounded-2xl bg-dark p-4 sm:p-6">
      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-lg bg-dark-elevated px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-on-dark-soft">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={`min-h-6 text-sm text-on-dark ${phase === "typing" ? "caret" : ""}`}>
          {typed}
        </span>
      </div>

      {/* Answer — or, while the question types, a quiet skeleton of what's coming */}
      <div className="relative mt-4 min-h-[148px] border-t border-white/10 pt-4">
        {phase === "answer" ? (
          <div className="animate-pop">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              Answer
            </div>
            <p className="mt-3 font-display text-lg leading-relaxed text-on-dark">{current.answer}</p>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {current.sources.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-md bg-dark-elevated px-2.5 py-1 font-mono text-[11px] text-on-dark-soft"
                >
                  <span>{s.icon}</span> {s.label}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-on-dark-soft">
              Only from documents <em>you</em> are allowed to see — always.
            </p>
          </div>
        ) : (
          <div aria-hidden>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-on-dark-soft/50">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent/60" />
              Searching the graph
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="h-3 w-11/12 animate-pulse rounded bg-dark-elevated" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-dark-elevated [animation-delay:120ms]" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-dark-elevated [animation-delay:240ms]" />
            </div>
            <div className="mt-5 flex gap-2">
              <div className="h-6 w-32 animate-pulse rounded-md bg-dark-elevated" />
              <div className="h-6 w-28 animate-pulse rounded-md bg-dark-elevated [animation-delay:180ms]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
