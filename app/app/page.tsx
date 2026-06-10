import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { acceptInvite, createWorkspace } from "./actions";
import SearchAsk from "./search-ask";

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
                  <button className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-accent-deep">
                    Join
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
        <div className="animate-pop mx-auto max-w-md rounded-2xl border border-line bg-paper p-8 shadow-[0_1px_2px_rgba(23,21,19,0.04),0_16px_40px_-20px_rgba(23,21,19,0.15)]">
          <h1 className="font-display text-2xl text-ink">Name your workspace</h1>
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
            <button className="shrink-0 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep">
              Create
            </button>
          </form>
        </div>
      </>
    );
  }

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);
  const docCount = count ?? 0;

  return (
    <div className="pt-4 md:pt-16">
      <h1 className="text-center font-display text-3xl text-ink sm:text-4xl">
        Ask {workspace.name} anything
      </h1>
      <p className="mb-8 mt-2 text-center text-sm text-mist">
        {docCount === 0 ? (
          <>
            The library is empty —{" "}
            <Link href="/app/documents" className="font-medium text-accent">
              add the first documents
            </Link>{" "}
            to start asking.
          </>
        ) : (
          <>
            Searching {docCount} document{docCount === 1 ? "" : "s"} ·{" "}
            <Link href="/app/documents" className="text-accent hover:text-accent-deep">
              manage the library
            </Link>
          </>
        )}
      </p>
      <SearchAsk workspaceId={workspace.id} hasDocuments={docCount > 0} />
    </div>
  );
}
