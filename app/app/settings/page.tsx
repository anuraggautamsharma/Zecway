import { redirect } from "next/navigation";
import PageBody from "../page-body";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { encryptionReady } from "@/lib/crypto";
import { saveAiKey, clearAiKey } from "./actions";

export const metadata = { title: "Zecway — Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; cleared?: string; error?: string }>;
}) {
  const { user, workspace, role } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");
  if (role !== "owner" && role !== "admin") redirect("/app");

  const { saved, cleared, error } = await searchParams;
  const supabase = await createClient();
  const { data: ws } = await supabase
    .from("workspaces")
    .select("ai_key_set_at")
    .eq("id", workspace.id)
    .single();
  const keySetAt = ws?.ai_key_set_at as string | null;
  const ready = encryptionReady();

  const banner = saved
    ? { tone: "ok", text: "Your workspace key is verified and active — all AI now runs on it." }
    : cleared
      ? { tone: "ok", text: "Workspace key removed — back on the Zecway trial key." }
      : error === "invalid"
        ? { tone: "bad", text: "That key was rejected by Google — paste it exactly as shown in AI Studio." }
        : error === "denied"
          ? { tone: "bad", text: "Only workspace admins can change the AI key." }
          : error === "not-ready"
            ? { tone: "bad", text: "Key storage isn't configured on the server yet." }
            : null;

  return (
    <PageBody>

    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-mist">Workspace: {workspace.name}</p>

      {banner && (
        <p
          className={`animate-pop mt-5 rounded-xl border px-4 py-3 text-sm ${
            banner.tone === "ok"
              ? "border-accent/30 bg-accent-soft text-accent-deep"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {banner.text}
        </p>
      )}

      <section className="mt-7 rounded-2xl border border-line bg-paper p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">AI key</h2>
          <span
            className={`rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
              keySetAt
                ? "bg-accent-soft text-accent-deep"
                : "border border-line text-mist"
            }`}
          >
            {keySetAt ? "your key · active" : "zecway trial key"}
          </span>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-mist">
          Bring your own Google Gemini key and all of this workspace&apos;s AI
          — search answers, chat, agents, document indexing — runs on your own
          account, under your own terms. Keys are free:{" "}
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:text-accent-deep"
          >
            create one at Google AI Studio
          </a>{" "}
          in about two minutes (no card needed).
        </p>

        {!ready ? (
          <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-3 text-xs text-mist">
            Key storage isn&apos;t configured on the server yet — this section
            activates once it is.
          </p>
        ) : (
          <>
            <form action={saveAiKey} className="mt-5 flex gap-2">
              <input type="hidden" name="workspace_id" value={workspace.id} />
              <input
                type="password"
                name="api_key"
                required
                placeholder={keySetAt ? "Paste a new key to replace the current one" : "AIza…"}
                className="min-w-0 flex-1 rounded-lg border border-line bg-cream px-3.5 py-2.5 font-mono text-sm text-ink placeholder:font-sans placeholder:text-mist-soft focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/15"
              />
              <button className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep active:scale-[0.97]">
                {keySetAt ? "Replace" : "Verify & save"}
              </button>
            </form>
            <p className="mt-2.5 text-xs leading-relaxed text-mist">
              The key is checked with a test call, then stored encrypted. It is
              never shown again, never sent to the browser, and never visible in
              the database.
            </p>
            {keySetAt && (
              <form action={clearAiKey} className="mt-3">
                <input type="hidden" name="workspace_id" value={workspace.id} />
                <button className="text-xs text-mist transition hover:text-red-500">
                  Remove key and return to the trial
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
    </PageBody>
  );
}
