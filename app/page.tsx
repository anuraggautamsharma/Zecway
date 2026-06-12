import dynamic from "next/dynamic";
import WaitlistForm from "./waitlist-form";
import QuestionType from "./question-type";
import FloatingCta from "./floating-cta";
import { RiseIn, WordsRise } from "./scroll-story";

const WorldCanvas = dynamic(() => import("./world-canvas"));

// The landing follows DESIGNfigma.md — monochrome editorial frame, pill
// CTAs, pastel color blocks — staged as one continuous scroll story: a
// monochrome particle universe behind the page morphs from chaos to graph
// to layers to clearance to halo as the narrative advances ([data-act]).

const MARQUEE_ITEMS = [
  "one search bar for everything",
  "permissions-aware by design",
  "every claim cited",
  "assistant grounded in your company",
  "agents that do real work",
  "your data stays yours",
];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`font-mono text-xs uppercase tracking-[0.18em] sm:text-sm ${
        light ? "text-on-dark-soft" : "text-ink"
      }`}
    >
      {children}
    </p>
  );
}

function PillPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="bg-accent inline-block rounded-full px-6 py-2.5 text-base font-[480] text-white transition hover:bg-accent-deep active:scale-[0.98] sm:text-lg"
    >
      {children}
    </a>
  );
}

// Embedded product mocks — frosted glass, so the universe stays visible
function SearchMock() {
  return (
    <div className="glass-panel rounded-lg bg-paper/55 p-5 text-left sm:p-6">
      <div className="flex items-center gap-3 rounded-full border border-line px-4 py-2.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-ink">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="text-sm text-ink sm:text-base">where is the latest pricing deck?</span>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-ink sm:text-base">
        Pricing v4.2, updated Tuesday by Marcus — here&apos;s the deck, and the
        thread explaining what changed{" "}
        <span className="ml-1 inline-flex h-4.5 items-center rounded-full bg-card px-1.5 align-middle font-mono text-[10px] font-medium">1</span>
        <span className="ml-1 inline-flex h-4.5 items-center rounded-full bg-card px-1.5 align-middle font-mono text-[10px] font-medium">2</span>
      </p>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/60">
        [1] pricing v4.2 · drive&nbsp;&nbsp;&nbsp;[2] #go-to-market · slack
      </p>
    </div>
  );
}

function AssistantMock() {
  return (
    <div className="glass-panel rounded-lg bg-paper/55 p-5 text-left sm:p-6">
      <p className="ml-auto w-fit max-w-[80%] rounded-2xl bg-card px-4 py-2.5 text-sm text-ink">
        Draft a reply to the Hartman RFP — security section
      </p>
      <div className="mt-4 max-w-[90%]">
        <p className="text-sm leading-relaxed text-ink">
          Here&apos;s a draft grounded in your security policy and last
          quarter&apos;s SOC&nbsp;2 summary — every claim cited, ready to edit.
        </p>
        <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/60">
          ● grounded in 4 company sources
        </p>
      </div>
    </div>
  );
}

