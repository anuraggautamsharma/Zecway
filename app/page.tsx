import Reveal from "./reveal";
import SearchDemo from "./search-demo";
import WaitlistForm from "./waitlist-form";

const SOURCES = [
  "Google Drive",
  "Slack",
  "Notion",
  "Confluence",
  "Jira",
  "GitHub",
  "Email",
  "PDFs",
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

const STEPS = [
  {
    step: "1",
    title: "Connect your tools",
    body: "Authorize the apps your company already uses. No migration, no IT project.",
  },
  {
    step: "2",
    title: "Zecway learns everything",
    body: "Your content becomes one searchable knowledge graph — including who's allowed to see what.",
  },
  {
    step: "3",
    title: "Everyone finds anything",
    body: "Cited answers in seconds, instead of interrupting a colleague.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
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

      {/* Hero */}
      <header className="mx-auto max-w-3xl px-6 pb-20 pt-36 text-center sm:pb-28 sm:pt-44">
        <p className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-mist">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          AI workplace search · Launching 2026
        </p>

        <h1
          className="animate-fade-up font-display text-5xl leading-[1.05] text-ink sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Ask your company anything.
        </h1>

        <p
          className="animate-fade-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-mist sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          One search bar across every tool your team uses. Instant answers with
          sources — only from what each person is allowed to see.
        </p>

        <div
          className="animate-fade-up mt-8 flex w-full justify-center"
          style={{ animationDelay: "240ms" }}
          id="waitlist"
        >
          <WaitlistForm />
        </div>
        <p
          className="animate-fade-up mt-3 text-xs text-mist"
          style={{ animationDelay: "300ms" }}
        >
          Early access is limited · No credit card
        </p>
      </header>

      {/* Demo */}
      <section className="mx-auto max-w-2xl px-6">
        <Reveal>
          <SearchDemo />
        </Reveal>
      </section>

      {/* Sources */}
      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-mist">
            Works with
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2.5">
            {SOURCES.map((s) => (
              <span key={s} className="text-sm font-medium text-mist">
                {s}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 100}>
                <div className="h-full rounded-xl bg-card p-8">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  <h3 className="mt-3 text-lg font-medium text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-body">{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-cream">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
          <Reveal>
            <h2 className="font-display text-3xl text-ink sm:text-4xl">
              Live in a day, not a quarter
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 100}>
                <div>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper text-xs font-semibold text-mist">
                    {s.step}
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — coral callout band */}
      <section className="px-6 py-16 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-5xl rounded-xl bg-accent px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="font-display text-3xl text-white sm:text-5xl">
              Give your team one search bar
              <br className="hidden sm:block" /> for everything.
            </h2>
            <div className="mt-8 flex w-full justify-center">
              <WaitlistForm compact />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Footer — dark, never inverts */}
      <footer className="bg-dark">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-12 text-xs text-on-dark-soft sm:flex-row">
          <span className="text-sm font-bold tracking-tight text-on-dark">
            zecway<span className="text-accent">.</span>
          </span>
          <span>AI workplace search · © {new Date().getFullYear()} Zecway</span>
          <span>Permissions enforced on every result</span>
        </div>
      </footer>
    </main>
  );
}
