"use client";

import { useEffect, useState } from "react";

const DEMOS = [
  {
    query: "Where are handoffs breaking between sales and delivery?",
    answer:
      "Handoff time tripled since March — 9 deals are stalled at contract review between Sales and Legal, all waiting on one approver.",
    sources: [
      { icon: "📊", label: "Pipeline · Salesforce" },
      { icon: "💬", label: "#deal-desk · Slack" },
      { icon: "📄", label: "SLA tracker · Sheets" },
    ],
  },
  {
    query: "Should we renew the Acme logistics contract?",
    answer:
      "Acme missed 4 of 12 SLAs this quarter and costs rose 18%. Two vetted alternatives are already in procurement notes.",
    sources: [
      { icon: "📄", label: "Vendor scorecard · Drive" },
      { icon: "📝", label: "Procurement · Notion" },
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
    <div className="dot-grid relative mx-auto w-full max-w-2xl rounded-3xl border border-line bg-cream/60 p-5 shadow-[0_24px_70px_-30px_rgba(240,89,10,0.35)] sm:p-8">
      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4 shadow-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-accent">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className={`min-h-6 text-sm text-ink sm:text-base ${phase === "typing" ? "caret" : ""}`}>
          {typed}
        </span>
      </div>

      {/* Answer card */}
      <div className={`mt-4 ${phase === "answer" ? "animate-pop" : "invisible"}`}>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Zecway answer
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink sm:text-base">{current.answer}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {current.sources.map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent-deep"
              >
                <span>{s.icon}</span> {s.label}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-mist">
          Only from documents <em>you</em> are allowed to see — always.
        </p>
      </div>
    </div>
  );
}
