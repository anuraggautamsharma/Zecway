import { redirect } from "next/navigation";
import PageBody from "../page-body";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import Upload from "../upload";

export default async function DocumentsPage() {
  const { workspace } = await getAppContext();
  if (!workspace) redirect("/app");

  const supabase = await createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, source, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const docs = documents ?? [];

  return (
    <PageBody><div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Library</h1>
        <p className="mt-1 text-sm text-mist">
          {docs.length === 0
            ? "Nothing here yet — add the first documents below."
            : `${docs.length} document${docs.length === 1 ? "" : "s"} in the graph.`}
        </p>
      </div>

      <Upload workspaceId={workspace.id} />

      {docs.length > 0 && (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream text-mist">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{d.title}</p>
                <p className="mt-0.5 font-mono text-[11px] text-mist">
                  added{" "}
                  {new Date(d.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-mist">
                {d.source}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div></PageBody>
  );
}
