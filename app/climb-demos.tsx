"use client";

// The living demos for the climb: 02 Assistant (an answer drafting itself),
// 03 Agents (a worker checking off a chore), and the permissions theater
// (same question, two clearances, two outcomes).

import { useEffect, useState } from "react";

/* ── 02 · Assistant: an answer drafting itself, receipts attached ────────── */

const ASSISTANT_ANSWER =
  "Draft sent to your tone: pricing moves to usage-based in Q3, grandfathering current annual plans. Two open questions flagged for legal.";

export function AssistantDemo() {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 2;
      if (i > ASSISTANT_ANSWER.length + 30) i = 0; // hold, then loop
      setShown(Math.min(i, ASSISTANT_ANSWER.length));
    }, 38);
    return () => clearInterval(interval);
  }, []);

  const done = shown >= ASSISTANT_ANSWER.length;

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl bg-dark-elevated p-5 text-left sm:p-6">
      <p className="font-mono text-[11px] text-on-dark-soft">
        you → draft the pricing-change announcement for the team
      </p>
      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-accent">
          <span className={`inline-block h-1.5 w-1.5 rounded-full bg-accent ${done ? "" : "animate-pulse"}`} />
          assistant {done ? "· done" : "· writing"}
        </p>
        <p className="mt-3 min-h-[84px] font-display text-lg leading-relaxed text-on-dark">
          {ASSISTANT_ANSWER.slice(0, shown)}
          {!done && <span className="caret" />}
        </p>
        <p className={`mt-3 font-mono text-[11px] text-on-dark-soft transition-opacity duration-500 ${done ? "opacity-100" : "opacity-0"}`}>
          [1] Pricing v4.2 · Drive&nbsp;&nbsp;[2] #leadership · Slack&nbsp;&nbsp;[3] your last 3 announcements
        </p>
      </div>
    </div>
  );
}

/* ── 03 · Agents: describe a chore, get a worker ─────────────────────────── */

const AGENT_STEPS = [
  "reading customer RFP — 31 questions found",
  "searching the graph for matching answers",
  "drafting responses with citations",
  "flagging 2 questions with no source",
  "output ready — RFP-answers.xlsx",
];

export function AgentsDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s >= AGENT_STEPS.length + 2 ? 0 : s + 1));
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-line bg-paper p-5 text-left sm:p-6">
      <p className="font-mono text-[11px] text-mist">
        you → &ldquo;answer every question in this RFP from our docs&rdquo;
      </p>
      <div className="mt-4 space-y-2.5 border-t border-line pt-4">
        {AGENT_STEPS.map((s, i) => (
          <p
            key={s}
            className={`flex items-start gap-2.5 font-mono text-xs transition-all duration-500 ${
              i < step ? "text-body opacity-100" : "text-mist opacity-30"
            }`}
          >
            <span className={i < step ? "text-accent" : ""}>
              {i < step ? "✓" : "·"}
            </span>
            {s}
          </p>
        ))}
      </div>
    </div>
  );
}

/* ── Permissions theater: same question, different clearance ─────────────── */

export function PermissionsDemo() {
  const [stage, setStage] = useState(0); // 0 ask, 1 answers, 2 hold

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => (s + 1) % 3);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  const answered = stage >= 1;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mx-auto w-fit rounded-xl bg-dark-elevated px-5 py-3">
        <p className="font-mono text-xs text-on-dark">
          <span className="text-on-dark-soft">both ask →</span> &ldquo;what&apos;s our runway?&rdquo;
          {stage === 0 && <span className="caret" />}
        </p>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-dark-elevated p-5 text-left">
          <p className="font-mono text-[11px] text-on-dark-soft">
            maya · finance <span className="text-teal">● clearance: full</span>
          </p>
          <div className={`mt-3 transition-all duration-700 ${answered ? "opacity-100" : "translate-y-2 opacity-0"}`}>
            <p className="font-display text-lg leading-relaxed text-on-dark">
              19 months at current burn — runway model updated last Friday.
            </p>
            <p className="mt-2.5 font-mono text-[11px] text-on-dark-soft">
              [1] Runway model · Sheets&nbsp;&nbsp;[2] #finance · Slack
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-dark-elevated p-5 text-left">
          <p className="font-mono text-[11px] text-on-dark-soft">
            sam · design <span className="text-amber">● clearance: standard</span>
          </p>
          <div className={`mt-3 transition-all duration-700 ${answered ? "opacity-100" : "translate-y-2 opacity-0"}`}>
            <p className="font-display text-lg leading-relaxed text-on-dark">
              Nothing you have access to answers this.
            </p>
            <p className="mt-2.5 font-mono text-[11px] text-on-dark-soft">
              0 sources visible · permissions enforced in the database
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
