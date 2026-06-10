import dynamic from "next/dynamic";
import WaitlistForm from "./waitlist-form";
import QuestionType from "./question-type";
import FloatingCta from "./floating-cta";
import { RiseIn, WordsRise } from "./scroll-story";
import { PermissionsDemo } from "./climb-demos";

const WorldCanvas = dynamic(() => import("./world-canvas"));

const LAYERS = [
  {
    n: "01",
    title: "Search",
    line: "Find anything, instantly.",
    body: "One bar across every tool your company uses — results as you type, only from what you're allowed to see.",
    state: "live in early access",
  },
  {
    n: "02",
    title: "Assistant",
    line: "An expert by your side.",
    body: "Drafts, summaries, and decisions grounded in your company's real knowledge — in your voice, with receipts.",
    state: "rolling out",
  },
  {
    n: "03",
    title: "Agents",
    line: "Describe a chore. Get a worker.",
    body: "AI teammates that take on real work — every action permission-checked, every claim cited.",
    state: "the destination",
  },
];

export default function Home() {
  return (
    <div className="bg-paper text-ink">
      <WorldCanvas />
      <FloatingCta />

      <main className="relative z-10">
        {/* ACT I — CHAOS */}
        <section data-act="0" className="h-[150svh]">
          <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6 text-center">
            <div className="animate-fade-up mb-8 flex flex-col items-center gap-3">
              <img src="/brand/zecway-mark.png" alt="" className="h-12 w-auto sm:h-14" />
              <span className="font-display text-2xl leading-none text-ink sm:text-3xl">
                Zecway
              </span>
            </div>
            <p
              className="animate-fade-up mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-mist"
              style={{ animationDelay: "60ms" }}
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent align-middle" />
              the company brain · early access 2026
            </p>
            <h1
              className="animate-fade-up max-w-4xl font-display text-4xl leading-[1.06] text-ink sm:text-7xl"
              style={{ animationDelay: "120ms" }}
            >
              Your company already
              <br />
              knows the answer.
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-base leading-relaxed text-mist sm:text-lg"
              style={{ animationDelay: "200ms" }}
            >
              Every point of light around you is a piece of it — scattered
              across ten tools. Keep scrolling.
            </p>
            <div
              className="animate-fade-up absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.24em] text-mist/70"
              style={{ animationDelay: "320ms" }}
            >
              scroll ↓
            </div>
          </div>
        </section>

        {/* ACT II — THE QUESTION */}
        <section data-act="1" className="h-[160svh]">
          <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6 text-center">
            <RiseIn>
              <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.24em] text-mist">
                then, someone asks
              </p>
            </RiseIn>
            <QuestionType />
          </div>
        </section>

        {/* ACT III — THE ANSWER */}
        <section data-act="2" className="h-[200svh]">
          <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6 text-center">
            <RiseIn>
              <p className="mb-7 font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
                ● answer · 0.4s
              </p>
            </RiseIn>
            <WordsRise
              text="Pricing v4.2, updated Tuesday by Marcus — here's the deck, and the thread explaining what changed."
              className="mx-auto max-w-3xl font-display text-3xl leading-snug text-ink sm:text-5xl"
            />
            <RiseIn delay={0.4}>
              <p className="mt-8 font-mono text-xs text-mist">
                [1] Pricing v4.2 · Drive&nbsp;&nbsp;&nbsp;[2] #go-to-market · Slack
              </p>
              <p className="mt-10 max-w-sm text-sm leading-relaxed text-mist">
                Watch the chaos organize. Every answer is built from the graph
                — cited, current, permitted.
              </p>
            </RiseIn>
          </div>
        </section>

        {/* ACT IV — THE LAYERS */}
        <section data-act="3" className="h-[220svh]">
          <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6">
            <RiseIn>
              <p className="text-center font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
                ● search is day one
              </p>
              <h2 className="mx-auto mt-5 max-w-2xl text-center font-display text-3xl leading-tight text-ink sm:text-5xl">
                The brain has three layers.
              </h2>
            </RiseIn>
            <div className="mx-auto mt-12 w-full max-w-xl space-y-7 sm:mt-16">
              {LAYERS.map((l, i) => (
                <RiseIn key={l.n} delay={i * 0.18}>
                  <div className="flex items-baseline gap-5 border-t border-line pt-5">
                    <span className="font-mono text-xs text-accent">{l.n}</span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3">
                        <h3 className="font-display text-2xl text-ink sm:text-3xl">
                          {l.line}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-mist">
                        {l.body}
                      </p>
                      <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-mist/70">
                        {l.title} · {l.state}
                      </p>
                    </div>
                  </div>
                </RiseIn>
              ))}
            </div>
          </div>
        </section>

        {/* ACT V — CLEARANCE */}
        <section data-act="4" className="h-[180svh]">
          <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6 text-center">
            <RiseIn>
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">
                ● the part enterprises ask first
              </p>
              <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl leading-tight text-ink sm:text-5xl">
                Same question.
                <br className="sm:hidden" /> Different clearance.
              </h2>
            </RiseIn>
            <RiseIn delay={0.15} className="mt-10 w-full">
              <PermissionsDemo />
            </RiseIn>
            <RiseIn delay={0.25}>
              <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-mist">
                Permissions are enforced in the database — before anything ever
                reaches an AI.
              </p>
            </RiseIn>
          </div>
        </section>

        {/* FINALE — THE HALO */}
        <section data-act="5" id="join" className="flex min-h-svh flex-col">
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-20 text-center md:pb-20">
            <WordsRise
              text="Give your team one search bar for everything."
              className="mx-auto max-w-2xl font-display text-4xl leading-[1.1] text-ink sm:text-6xl"
            />
            <RiseIn delay={0.25} className="mt-10 flex w-full justify-center">
              <WaitlistForm />
            </RiseIn>
            <RiseIn delay={0.35}>
              <p className="mt-4 font-mono text-[11px] text-mist">
                early access is limited · no credit card
              </p>
            </RiseIn>
          </div>
          <footer className="relative z-10 bg-dark">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
              <span className="flex items-center gap-2.5">
                <img src="/brand/zecway-mark.png" alt="" className="h-6 w-auto" />
                <span className="font-display text-xl leading-none text-on-dark">
                  Zecway
                </span>
              </span>
              <span className="font-mono text-[11px] text-on-dark-soft">
                the company brain · © {new Date().getFullYear()} zecway
              </span>
              <span className="font-mono text-[11px] text-on-dark-soft">
                permissions enforced on every result
              </span>
            </div>
          </footer>
        </section>
      </main>

      {/* Mobile thumb-zone CTA — always one tap away */}
      <a
        href="#join"
        className="fixed inset-x-4 bottom-4 z-40 rounded-xl bg-accent py-3.5 text-center text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(232,84,10,0.6)] active:scale-[0.97] md:hidden"
      >
        Get early access
      </a>
    </div>
  );
}
