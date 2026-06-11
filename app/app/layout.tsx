import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { signOut } from "./actions";
import Shell from "./shell";

export const metadata = { title: "Zecway — Workspace" };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace, isFounder, role } = await getAppContext();
  if (!user) redirect("/login");

  // Before a workspace exists there's nothing to navigate — plain centered page.
  if (!workspace) {
    return (
      <div className="app-surface min-h-screen bg-paper">
        <header className="nav-blur sticky top-0 z-10 border-b border-line">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="block">
              <img src="/brand/zecway-horizontal.png" alt="Zecway" className="h-7 w-auto" />
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
        <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
      </div>
    );
  }

  return (
    <Shell workspaceName={workspace.name} email={user.email ?? ""} isFounder={isFounder} isAdmin={role === "owner" || role === "admin"}>
      {children}
    </Shell>
  );
}
