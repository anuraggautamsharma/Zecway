import { redirect } from "next/navigation";
import PageBody from "../page-body";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { grantAccess, revokeAccess } from "./actions";
import CopyLink from "./copy-link";

export const metadata = { title: "Zecway — Founder console" };

type Row = {
  email: string;
  company: string | null;
  created_at: string;
  granted_at: string | null;
  joined: boolean;
};

function inviteUrl(email: string) {
  return `https://zecway.com/login?mode=signup&email=${encodeURIComponent(email)}`;
}

export default async function AdminPage() {
  const { user } = await getAppContext();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: isFounder } = await supabase.rpc("is_founder");
  if (!isFounder) redirect("/app");

  const { data } = await supabase.rpc("admin_waitlist");
  const rows = (data ?? []) as Row[];
  const waiting = rows.filter((r) => !r.granted_at && !r.joined).length;
  const invited = rows.filter((r) => r.granted_at && !r.joined).length;
  const joined = rows.filter((r) => r.joined).length;

  return (
    <PageBody>

    <div>
      <h1 className="text-xl font-semibold text-ink">Founder console</h1>
      <p className="mt-1 text-sm text-mist">
        Approve who gets into early access. Approved people sign up with their
        email at the invite link — nobody else can create an account.
      </p>

      <div className="mt-6 flex gap-6 rounded-xl border border-line bg-cream px-5 py-4 font-mono text-xs uppercase tracking-wider text-mist">
        <span>
          waiting <strong className="ml-1 text-ink">{waiting}</strong>
        </span>
        <span>
          invited <strong className="ml-1 text-accent">{invited}</strong>
        </span>
        <span>
          joined <strong className="ml-1 text-ink">{joined}</strong>
        </span>
      </div>

      <form action={grantAccess} className="mt-6 flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder="Grant access to any email…"
          className="flex-1 rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
        />
        <button className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97]">
          Approve
        </button>
      </form>

      <div className="mt-8 space-y-2">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-mist">
            No signups yet — they&apos;ll appear here the moment someone joins
            the waitlist.
          </p>
        )}
        {rows.map((r) => (
          <div
            key={r.email}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line bg-white/60 px-5 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{r.email}</p>
              <p className="mt-0.5 font-mono text-[11px] text-mist">
                {r.company ? `${r.company} · ` : ""}
                {new Date(r.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            {r.joined ? (
              <span className="rounded-md bg-card px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-ink">
                joined
              </span>
            ) : r.granted_at ? (
              <>
                <span className="rounded-md bg-accent-soft px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-accent-deep">
                  invited
                </span>
                <CopyLink url={inviteUrl(r.email)} />
                <form action={revokeAccess}>
                  <input type="hidden" name="email" value={r.email} />
                  <button className="text-xs text-mist transition hover:text-red-500">
                    Revoke
                  </button>
                </form>
              </>
            ) : (
              <form action={grantAccess}>
                <input type="hidden" name="email" value={r.email} />
                <button className="rounded-lg bg-ink px-3.5 py-1.5 text-xs font-medium text-white transition active:scale-[0.97]">
                  Approve
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-mist">
        After approving, copy the invite link and send it to them however you
        like — email, LinkedIn DM, WhatsApp. The link pre-fills their email on
        the sign-up form; only approved emails can complete sign-up.
      </p>
    </div>
    </PageBody>
  );
}
