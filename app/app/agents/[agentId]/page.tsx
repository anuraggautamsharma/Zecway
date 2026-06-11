import { redirect, notFound } from "next/navigation";
import PageBody from "../../page-body";
import { createClient } from "@/lib/supabase/server";
import { getAppContext } from "@/lib/app-context";
import RunClient, { type AgentView, type RunSummary, type RunDetail } from "./run-client";

export const metadata = { title: "Zecway — Agent" };

const BUILTIN: AgentView = {
  id: null,
  slug: "rfp-answerer",
  name: "RFP answerer",
  description:
    "Paste questionnaire questions — one per line, up to 10. The agent searches the graph per question and drafts cited answers.",
  emoji: "📋",
  inputLabel: "Questions",
  inputPlaceholder:
    "What is your data retention policy?\nDo you support SSO?\nWhere is customer data stored?",
  splitLines: true,
  searchHint: "",
  builtin: true,
};

export default async function AgentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ run?: string }>;
}) {
  const { user, workspace } = await getAppContext();
  if (!user) redirect("/login");
  if (!workspace) redirect("/app");

  const { agentId } = await params;
  const { run } = await searchParams;
  const supabase = await createClient();

  let agent: AgentView;
  if (agentId === "rfp-answerer") {
    agent = BUILTIN;
  } else {
    const { data: a } = await supabase
      .from("agents")
      .select(
        "id, name, description, emoji, input_label, input_placeholder, split_lines, search_hint",
      )
      .eq("id", agentId)
      .eq("workspace_id", workspace.id)
      .single();
    if (!a) notFound();
    agent = {
      id: a.id,
      slug: "custom",
      name: a.name,
      description: a.description,
      emoji: a.emoji,
      inputLabel: a.input_label,
      inputPlaceholder: a.input_placeholder,
      splitLines: a.split_lines,
      searchHint: a.search_hint,
      builtin: false,
    };
  }

  let runsQuery = supabase
    .from("agent_runs")
    .select("id, status, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(15);
  runsQuery = agent.id
    ? runsQuery.eq("agent_id", agent.id)
    : runsQuery.eq("agent_slug", agent.slug);
  const { data: runs } = await runsQuery;

  let initialRun: RunDetail | null = null;
  if (run) {
    const [{ data: r }, { data: steps }] = await Promise.all([
      supabase
        .from("agent_runs")
        .select("id, status, output, citations")
        .eq("id", run)
        .single(),
      supabase
        .from("agent_run_steps")
        .select("idx, kind, title, status")
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
    <PageBody>

    <RunClient
      workspaceId={workspace.id}
      agent={agent}
      runs={(runs ?? []) as RunSummary[]}
      initialRun={initialRun}
    />
    </PageBody>
  );
}
