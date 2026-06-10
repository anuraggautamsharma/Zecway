import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createWorkspace, signOut } from "./actions";
import Workspace from "./workspace";

export const metadata = { title: "Zecway — Workspace" };

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

  const workspace = memberships?.[0]?.workspaces as
    | { id: string; name: string }
    | undefined;

  const { data: documents } = workspace
    ? await supabase
        .from("documents")
        .select("id, title, source, created_at")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false })
    : { data: null };

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
              <button className="rounded-full border border-line px-4 py-1.5 text-xs font-medium text-mist transition hover:border-accent/40 hover:text-ink">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {workspace ? (
          <Workspace
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            documents={documents ?? []}
          />
        ) : (
          <div className="animate-pop mx-auto max-w-md rounded-2xl border border-line bg-white p-8 shadow-[0_20px_60px_-25px_rgba(240,89,10,0.3)]">
            <h1 className="text-xl font-semibold text-ink">Name your workspace</h1>
            <p className="mt-1 text-sm text-mist">
              Usually your company name — this is where your knowledge graph lives.
            </p>
            <form action={createWorkspace} className="mt-6 flex gap-2">
              <input
                name="name"
                required
                placeholder="Acme Inc"
                className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-mist focus:border-accent/50 focus:outline-none"
              />
              <button className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep">
                Create
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
