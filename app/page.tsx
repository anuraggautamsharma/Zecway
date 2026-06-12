import WaitlistForm from "./waitlist-form";

// The landing follows DESIGNfigma.md: a monochrome editorial frame (white
// canvas, black ink, pill CTAs, mono eyebrows) interrupted by oversized
// pastel color blocks — one block per story, white canvas between them.

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

function PillSecondary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-block rounded-full border border-line bg-paper px-6 py-2.5 text-base font-[480] text-ink transition hover:border-ink active:scale-[0.98] sm:text-lg"
    >
      {children}
    </a>
  );
}

// Embedded product mocks — flat compositions that sit on color blocks
function SearchMock() {
  return (
    <div className="rounded-lg bg-paper p-5 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
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
    <div className="rounded-lg bg-paper p-5 text-left shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6">
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

// A full-width pastel story panel — the system's signature surface
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
    <section className="mx-auto max-w-[1280px] px-4 sm:px-10">
      <div className={`${bg} grid items-center gap-10 rounded-none p-8 sm:rounded-3xl sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16`}>
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
      {/* top nav */}
      <header className="nav-blur sticky top-0 z-40 border-b border-line-soft">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:px-10">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/brand/zecway-mark.png" alt="" className="h-6 w-auto" />
            <span className="text-base font-[540] text-ink">Zecway</span>
          </a>
          <nav className="flex items-center gap-2 sm:gap-4">
            <a href="/login" className="rounded-full px-3 py-2 text-sm font-[480] text-ink hover:bg-cream sm:text-base">
              Sign in
            </a>
            <a
              href="#join"
              className="bg-accent rounded-full px-4 py-2 text-sm font-[480] text-white transition hover:bg-accent-deep sm:px-5 sm:text-base"
            >
              Get early access
            </a>
          </nav>
        </div>
      </header>

      <main>
        {/* hero — white canvas, oversized light display type */}
        <section className="mx-auto max-w-[1280px] px-4 pb-20 pt-16 text-center sm:px-10 sm:pb-28 sm:pt-24">
          <Eyebrow>the company brain · early access 2026</Eyebrow>
          <h1 className="animate-fade-up mx-auto mt-6 max-w-4xl font-display text-5xl leading-[1.02] text-ink sm:text-7xl lg:text-[86px] lg:leading-[1.0] lg:tracking-[-1.72px]">
            Your company already knows the answer.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg font-[330] leading-[1.4] text-ink sm:text-xl">
            Zecway connects everything your team knows and turns it into
            instant, cited answers — and into agents that do the work.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <PillPrimary href="#join">Get early access</PillPrimary>
            <PillSecondary href="/login">Sign in</PillSecondary>
          </div>
        </section>

        {/* marquee strip */}
        <div className="overflow-hidden bg-dark py-2.5">
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

        {/* 01 — search, on lime */}
        <div className="pt-24 sm:pt-32" />
        <ColorBlock
          bg="bg-lime"
          eyebrow="01 · search"
          title="Find anything, instantly."
          body="One bar across every tool your company uses — results as you type, only from what you're allowed to see."
        >
          <SearchMock />
        </ColorBlock>

        {/* white interlude */}
        <section className="mx-auto max-w-[1280px] px-4 py-24 text-center sm:px-10 sm:py-32">
          <h2 className="mx-auto max-w-3xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl sm:tracking-[-0.96px]">
            The brain has three layers.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-[330] leading-[1.4] text-ink sm:text-xl">
            Search is day one. The assistant turns answers into work. Agents
            turn work into something that runs without you.
          </p>
        </section>

        {/* 02 — assistant, on lilac */}
        <ColorBlock
          bg="bg-lilac"
          eyebrow="02 · assistant"
          title="An expert by your side."
          body="Drafts, summaries, and decisions grounded in your company's real knowledge — in your voice, with receipts."
        >
          <AssistantMock />
        </ColorBlock>

        {/* white interlude — permissions */}
        <section className="mx-auto max-w-[1280px] px-4 py-24 text-center sm:px-10 sm:py-32">
          <Eyebrow>the part enterprises ask first</Eyebrow>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl sm:tracking-[-0.96px]">
            Same question. Different clearance.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg font-[330] leading-[1.4] text-ink sm:text-xl">
            Permissions are enforced in the database — before anything ever
            reaches an AI. Everyone sees only what they&apos;re allowed to see.
          </p>
        </section>

        {/* 03 — agents, on navy (the only dark block) */}
        <ColorBlock
          bg="bg-navy"
          light
          eyebrow="03 · agents"
          title="Describe a chore. Get a worker."
          body="AI teammates that take on real work — scheduled mornings, autonomous research, actions a human approves. Every claim cited."
        >
          <AgentsMock />
        </ColorBlock>

        {/* closing CTA on cream */}
        <div className="pt-24 sm:pt-32" />
        <section id="join" className="mx-auto max-w-[1280px] px-4 pb-24 sm:px-10 sm:pb-32">
          <div className="bg-blockcream rounded-none p-8 text-center sm:rounded-3xl sm:p-16">
            <h2 className="mx-auto max-w-2xl font-display text-4xl leading-[1.08] text-ink sm:text-6xl sm:tracking-[-0.96px]">
              Give your team one search bar for everything.
            </h2>
            <div className="mt-9 flex justify-center">
              <WaitlistForm />
            </div>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
              early access is limited · no credit card
            </p>
          </div>
        </section>
      </main>

      {/* footer — white canvas, dense caption type */}
      <footer className="border-t border-line-soft">
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-10">
          <div className="flex flex-col justify-between gap-10 sm:flex-row sm:items-end">
            <div>
              <span className="flex items-center gap-3">
                <img src="/brand/zecway-mark.png" alt="" className="h-7 w-auto" />
                <span className="font-display text-3xl text-ink">Zecway</span>
              </span>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
                the company brain
              </p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
              <a href="/login" className="hover:text-ink">sign in</a>
              <a href="#join" className="hover:text-ink">early access</a>
              <span>permissions enforced on every result</span>
              <span>© {new Date().getFullYear()} zecway</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile thumb-zone CTA — always one tap away */}
      <a
        href="#join"
        className="bg-accent fixed inset-x-4 bottom-4 z-40 rounded-full py-3.5 text-center text-sm font-[480] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] active:scale-[0.97] md:hidden"
      >
        Get early access
      </a>
    </div>
  );
}