function AgentsMock() {
  const steps = [
    ["trigger", "Every Monday, 9am"],
    ["plan & execute", "Researches on its own"],
    ["post to slack", "You approve, it sends"],
  ];
  return (
    <div className="space-y-2.5 text-left">
      {steps.map(([k, v], i) => (
        <div key={k}>
          <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur-[2px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-dark-soft">{k}</p>
            <p className="mt-0.5 text-sm font-[480] text-on-dark sm:text-base">{v}</p>
          </div>
          {i < steps.length - 1 && <div className="ml-6 h-2.5 w-px bg-white/25" />}
        </div>
      ))}
    </div>
  );
}

// A full-width pastel story panel — tinted glass over the living universe
function ColorBlock({
  bg,
  light = false,
  eyebrow,
  title,
  body,
  children,
}: {
  bg: string;
  light?: boolean;
  eyebrow: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[1280px] px-0 sm:px-10">
      <div className={`${bg} glass-panel grid items-center gap-10 rounded-none p-8 sm:rounded-3xl sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16`}>
        <div>
          <Eyebrow light={light}>{eyebrow}</Eyebrow>
          <h2 className={`mt-4 text-3xl font-[540] leading-[1.15] tracking-[-0.01em] sm:text-4xl ${light ? "text-on-dark" : "text-ink"}`}>
            {title}
          </h2>
          <p className={`mt-4 max-w-md text-lg font-[340] leading-[1.4] sm:text-xl ${light ? "text-on-dark-soft" : "text-ink"}`}>
            {body}
          </p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <WorldCanvas />

      <main className="relative z-10">
        {/* ACT 0 — chaos: every point of light is a piece of your company */}
        <section data-act="0" className="relative mx-auto flex min-h-[100svh] max-w-[1280px] flex-col items-center justify-center px-4 py-16 text-center sm:min-h-[88svh] sm:px-10">
          <div className="animate-fade-up">
            <img
              src="/brand/zecway-vertical.png"
              alt="Zecway"
              className="mx-auto mb-8 h-24 w-auto sm:h-28"
            />
            <Eyebrow>the company brain · early access 2026</Eyebrow>
          </div>
          <WordsRise
            text="Your company already knows the answer."
            className="mx-auto mt-6 max-w-4xl font-display text-5xl leading-[1.02] text-ink sm:text-7xl lg:text-[86px] lg:leading-[1.0] lg:tracking-[-1.72px]"
          />
          <RiseIn delay={0.3}>
            <p className="mx-auto mt-7 max-w-xl text-lg font-[330] leading-[1.4] text-ink sm:text-xl">
              Every point of light around you is a piece of it — scattered
              across ten tools. Keep scrolling.
            </p>
          </RiseIn>
          <RiseIn delay={0.4}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <PillPrimary href="#join">Get early access</PillPrimary>
            </div>
          </RiseIn>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.24em] text-ink/50">
            scroll ↓
          </p>
        </section>

        {/* marquee strip — desktop only; on a phone it's a stray black band */}
        <div className="hidden overflow-hidden bg-dark py-2.5 sm:block">
          <div className="animate-ticker flex w-max gap-10 whitespace-nowrap">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex gap-10" aria-hidden={dup === 1}>
                {MARQUEE_ITEMS.map((m) => (
                  <span key={m} className="font-mono text-xs uppercase tracking-[0.14em] text-on-dark">
                    {m} <span className="ml-9 text-on-dark-soft">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ACT 1 — the question, typed live; the universe stirs */}
        <section data-act="1" className="flex min-h-[72svh] flex-col items-center justify-center px-4 text-center sm:min-h-[92svh] sm:px-10">
          <RiseIn>
            <p className="mb-8 font-mono text-xs uppercase tracking-[0.24em] text-ink/60">
              then, someone asks
            </p>
          </RiseIn>
          <QuestionType />
        </section>

        {/* ACT 2 — the answer; chaos organizes into the graph */}
        <section data-act="2" className="flex min-h-[72svh] flex-col items-center justify-center px-4 text-center sm:min-h-[92svh] sm:px-10">
          <RiseIn>
            <p className="mb-7 font-mono text-xs uppercase tracking-[0.24em] text-ink">
              ● answer · 0.4s
            </p>
          </RiseIn>
          <WordsRise
            text="Pricing v4.2, updated Tuesday by Marcus — here's the deck, and the thread explaining what changed."
            className="mx-auto max-w-3xl font-display text-3xl leading-snug text-ink sm:text-5xl sm:tracking-[-0.96px]"
          />
          <RiseIn delay={0.4}>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.1em] text-ink/60">
              [1] pricing v4.2 · drive&nbsp;&nbsp;&nbsp;[2] #go-to-market · slack
            </p>
            <p className="mx-auto mt-9 max-w-sm text-sm font-[330] leading-relaxed text-ink/70">
              Watch the chaos organize. Every answer is built from the graph —
              cited, current, permitted.
            </p>
          </RiseIn>
        </section>

        {/* 01 — search, on lime */}
        <RiseIn>
          <ColorBlock
            bg="bg-lime/70"
            eyebrow="01 · search"
            title="Find anything, instantly."
            body="One bar across every tool your company uses — results as you type, only from what you're allowed to see."
          >
            <SearchMock />
          </ColorBlock>
        </RiseIn>

        {/* ACT 3 — three layers; the universe separates into planes */}
        <section data-act="3" className="mx-auto flex min-h-[55svh] max-w-[1280px] flex-col items-center justify-center px-4 py-20 text-center sm:min-h-[80svh] sm:px-10 sm:py-24">
          <WordsRise
            text="The brain has three layers."
            className="mx-auto max-w-3xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl sm:tracking-[-0.96px]"
          />
          <RiseIn delay={0.25}>
            <p className="mx-auto mt-6 max-w-xl text-lg font-[330] leading-[1.4] text-ink sm:text-xl">
              Search is day one. The assistant turns answers into work. Agents
              turn work into something that runs without you.
            </p>
          </RiseIn>
        </section>

        {/* 02 — assistant, on lilac */}
        <RiseIn>
          <ColorBlock
            bg="bg-lilac/70"
            eyebrow="02 · assistant"
            title="An expert by your side."
            body="Drafts, summaries, and decisions grounded in your company's real knowledge — in your voice, with receipts."
          >
            <AssistantMock />
          </ColorBlock>
        </RiseIn>

        {/* ACT 4 — clearance; the universe splits into two clusters */}
        <section data-act="4" className="mx-auto flex min-h-[55svh] max-w-[1280px] flex-col items-center justify-center px-4 py-20 text-center sm:min-h-[80svh] sm:px-10 sm:py-24">
          <RiseIn>
            <Eyebrow>the part enterprises ask first</Eyebrow>
          </RiseIn>
          <WordsRise
            text="Same question. Different clearance."
            className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl sm:tracking-[-0.96px]"
          />
          <RiseIn delay={0.25}>
            <p className="mx-auto mt-6 max-w-xl text-lg font-[330] leading-[1.4] text-ink sm:text-xl">
              Permissions are enforced in the database — before anything ever
              reaches an AI. Everyone sees only what they&apos;re allowed to see.
            </p>
          </RiseIn>
        </section>

        {/* 03 — agents, on navy (the only dark block) */}
        <RiseIn>
          <ColorBlock
            bg="bg-navy/85"
            light
            eyebrow="03 · agents"
            title="Describe a chore. Get a worker."
            body="AI teammates that take on real work — scheduled mornings, autonomous research, actions a human approves. Every claim cited."
          >
            <AgentsMock />
          </ColorBlock>
        </RiseIn>

        {/* ACT 5 — the halo; closing CTA on cream */}
        <section data-act="5" id="join" className="mx-auto max-w-[1280px] px-0 py-20 sm:px-10 sm:py-32">
          <RiseIn>
            <div className="bg-blockcream/65 glass-panel rounded-none p-8 text-center sm:rounded-3xl sm:p-16">
              <WordsRise
                text="Give your team one search bar for everything."
                className="mx-auto max-w-2xl font-display text-4xl leading-[1.08] text-ink sm:text-6xl sm:tracking-[-0.96px]"
              />
              <div className="mt-9 flex justify-center">
                <WaitlistForm />
              </div>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
                early access is limited · no credit card
              </p>
            </div>
          </RiseIn>
        </section>
      </main>

      {/* footer — a composed sign-off, centered at every width */}
      <footer className="relative z-10 border-t border-line-soft bg-paper">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-5 px-6 py-14 text-center">
          <span className="flex items-center gap-3">
            <img src="/brand/zecway-mark.png" alt="" className="h-6 w-auto" />
            <span className="font-display text-2xl text-ink">Zecway</span>
          </span>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
            the company brain
          </p>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
            <a href="#join" className="py-2 hover:text-ink">early access</a>
            <span aria-hidden>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* Floating CTA — appears after the hero, hides at the join form */}
      <FloatingCta />
    </div>
  );
}
