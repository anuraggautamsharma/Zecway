import Link from "next/link";
import PageBody from "../page-body";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";

export const metadata = { title: "Zecway — Agents" };

export default async function AgentsLibraryPage() {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  const supabase = await createClient();
  const [{ data: agents }, { data: runRows }] = await Promise.all([
    supabase
      .from("agents")
      .select("id, name, description, emoji, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("agent_runs")
      .select("agent_id, agent_slug")
      .eq("workspace_id", workspace.id),
  ]);

  const runCount = (key: string | null, slug?: string) =>
    (runRows ?? []).filter((r) =>
      key ? r.agent_id === key : r.agent_slug === slug,
    ).length;

  const total = (agents?.length ?? 0) + 1;

  return (
    <PageBody>

    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">
            Agents <span className="font-normal text-mist">({total})</span>
          </h1>
          <p className="mt-1 text-sm text-mist">
            Saved recipes that search, reason and produce cited documents —
            running as you, seeing only what you can see.
          </p>
        </div>
        <Link
          href="/app/agents/new"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97]"
        >
          + Create agent
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* built-in template */}
        <Link
          href="/app/agents/rfp-answerer"
          className="group rounded-2xl border border-line bg-paper p-5 transition hover:border-accent/40 hover:shadow-[0_12px_24px_-16px_rgba(20,20,19,0.25)]"
        >
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-lg">
              📋
            </span>
            <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist">
              built-in
            </span>
          </div>
          <h2 className="mt-3 text-sm font-semibold text-ink group-hover:text-accent-deep">
            RFP answerer
          </h2>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist">
            Paste questionnaire questions; get cited answers from your own
            knowledge, one per question.
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-mist/70">
            {runCount(null, "rfp-answerer")} runs
          </p>
        </Link>

        {(agents ?? []).map((a) => (
          <Link
            key={a.id}
            href={`/app/agents/${a.id}`}
            className="group rounded-2xl border border-line bg-paper p-5 transition hover:border-accent/40 hover:shadow-[0_12px_24px_-16px_rgba(20,20,19,0.25)]"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-lg">
                {a.emoji}
              </span>
              <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist">
                custom
              </span>
            </div>
            <h2 className="mt-3 text-sm font-semibold text-ink group-hover:text-accent-deep">
              {a.name}
            </h2>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist">
              {a.description || "No description yet."}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-mist/70">
              {runCount(a.id)} runs
            </p>
          </Link>
        ))}

        {/* create card */}
        <Link
          href="/app/agents/new"
          className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-line p-5 text-center text-mist transition hover:border-accent/50 hover:text-accent"
        >
          <span className="text-2xl">＋</span>
          <span className="mt-2 text-sm font-medium">Create an agent</span>
          <span className="mt-1 text-xs">describe a chore, get a worker</span>
        </Link>
      </div>
    </div>
    </PageBody>
  );
}
