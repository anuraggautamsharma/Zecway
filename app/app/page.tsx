import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite, createWorkspace, signOut } from "./actions";
import Workspace from "./workspace";

export const metadata = { title: "Zecway — Workspace" };

type Invite = { id: string; workspace_id: string; workspace_name: string; role: string };

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("role, workspaces (id, name)")
    .order("created_at", { ascending: true });

  const membership = memberships?.[0];
  const workspace = membership?.workspaces as { id: string; name: string } | undefined;
  const myRole = membership?.role ?? "member";

  const { data: pendingInvites } = await supabase.rpc("list_pending_invites");
  const invites = (pendingInvites ?? []) as Invite[];

  const [{ data: documents }, { data: members }, { data: openInvites }] = workspace
    ? await Promise.all([
        supabase
          .from("documents")
          .select("id, title, source, created_at")
          .eq("workspace_id", workspace.id)
          .order("created_at", { ascending: false }),
        supabase.rpc("list_workspace_members", { ws: workspace.id }),
        ["owner", "admin"].includes(myRole)
          ? supabase
              .from("workspace_invites")
              .select("id, email, role")
              .eq("workspace_id", workspace.id)
              .is("accepted_at", null)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [] }),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  return (
    <div className="min-h-screen">
      <header className="nav-blur sticky top-0 z-10 border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold tracking-tight text-ink">
            zecway<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-mist sm:block">{user.email}</span>
            <form action={signOut}>
              <button className="rounded-lg border border-line px-4 py-1.5 text-xs font-medium text-mist transition hover:border-ink/30 hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Pending invites for this user */}
        {invites.length > 0 && (
          <div className="mb-8 space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="animate-pop flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-5 py-3.5"
              >
                <p className="text-sm text-ink">
                  You&apos;ve been invited to join{" "}
                  <strong>{inv.workspace_name}</strong>
                  <span className="text-mist"> as {inv.role}</span>
                </p>
                <form action={acceptInvite}>
                  <input type="hidden" name="invite_id" value={inv.id} />
                  <button className="shrink-0 rounded-lg bg-ink px-4 py-2 text-xs font-medium text-white transition hover:bg-accent">
                    Join
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        {workspace ? (
          <Workspace
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            documents={documents ?? []}
            members={members ?? []}
            openInvites={openInvites ?? []}
            isAdmin={["owner", "admin"].includes(myRole)}
          />
        ) : (
          <div className="animate-pop mx-auto max-w-md rounded-2xl border border-line bg-white p-8 shadow-[0_1px_2px_rgba(23,21,19,0.04),0_16px_40px_-20px_rgba(23,21,19,0.15)]">
            <h1 className="text-xl font-semibold text-ink">Name your workspace</h1>
            <p className="mt-1 text-sm text-mist">
              Usually your company name — this is where your knowledge graph lives.
            </p>
            <form action={createWorkspace} className="mt-6 flex gap-2">
              <input
                name="name"
                required
                placeholder="Acme Inc"
                className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-mist focus:border-accent/50 focus:outline-none"
              />
              <button className="shrink-0 rounded-xl bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent">
                Create
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
