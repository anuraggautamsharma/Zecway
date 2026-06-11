import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import Builder from "./builder";

export const metadata = { title: "Zecway — Create agent" };

export default async function NewAgentPage() {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("id, title")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return <Builder workspaceId={workspace.id} documents={docs ?? []} />;
}
