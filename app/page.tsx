import dynamic from "next/dynamic";
import SearchDemo from "./search-demo";
import WaitlistForm from "./waitlist-form";
import { RiseIn, ScatterToBar } from "./scroll-story";

const GraphField = dynamic(() => import("./graph-field"));

const SOURCES = [
  "Google Drive",
  "Slack",
  "Notion",
  "Confluence",
  "Jira",
  "GitHub",
  "Email",
  "PDFs",
  "Meeting notes",
  "Spreadsheets",
];

const TICKER = [
  "where's the latest pricing deck?",
  "who owns customer onboarding?",
  "what's our parental leave policy?",
  "what did we decide about the rebrand?",
  "is the API contract signed?",
  "which vendor handles logistics?",
];

const FEATURES = [
  {
    title: "Every tool, one search bar",
    body: "Documents, chats, emails, meeting notes — everything your company produces, searchable from one place.",
  },
  {
    title: "Answers with receipts",
    body: "Ask in plain language. Every claim cites its source, and when the answer isn't written down anywhere, Zecway says so.",
  },
  {
    title: "Leak nothing",
    body: "Permissions from every source tool are enforced on every result. People only ever see what they could already open.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip">
      {/* Nav */}
      <nav className="nav-blur fixed inset-x-0 top-0 z-50 border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3.5">
          <span className="text-lg font-bold tracking-tight">
            zecway<span className="text-accent">.</span>
          </span>
          <a
            href="#waitlist"
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-dark-elevated active:scale-[0.97]"
          >
            Get early access
          </a>
        </div>
      </nav>

      {/* Hero — the field of scattered knowledge that organizes around answers */}
      <header className="relative flex min-h-svh flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
        <GraphField />

        <div className="relative z-10 flex w-full flex-col items-center">
          <p className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mist">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            ai workplace search · launching 2026
          </p>

          <h1
            className="animate-fade-up max-w-3xl font-display text-5xl leading-[1.04] text-ink sm:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Ask your company anything.
          </h1>

          <p
            className="animate-fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-body sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            Every dot behind this sentence is a piece of company knowledge,
            scattered. Watch what happens when someone asks.
          </p>

          <div
            className="animate-fade-up mt-9 w-full max-w-2xl"
            style={{ animationDelay: "260ms" }}
          >
            <SearchDemo />
          </div>

          <div
            className="animate-fade-up mt-9 flex w-full justify-center"
            style={{ animationDelay: "340ms" }}
            id="waitlist"
          >
            <WaitlistForm />
          </div>
          <p
            className="animate-fade-up mt-3 font-mono text-[11px] text-mist"
            style={{ animationDelay: "400ms" }}
          >
            early access is limited · no credit card
          </p>
        </div>
      </header>

      {/* Question ticker — the everyday questions, in the receipt voice */}
      <section className="border-y border-line bg-cream py-3.5">
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="animate-ticker flex w-max items-center gap-8">
            {[...TICKER, ...TICKER].map((q, i) => (
              <span
                key={`${q}-${i}`}
                className="flex items-center gap-8 font-mono text-xs text-mist"
              >
                {q}
                <span className="inline-block h-1 w-1 rounded-full bg-accent" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Scatter → one bar (scroll-performed) */}
      <section className="mx-auto max-w-4xl px-6 py-24 sm:py-36">
        <RiseIn>
          <h2 className="mx-auto max-w-2xl text-center font-display text-3xl leading-tight text-ink sm:text-5xl">
            Your company already knows the answer. It&apos;s just scattered
            across ten tools.
          </h2>
        </RiseIn>
        <div className="mt-16">
          <ScatterToBar tools={SOURCES} />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <RiseIn key={f.title} delay={i * 0.12} className="h-full">
                <div className="h-full rounded-xl bg-card p-8">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <h3 className="mt-3 text-lg font-medium text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{f.body}</p>
                </div>
              </RiseIn>
            ))}
          </div>
        </div>
      </section>

      {/* The receipts moment */}
      <section className="border-t border-line bg-dark">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-32">
          <RiseIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              ● every claim, cited
            </p>
            <p className="mx-auto mt-6 max-w-2xl font-display text-2xl leading-relaxed text-on-dark sm:text-4xl">
              &ldquo;Full-time employees receive 18 weeks of fully paid parental
              leave, extendable by 4 unpaid weeks.&rdquo;
            </p>
            <p className="mt-6 font-mono text-xs text-on-dark-soft">
              [1] HR Policy 2026 · Google Drive&nbsp;&nbsp;&nbsp;[2] #people-ops · Slack
            </p>
            <p className="mt-10 text-sm leading-relaxed text-on-dark-soft">
              And when the answer isn&apos;t written down anywhere, Zecway says
              so — instead of making something up.
            </p>
          </RiseIn>
        </div>
      </section>

      {/* Final CTA — ember band */}
      <section className="px-6 py-16 sm:py-24">
        <RiseIn>
          <div className="mx-auto max-w-5xl rounded-xl bg-accent px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="font-display text-3xl text-white sm:text-5xl">
              Give your team one search bar
              <br className="hidden sm:block" /> for everything.
            </h2>
            <div className="mt-8 flex w-full justify-center">
              <WaitlistForm compact />
            </div>
          </div>
        </RiseIn>
      </section>

      {/* Footer — dark, never inverts */}
      <footer className="bg-dark">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-12 text-xs text-on-dark-soft sm:flex-row">
          <span className="text-sm font-bold tracking-tight text-on-dark">
            zecway<span className="text-accent">.</span>
          </span>
          <span className="font-mono text-[11px]">
            ai workplace search · © {new Date().getFullYear()} zecway
          </span>
          <span className="font-mono text-[11px]">permissions enforced on every result</span>
        </div>
      </footer>
    </main>
  );
}
