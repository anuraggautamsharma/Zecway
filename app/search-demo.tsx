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
    <div className="relative mx-auto w-full max-w-2xl rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(23,21,19,0.04),0_12px_32px_-16px_rgba(23,21,19,0.12)] sm:p-6">
      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-xl border border-line bg-cream px-4 py-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-mist">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={`min-h-6 text-sm text-ink ${phase === "typing" ? "caret" : ""}`}>
          {typed}
        </span>
      </div>

      {/* Answer */}
      <div className={`${phase === "answer" ? "animate-pop" : "invisible"}`}>
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Answer
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-ink">{current.answer}</p>
          <div className="mt-3.5 flex flex-wrap gap-2">
            {current.sources.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs text-mist"
              >
                <span>{s.icon}</span> {s.label}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-mist">
            Only from documents <em>you</em> are allowed to see — always.
          </p>
        </div>
      </div>
    </div>
  );
}
