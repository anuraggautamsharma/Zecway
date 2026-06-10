import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { inviteMember, revokeInvite } from "../actions";

export default async function TeamPage() {
  const { workspace, role } = await getAppContext();
  if (!workspace) redirect("/app");
  const isAdmin = ["owner", "admin"].includes(role ?? "");

  const supabase = await createClient();
  const [{ data: members }, { data: openInvites }] = await Promise.all([
    supabase.rpc("list_workspace_members", { ws: workspace.id }),
    isAdmin
      ? supabase
          .from("workspace_invites")
          .select("id, email, role")
          .eq("workspace_id", workspace.id)
          .is("accepted_at", null)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  type Member = { user_id: string; email: string; role: string };
  type OpenInvite = { id: string; email: string; role: string };
  const team = (members ?? []) as Member[];
  const invites = (openInvites ?? []) as OpenInvite[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Team</h1>
        <p className="mt-1 text-sm text-mist">
          {team.length} member{team.length === 1 ? "" : "s"} in {workspace.name}.
        </p>
      </div>

      <ul className="divide-y divide-line rounded-xl border border-line bg-white">
        {team.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between px-5 py-3">
            <span className="truncate text-sm text-ink">{m.email}</span>
            <span className="ml-4 shrink-0 rounded-md border border-line px-2 py-0.5 text-xs text-mist">
              {m.role}
            </span>
          </li>
        ))}
        {invites.map((inv) => (
          <li key={inv.id} className="flex items-center justify-between px-5 py-3">
            <span className="truncate text-sm text-mist">{inv.email}</span>
            <span className="ml-4 flex shrink-0 items-center gap-2">
              <span className="rounded-md border border-dashed border-line px-2 py-0.5 text-xs text-mist">
                invited · {inv.role}
              </span>
              {isAdmin && (
                <form action={revokeInvite}>
                  <input type="hidden" name="invite_id" value={inv.id} />
                  <button className="text-xs text-mist transition hover:text-red-500">
                    Revoke
                  </button>
                </form>
              )}
            </span>
          </li>
        ))}
      </ul>

      {isAdmin && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mist">
            Invite someone
          </h2>
          <form action={inviteMember} className="mt-3 flex flex-wrap items-center gap-2">
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <input
              type="email"
              name="email"
              required
              placeholder="teammate@company.com"
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink placeholder:text-mist focus:border-ink/30 focus:outline-none"
            />
            <select
              name="role"
              defaultValue="member"
              className="rounded-lg border border-line bg-white px-2.5 py-2 text-sm text-mist focus:outline-none"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accent">
              Invite
            </button>
          </form>
          <p className="mt-2 text-xs text-mist">
            Until invite emails ship: ask them to sign in at zecway.com/login with this
            email — the invite appears automatically.
          </p>
        </div>
      )}
    </div>
  );
}
