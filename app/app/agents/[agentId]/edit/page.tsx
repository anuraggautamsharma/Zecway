import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import Builder from "../../new/builder";

export const metadata = { title: "Zecway — Edit agent" };

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  const { agentId } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase
    .from("agents")
    .select(
      "id, name, description, emoji, input_label, input_placeholder, split_lines, search_hint, respond_instructions",
    )
    .eq("id", agentId)
    .eq("workspace_id", workspace.id)
    .single();
  if (!a) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 font-mono text-[11px] text-mist">
        <a href="/app/agents" className="hover:text-accent">agents</a>
        <span>/</span>
        <a href={`/app/agents/${a.id}`} className="hover:text-accent">
          {a.name.toLowerCase()}
        </a>
        <span>/</span>
        <span className="text-ink">edit</span>
      </div>
      <Builder
        workspaceId={workspace.id}
        initial={{
          id: a.id,
          name: a.name,
          description: a.description,
          emoji: a.emoji,
          inputLabel: a.input_label,
          inputPlaceholder: a.input_placeholder,
          splitLines: a.split_lines,
          searchHint: a.search_hint,
          respondInstructions: a.respond_instructions,
        }}
      />
    </div>
  );
}
