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
];

const PILLARS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    title: "Find anything",
    body: "One search bar across every tool your company uses. Results ranked by what matters to you — not just keyword matches.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-9 8.36 8.5 8.5 0 0 1-3.4-.76L3 21l1.9-5.6a8.38 8.38 0 0 1-.76-3.4 8.5 8.5 0 0 1 8.36-9 8.38 8.38 0 0 1 8.5 8.5Z" />
      </svg>
    ),
    title: "Ask anything",
    body: "Plain-language questions, AI answers grounded in your company's real knowledge. Every claim cites its source document.",
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
    title: "Zecway learns your company",
    body: "Documents, conversations, and tickets are securely indexed — along with exactly who is allowed to see each one.",
  },
  {
    step: "03",
    title: "Everyone gets answers",
    body: "From day one, every employee searches and asks across everything. Live in a day, not a six-month rollout.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-clip">
      <div className="hero-glow">
        <div className="mx-auto max-w-6xl px-6">
          {/* Nav */}
          <nav className="flex items-center justify-between py-7">
            <span className="text-xl font-extrabold tracking-tight">
              zec<span className="text-accent">way</span>
            </span>
            <a
              href="#waitlist"
              className="rounded-full border border-line bg-white/70 px-5 py-2 text-sm font-medium text-ink backdrop-blur transition hover:border-accent hover:text-accent"
            >
              Join the waitlist
            </a>
          </nav>

          {/* Hero */}
          <section className="flex flex-col items-center pb-20 pt-14 text-center sm:pt-20">
            <p className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-4 py-1.5 text-xs font-semibold tracking-wide text-accent-deep">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Work AI for the enterprise — early access open
            </p>
            <h1
              className="animate-fade-up max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              One search bar for your{" "}
              <span className="bg-gradient-to-r from-accent to-amber-500 bg-clip-text text-transparent">
                entire company
              </span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-2xl text-lg leading-relaxed text-mist"
              style={{ animationDelay: "160ms" }}
            >
              Zecway connects every tool your company uses and gives every employee one
              place to search and ask — with AI answers that cite their sources and always
              respect who&apos;s allowed to see what.
            </p>
            <div
              className="animate-fade-up mt-9 flex w-full justify-center"
              style={{ animationDelay: "240ms" }}
              id="waitlist"
            >
              <WaitlistForm />
            </div>
            <p className="animate-fade-up mt-4 text-xs text-mist" style={{ animationDelay: "300ms" }}>
              Free pilot for your first team · Live in a day · No credit card
            </p>

            {/* Product demo */}
            <div className="animate-fade-up mt-16 w-full" style={{ animationDelay: "380ms" }}>
              <SearchDemo />
            </div>
          </section>
        </div>
      </div>

      {/* Tool marquee */}
      <section className="border-y border-line bg-cream/50 py-8">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-mist">
          Works with the tools you already use
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

      <div className="mx-auto max-w-6xl px-6">
        {/* Pillars */}
        <section className="grid gap-6 py-24 sm:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.title} delay={i * 120}>
              <div className="group h-full rounded-3xl border border-line bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_24px_50px_-25px_rgba(240,89,10,0.45)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent transition group-hover:scale-110">
                  {p.icon}
                </div>
                <h3 className="mt-5 text-lg font-bold">{p.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-mist">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </section>

        {/* How it works */}
        <section className="rounded-[2.5rem] bg-gradient-to-b from-cream to-paper px-6 py-20 sm:px-14">
          <Reveal>
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
              Live in a day, <span className="text-accent">not a quarter</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-12 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.step} delay={i * 140}>
                <div className="relative">
                  <span className="text-5xl font-extrabold tracking-tight text-accent/15">{s.step}</span>
                  <h3 className="-mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-mist">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="flex flex-col items-center py-28 text-center">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
              Stop hunting for answers your company{" "}
              <span className="bg-gradient-to-r from-accent to-amber-500 bg-clip-text text-transparent">
                already has
              </span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-5 max-w-xl text-mist">
              Join the early-access waitlist and be first in line when pilots open.
            </p>
          </Reveal>
          <Reveal delay={220} className="mt-9 flex w-full justify-center">
            <WaitlistForm compact />
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-line py-10 text-xs text-mist sm:flex-row">
          <span className="font-bold text-ink">
            zec<span className="text-accent">way</span>{" "}
            <span className="ml-2 font-normal text-mist">© {new Date().getFullYear()}</span>
          </span>
          <span>Enterprise-grade security from day one</span>
        </footer>
      </div>
    </main>
  );
}
