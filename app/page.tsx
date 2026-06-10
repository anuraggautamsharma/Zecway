import NeuralBg from "./neural-bg";
import Reveal from "./reveal";
import SearchDemo from "./search-demo";
import WaitlistForm from "./waitlist-form";

const SOURCES = [
  { icon: "📁", name: "Google Drive" },
  { icon: "💬", name: "Slack" },
  { icon: "👥", name: "Microsoft Teams" },
  { icon: "📝", name: "Notion" },
  { icon: "📚", name: "Confluence" },
  { icon: "🎫", name: "Jira" },
  { icon: "🐙", name: "GitHub" },
  { icon: "☁️", name: "Salesforce" },
  { icon: "📧", name: "Email" },
  { icon: "📊", name: "Spreadsheets" },
  { icon: "🎙️", name: "Meeting notes" },
  { icon: "📑", name: "PDFs" },
];

const PILLARS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 17 9 5 9-5" />
      </svg>
    ),
    title: "Every tool, one search bar",
    body: "Documents, PDFs, emails, chats, spreadsheets, meeting notes — everything your company produces, searchable from one place.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-9 8.36 8.5 8.5 0 0 1-3.4-.76L3 21l1.9-5.6a8.38 8.38 0 0 1-.76-3.4 8.5 8.5 0 0 1 8.36-9 8.38 8.38 0 0 1 8.5 8.5Z" />
      </svg>
    ),
    title: "Answers with receipts",
    body: "Ask in plain language, get answers grounded in your company's real knowledge. Every claim cites its source — no confident fiction.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "Leak nothing",
    body: "Permissions from every source tool are enforced on every result. People only ever see what they could already open.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Connect your tools",
    body: "Authorize the apps your company already uses. No migration, no restructuring, no IT project.",
  },
  {
    step: "02",
    title: "Zecway learns everything",
    body: "Your content becomes one living, searchable knowledge graph — including who's allowed to see what, mirrored from every source.",
  },
  {
    step: "03",
    title: "Everyone finds anything",
    body: "One search bar for the whole team. Ask in plain language, get cited answers in seconds — instead of interrupting a colleague.",
  },
];

const HEADLINE_1 = "Ask anything.";
const HEADLINE_2 = "Your company already knows the answer.";

function StaggeredWords({
  text,
  startDelay = 0,
  wordClass = "",
}: {
  text: string;
  startDelay?: number;
  wordClass?: string;
}) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="word-mask mr-[0.24em]">
          <span
            className={`animate-word inline-block ${wordClass}`}
            style={{ animationDelay: `${startDelay + i * 90}ms` }}
          >
            {word}
          </span>
        </span>
      ))}
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="nav-blur fixed inset-x-0 top-0 z-50 border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-extrabold tracking-tight">
            zec<span className="text-accent">way</span>
          </span>
          <a
            href="#waitlist"
            className="btn-shine rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper transition hover:bg-accent"
          >
            Get early access
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="hero-glow relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 text-center">
        <NeuralBg />
        {/* drifting glow orbs */}
        <div className="animate-orb pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div
          className="animate-orb pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <p className="animate-fade-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-accent/25 bg-paper/80 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-accent-deep backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            AI workplace search · Launching 2026
          </p>

          <h1 className="max-w-5xl text-6xl font-extrabold leading-[1.02] tracking-tight sm:text-8xl">
            <StaggeredWords text={HEADLINE_1} />
            <br />
            <StaggeredWords text={HEADLINE_2} startDelay={250} wordClass="gradient-flow" />
          </h1>

          <p
            className="animate-fade-up mt-8 max-w-2xl text-lg leading-relaxed text-mist sm:text-xl"
            style={{ animationDelay: "900ms" }}
          >
            Zecway connects every tool your company uses and gives your whole team
            one search bar — instant, cited answers from everything you
            already know.
          </p>

          <div
            className="animate-fade-up mt-10 flex w-full justify-center"
            style={{ animationDelay: "1050ms" }}
            id="waitlist"
          >
            <WaitlistForm />
          </div>
          <p className="animate-fade-up mt-4 text-xs text-mist" style={{ animationDelay: "1150ms" }}>
            Early access is limited · No credit card
          </p>
        </div>

        <a
          href="#demo"
          className="animate-bounce-soft absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-mist transition hover:text-accent"
          aria-label="Scroll down"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>
      </header>

      {/* Tool marquee */}
      <section className="border-y border-line bg-cream/50 py-10">
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-[0.22em] text-mist">
          Every kind of knowledge your company produces
        </p>
        <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="animate-marquee flex w-max gap-4">
            {[...SOURCES, ...SOURCES].map((s, i) => (
              <span
                key={`${s.name}-${i}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink shadow-sm"
              >
                <span>{s.icon}</span> {s.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal>
          <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-accent">
            See it think
          </p>
          <h2 className="mt-4 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
            The questions your team asks every day
          </h2>
        </Reveal>
        <Reveal delay={150} className="mt-12">
          <SearchDemo />
        </Reveal>
      </section>

      {/* Statement */}
      <section className="border-y border-line bg-cream/40 px-6 py-32 text-center">
        <Reveal>
          <p className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Today the answer lives in someone&apos;s head.{" "}
            <span className="gradient-flow">Or in a doc nobody can find.</span>
          </p>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-mist">
            Zecway finds it in seconds — cited, current, and only for the people
            allowed to see it.
          </p>
        </Reveal>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <Reveal>
          <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-accent">
            The platform
          </p>
          <h2 className="mt-4 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
            Built like infrastructure. <br className="hidden sm:block" />
            Designed like a flagship.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 130}>
              <div className="group h-full rounded-3xl border border-line bg-white p-9 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-accent/40 hover:shadow-[0_30px_60px_-25px_rgba(240,89,10,0.45)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                  {p.icon}
                </div>
                <h3 className="mt-6 text-xl font-bold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-gradient-to-b from-cream/60 to-paper px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-center text-xs font-bold uppercase tracking-[0.22em] text-accent">
              How it works
            </p>
            <h2 className="mt-4 text-center text-4xl font-extrabold tracking-tight sm:text-5xl">
              Live in a day, <span className="gradient-flow">not a quarter</span>
            </h2>
          </Reveal>
          <div className="mt-16 grid gap-12 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 150}>
                <div>
                  <span className="text-7xl font-extrabold tracking-tight text-accent/15">
                    {s.step}
                  </span>
                  <h3 className="-mt-5 text-xl font-bold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden px-6 py-36 text-center">
        <div className="animate-orb pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative">
          <Reveal>
            <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
              Give your team <span className="gradient-flow">one search bar</span> for
              everything
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-mist">
              Early access opens to a limited number of companies. Join the list.
            </p>
          </Reveal>
          <Reveal delay={220} className="mt-10 flex w-full justify-center">
            <WaitlistForm compact />
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-12 text-sm text-mist sm:flex-row">
          <span className="text-lg font-extrabold tracking-tight text-ink">
            zec<span className="text-accent">way</span>
          </span>
          <span>AI workplace search · © {new Date().getFullYear()} Zecway</span>
          <span>Enterprise-grade security from day one</span>
        </div>
      </footer>
    </main>
  );
}
