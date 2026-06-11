import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { acceptInvite, createWorkspace } from "./actions";
import SearchAsk from "./search-ask";
import Upload from "./upload";

type Invite = { id: string; workspace_id: string; workspace_name: string; role: string };

export default async function AppHome() {
  const { workspace } = await getAppContext();
  const supabase = await createClient();

  const { data: pendingInvites } = await supabase.rpc("list_pending_invites");
  const invites = (pendingInvites ?? []) as Invite[];

  if (!workspace) {
    return (
      <>
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
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-mist/70">
            next: add documents · invite your team · ask anything
          </p>
        </div>
      </>
    );
  }

  const [{ count: docCountRaw }, { count: memberCountRaw }, { data: recentDocs }] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
      supabase
        .from("workspace_members")
        .select("user_id", { count: "exact", head: true })
        .eq("workspace_id", workspace.id),
      supabase
        .from("documents")
        .select("title")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
  const docCount = docCountRaw ?? 0;
  const memberCount = memberCountRaw ?? 1;

  // Seed the empty search box with questions about what's actually in the library.
  const suggestions = (recentDocs ?? [])
    .map((d) => d.title)
    .filter(Boolean)
    .map((t) => {
      const short = t.length > 42 ? `${t.slice(0, 42)}…` : t;
      return `What does “${short}” cover?`;
    });

  // First run: no documents yet — guide, don't strand.
  if (docCount === 0) {
    return (
      <div className="pt-4 md:pt-12">
        <h1 className="text-center font-display text-3xl text-ink sm:text-4xl">
          Ask {workspace.name} anything
        </h1>
        <p className="mt-2 text-center text-sm text-mist">
          Two minutes of setup and your first cited answer is ready.
        </p>

        <div className="mx-auto mt-10 max-w-xl space-y-4">
          <div className="animate-pop rounded-2xl border border-line bg-paper p-6">
            <p className="font-mono text-[11px] uppercase tracking-wider text-accent">
              step 1 · add knowledge
            </p>
            <div className="mt-3">
              <Upload workspaceId={workspace.id} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-mist">
              Good first uploads: the employee handbook, product or pricing
              docs, meeting notes, policies — anything people keep asking you
              about.
            </p>
          </div>

          <div className="animate-pop rounded-2xl border border-line bg-paper p-6" style={{ animationDelay: "80ms" }}>
            <p className="font-mono text-[11px] uppercase tracking-wider text-mist">
              step 2 · bring your team
            </p>
            <p className="mt-2 text-sm text-mist">
              Zecway gets useful when the whole team asks it first.{" "}
              <Link href="/app/team" className="font-medium text-accent hover:text-accent-deep">
                Invite teammates →
              </Link>
            </p>
          </div>

          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-mist/70">
            step 3 · come back here and ask your first question
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 md:pt-16">
      <h1 className="text-center font-display text-3xl text-ink sm:text-4xl">
        Ask {workspace.name} anything
      </h1>
      <p className="mb-8 mt-2 text-center font-mono text-xs text-mist">
        Searching {docCount} document{docCount === 1 ? "" : "s"} ·{" "}
        <Link href="/app/documents" className="text-accent hover:text-accent-deep">
          manage the library
        </Link>
        {memberCount === 1 && (
          <>
            {" "}·{" "}
            <Link href="/app/team" className="text-accent hover:text-accent-deep">
              invite your team
            </Link>
          </>
        )}
      </p>
      <SearchAsk
        workspaceId={workspace.id}
        hasDocuments={docCount > 0}
        suggestions={suggestions}
      />
    </div>
  );
}
