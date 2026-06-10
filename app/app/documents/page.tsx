import { redirect } from "next/navigation";
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
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Library</h1>
        <p className="mt-1 text-sm text-mist">
          {docs.length === 0
            ? "Nothing here yet — add the first documents below."
            : `${docs.length} document${docs.length === 1 ? "" : "s"} in the graph.`}
        </p>
      </div>

      <Upload workspaceId={workspace.id} />

      {docs.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-paper">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-5 py-3">
              <span className="truncate text-sm text-ink">{d.title}</span>
              <span className="ml-4 flex shrink-0 items-center gap-3 text-xs text-mist">
                <span className="rounded-md border border-line px-2 py-0.5">{d.source}</span>
                {new Date(d.created_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
