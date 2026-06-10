import dynamic from "next/dynamic";
import SearchDemo from "./search-demo";
import WaitlistForm from "./waitlist-form";
import { RiseIn, ScatterToBar, WordsRise } from "./scroll-story";
import { AssistantDemo, AgentsDemo, PermissionsDemo } from "./climb-demos";

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

function Lockup({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <img src="/zecway-mark.svg" alt="" className="h-6 w-auto" />
      <span
        className={`font-display text-2xl leading-none ${dark ? "text-on-dark" : "text-ink"}`}
      >
        Zecway
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip">
      {/* Hero — the field of scattered knowledge that organizes around answers */}
      <header className="relative flex min-h-svh flex-col items-center justify-center px-6 pb-16 pt-12 text-center">
        <GraphField />

        <div className="relative z-10 flex w-full flex-col items-center">
          {/* vertical lockup — the brand crowns the page */}
          <div className="animate-fade-up mb-7 flex flex-col items-center gap-2.5">
            <img src="/zecway-mark.svg" alt="" className="h-12 w-auto sm:h-14" />
            <span className="font-display text-2xl leading-none text-ink sm:text-3xl">
              Zecway
            </span>
          </div>

          <p
            className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-mist"
            style={{ animationDelay: "40ms" }}
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            the company brain · launching 2026
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

      {/* Question ticker */}
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
        <WordsRise
          text="Your company already knows the answer. It's just scattered across ten tools."
          className="mx-auto max-w-2xl text-center font-display text-3xl leading-tight text-ink sm:text-5xl"
        />
        <div className="mt-16">
          <ScatterToBar tools={SOURCES} />
        </div>
      </section>

      {/* THE CLIMB — search is day one */}
      <section className="border-t border-line bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <RiseIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              ● search is day one
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight text-ink sm:text-5xl">
              Zecway is building the company brain. In three layers.
            </h2>
          </RiseIn>
        </div>
      </section>

      {/* 01 · Search */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <RiseIn>
            <p className="font-mono text-xs text-mist">01 · search</p>
            <h3 className="mt-3 font-display text-2xl text-ink sm:text-4xl">
              Find anything, instantly.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-body">
              One bar across everything your company uses. Results as you
              type — only ever from what you&apos;re allowed to see.
            </p>
          </RiseIn>
          <RiseIn delay={0.15} className="mt-10">
            <div className="mx-auto w-full max-w-xl rounded-2xl border border-line bg-paper p-2 text-left shadow-[0_1px_1px_rgba(20,20,19,0.03),0_12px_24px_-16px_rgba(20,20,19,0.25)]">
              <div className="flex items-center gap-2.5 rounded-xl bg-cream px-4 py-2.5">
                <span className="font-mono text-xs text-mist">⌕</span>
                <span className="text-sm text-ink">parental leave</span>
              </div>
              <div className="divide-y divide-line px-4">
                {[
                  ["HR Policy 2026", "drive"],
                  ["Parental leave FAQ", "notion"],
                  ["#people-ops thread", "slack"],
                ].map(([title, src]) => (
                  <div key={title} className="flex items-baseline justify-between py-2.5">
                    <span className="text-sm text-ink">{title}</span>
                    <span className="font-mono text-[11px] text-mist">{src}</span>
                  </div>
                ))}
              </div>
            </div>
          </RiseIn>
        </div>
      </section>

      {/* 02 · Assistant */}
      <section className="bg-dark">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <RiseIn>
            <p className="font-mono text-xs text-on-dark-soft">02 · assistant</p>
            <h3 className="mt-3 font-display text-2xl text-on-dark sm:text-4xl">
              An expert by your side.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-on-dark-soft">
              Not just finding — doing. Drafts, summaries, and decisions
              grounded in your company&apos;s real knowledge, in your voice.
            </p>
          </RiseIn>
          <RiseIn delay={0.15} className="mt-10">
            <AssistantDemo />
          </RiseIn>
        </div>
      </section>

      {/* 03 · Agents */}
      <section className="bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <RiseIn>
            <p className="font-mono text-xs text-mist">03 · agents — the destination</p>
            <h3 className="mt-3 font-display text-2xl text-ink sm:text-4xl">
              Describe a chore. Get a worker.
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-body">
              AI teammates that take on real work across your company&apos;s
              knowledge — every action permission-checked, every claim cited.
            </p>
          </RiseIn>
          <RiseIn delay={0.15} className="mt-10">
            <AgentsDemo />
          </RiseIn>
        </div>
      </section>

      {/* Permissions theater */}
      <section className="bg-dark">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-32">
          <RiseIn>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
              ● the part everyone asks about
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight text-on-dark sm:text-5xl">
              Same question. Different clearance.
            </h2>
          </RiseIn>
          <RiseIn delay={0.15} className="mt-12">
            <PermissionsDemo />
          </RiseIn>
          <RiseIn delay={0.25}>
            <p className="mx-auto mt-10 max-w-md text-sm leading-relaxed text-on-dark-soft">
              Permissions are enforced in the database — before anything ever
              reaches an AI. People only see what they could already open.
            </p>
          </RiseIn>
        </div>
      </section>

      {/* Receipts statement */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-36">
        <RiseIn>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            ● no confident fiction
          </p>
        </RiseIn>
        <WordsRise
          text="Every claim cites its source. And when the answer isn't written down anywhere, Zecway says so."
          className="mx-auto mt-6 max-w-2xl font-display text-2xl leading-relaxed text-ink sm:text-4xl"
        />
      </section>

      {/* Final CTA — ember band */}
      <section className="px-6 pb-20">
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
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-12 sm:flex-row">
          <Lockup dark />
          <span className="font-mono text-[11px] text-on-dark-soft">
            the company brain · © {new Date().getFullYear()} zecway
          </span>
          <span className="font-mono text-[11px] text-on-dark-soft">
            permissions enforced on every result
          </span>
        </div>
      </footer>
    </main>
  );
}
