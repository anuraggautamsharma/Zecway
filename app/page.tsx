import WaitlistForm from "./waitlist-form";

const SOURCES = [
  "Google Drive",
  "Slack",
  "Microsoft Teams",
  "Notion",
  "Confluence",
  "Jira",
  "GitHub",
  "Salesforce",
];

const PILLARS = [
  {
    title: "Find anything",
    body: "One search bar across every tool your company uses. Results ranked by what matters to you — not just keyword matches.",
  },
  {
    title: "Ask anything",
    body: "Plain-language questions, AI answers grounded in your company's real knowledge. Every claim cites its source document.",
  },
  {
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
    <main className="glow min-h-screen">
      <div className="mx-auto max-w-5xl px-6">
        {/* Nav */}
        <nav className="flex items-center justify-between py-8">
          <span className="text-lg font-bold tracking-tight">zecway</span>
          <a
            href="#waitlist"
            className="rounded-full border border-line px-5 py-2 text-sm text-mist transition hover:border-accent hover:text-snow"
          >
            Join the waitlist
          </a>
        </nav>

        {/* Hero */}
        <section className="flex flex-col items-center pb-24 pt-20 text-center">
          <p className="mb-6 rounded-full border border-line bg-ink-soft px-4 py-1.5 text-xs tracking-wide text-mist">
            Work AI for the enterprise — early access
          </p>
          <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            One search bar for your{" "}
            <span className="text-accent">entire company</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
            Zecway connects every tool your company uses and gives every employee
            one place to search and ask — with AI answers that cite their sources
            and always respect who&apos;s allowed to see what.
          </p>
          <div className="mt-10 flex justify-center" id="waitlist">
            <WaitlistForm />
          </div>
          <p className="mt-4 text-xs text-mist">
            Free pilot for your first team. Live in a day.
          </p>
        </section>

        {/* Sources */}
        <section className="border-t border-line py-14">
          <p className="mb-6 text-center text-xs uppercase tracking-widest text-mist">
            Works with the tools you already use
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {SOURCES.map((s) => (
              <span
                key={s}
                className="rounded-full border border-line bg-ink-soft px-4 py-2 text-sm text-mist"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* Pillars */}
        <section className="grid gap-6 border-t border-line py-20 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-2xl border border-line bg-ink-soft p-8">
              <h3 className="text-lg font-semibold">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist">{p.body}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="border-t border-line py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Live in a day, not a quarter
          </h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step}>
                <span className="text-sm font-semibold text-accent">{s.step}</span>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="flex flex-col items-center border-t border-line py-24 text-center">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight">
            Stop hunting for answers your company already has
          </h2>
          <p className="mt-4 max-w-xl text-mist">
            Join the early-access waitlist and be first in line when pilots open.
          </p>
          <div className="mt-8 flex justify-center">
            <WaitlistForm compact />
          </div>
        </section>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-line py-10 text-xs text-mist">
          <span>© {new Date().getFullYear()} Zecway</span>
          <span>Enterprise-grade security from day one</span>
        </footer>
      </div>
    </main>
  );
}
