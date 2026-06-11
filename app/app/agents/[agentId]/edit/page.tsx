import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import { synthesizeLegacy, type FieldDef, type StepDef } from "@/lib/agent-def";
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
  const [{ data: a }, { data: docs }] = await Promise.all([
    supabase
      .from("agents")
      .select(
        "id, name, description, emoji, input_label, input_placeholder, split_lines, search_hint, respond_instructions, fields, steps",
      )
      .eq("id", agentId)
      .eq("workspace_id", workspace.id)
      .single(),
    supabase
      .from("documents")
      .select("id, title")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (!a) notFound();

  const v2 = Array.isArray(a.steps) && (a.steps as StepDef[]).length > 0;
  const synth = v2 ? null : synthesizeLegacy(a);

  return (
    <Builder
      workspaceId={workspace.id}
      documents={docs ?? []}
      initial={{
        id: a.id,
        name: a.name,
        description: a.description,
        emoji: a.emoji,
        splitLines: a.split_lines,
        fields: v2 ? (a.fields as FieldDef[]) : synth!.fields,
        steps: v2 ? (a.steps as StepDef[]) : synth!.steps,
      }}
    />
  );
}
