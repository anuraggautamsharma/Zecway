import Link from "next/link";
import PageBody from "./page-body";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { acceptInvite, createWorkspace } from "./actions";
import HomeHero from "./home-hero";

type Invite = { id: string; workspace_id: string; workspace_name: string; role: string };

const SOURCE_LABELS: Record<string, string> = {
  upload: "Upload",
  gdrive: "Google Drive",
  slack: "Slack",
  notion: "Notion",
};

function SourceBadge({ source }: { source: string }) {
  return (
    <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist">
      {SOURCE_LABELS[source] ?? source}
    </span>
  );
}

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function AppHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { user, workspace } = await getAppContext();
  const supabase = await createClient();

  const { data: pendingInvites } = await supabase.rpc("list_pending_invites");
  const invites = (pendingInvites ?? []) as Invite[];

  if (!workspace) {
    return (
      <PageBody><>
        {invites.length > 0 && (
          <div className="mb-8 space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="animate-pop flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-5 py-3.5"
              >
                <p className="text-sm text-ink">
                  You&apos;ve been invited to join <strong>{inv.workspace_name}</strong>
                  <span className="text-mist"> as {inv.role}</span>
                </p>
                <form action={acceptInvite}>
                  <input type="hidden" name="invite_id" value={inv.id} />
                  <button className="shrink-0 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white transition hover:bg-dark-elevated active:scale-[0.97]">
                    Join
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
        <div className="animate-pop mx-auto max-w-md rounded-2xl border border-line bg-paper p-8">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Name your workspace</h1>
          <p className="mt-1 text-sm text-mist">
            Usually your company name — this is where your knowledge lives.
          </p>
          <form action={createWorkspace} className="mt-6 flex gap-2">
            <input
              name="name"
              required
              placeholder="Acme Inc"
              className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-mist focus:border-accent/50 focus:outline-none"
            />
            <button className="shrink-0 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-dark-elevated active:scale-[0.97]">
              Create
            </button>
          </form>
        </div>
      </></PageBody>
    );
  }

  const [
    { count },
    { data: sourceRows },
    { data: recentDocs },
    { data: recentChats },
  ] = await Promise.all([
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id),
    supabase.from("documents").select("source").eq("workspace_id", workspace.id),
    supabase
      .from("documents")
      .select("id, title, source, url, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);
  const docCount = count ?? 0;
  const sources = [...new Set((sourceRows ?? []).map((r) => r.source))].sort();

  const suggestions = (recentDocs ?? [])
    .slice(0, 3)
    .map((d) => d.title)
    .filter(Boolean)
    .map((t) => {
      const short = t.length > 38 ? `${t.slice(0, 38)}…` : t;
      return `What does “${short}” cover?`;
    });

  // first name from the email's local part — good enough until profiles exist
  const userName = (user?.email ?? "there")
    .split("@")[0]
    .split(/[._\d]/)[0]
    .replace(/^./, (c) => c.toUpperCase());

  return (
    <PageBody><div className="pt-2 md:pt-8">
      <HomeHero
        workspaceId={workspace.id}
        hasDocuments={docCount > 0}
        sources={sources}
        suggestions={suggestions}
        initialQuery={q ?? ""}
        userName={userName}
      />

      {/* below the bar: the workspace, alive */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
              Recent in the library
            </h2>
            <Link
              href="/app/documents"
              className="text-xs text-accent hover:text-accent-deep"
            >
              {docCount > 0 ? `all ${docCount} →` : "open library →"}
            </Link>
          </div>
          <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-paper">
            {(recentDocs ?? []).map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-mist">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {d.url ? (
                      <a href={d.url} className="hover:text-accent">
                        {d.title}
                      </a>
                    ) : (
                      d.title
                    )}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-mist">
                    added {timeAgo(d.created_at)}
                  </p>
                </div>
                <SourceBadge source={d.source} />
              </div>
            ))}
            {(recentDocs ?? []).length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-mist">
                The library is empty —{" "}
                <Link href="/app/documents" className="font-medium text-accent">
                  add the first documents
                </Link>{" "}
                to start asking.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section>
            <div className="flex items-baseline justify-between">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist">
                Recent chats
              </h2>
              <Link href="/app/assistant" className="text-xs text-accent hover:text-accent-deep">
                open →
              </Link>
            </div>
            <div className="mt-3 space-y-1.5">
              {(recentChats ?? []).map((c) => (
                <Link
                  key={c.id}
                  href={`/app/assistant?c=${c.id}`}
                  className="block truncate rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink transition hover:border-accent/40"
                >
                  {c.title}
                </Link>
              ))}
              {(recentChats ?? []).length === 0 && (
                <Link
                  href="/app/assistant"
                  className="block rounded-xl border border-dashed border-line px-4 py-3 text-sm text-mist transition hover:border-accent/40 hover:text-accent"
                >
                  Start your first chat →
                </Link>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-cream p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-accent">agent</p>
            <h3 className="mt-1.5 text-sm font-semibold text-ink">RFP answerer</h3>
            <p className="mt-1 text-xs leading-relaxed text-mist">
              Paste a questionnaire, get cited answers from your own knowledge.
            </p>
            <Link
              href="/app/agents"
              className="mt-3 inline-block rounded-lg bg-ink px-3.5 py-2 text-xs font-medium text-white transition active:scale-[0.97]"
            >
              Run agent →
            </Link>
          </section>
        </aside>
      </div>
    </div></PageBody>
  );
}
