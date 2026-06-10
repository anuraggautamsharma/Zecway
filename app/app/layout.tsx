import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppContext } from "@/lib/app-context";
import { signOut } from "./actions";
import Shell from "./shell";

export const metadata = { title: "Zecway — Workspace" };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");

  // Before a workspace exists there's nothing to navigate — plain centered page.
  if (!workspace) {
    return (
      <div className="min-h-screen">
        <header className="nav-blur sticky top-0 z-10 border-b border-line">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-ink">
              <img src="/zecway-mark.svg" alt="" className="h-5 w-auto" />
              <span className="font-display text-xl leading-none">Zecway</span>
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
    <Shell workspaceName={workspace.name} email={user.email ?? ""}>
      {children}
    </Shell>
  );
}
