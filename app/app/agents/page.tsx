import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import AgentsClient, { type RunSummary, type RunDetail } from "./agents-client";

export const metadata = { title: "Zecway — Agents" };

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ run?: string }>;
}) {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  const { run } = await searchParams;
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id, agent_slug, status, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(20);

  let initialRun: RunDetail | null = null;
  if (run) {
    const [{ data: r }, { data: steps }] = await Promise.all([
      supabase
        .from("agent_runs")
        .select("id, status, output, citations, created_at")
        .eq("id", run)
        .single(),
      supabase
        .from("agent_run_steps")
        .select("idx, kind, title, status, detail")
        .eq("run_id", run)
        .order("idx", { ascending: true }),
    ]);
    if (r) {
      initialRun = {
        id: r.id,
        status: r.status,
        output: r.output,
        citations: (r.citations ?? []) as RunDetail["citations"],
        steps: (steps ?? []) as RunDetail["steps"],
      };
    }
  }

  return (
    <AgentsClient
      workspaceId={workspace.id}
      runs={(runs ?? []) as RunSummary[]}
      initialRun={initialRun}
    />
  );
}
