import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { workspaceAi } from "@/lib/workspace-ai";
import { buildRunContext, executeAgentRun, MAX_STEPS } from "@/lib/agent-engine";
import { isDue, type Schedule } from "@/lib/schedule";
import {
  synthesizeLegacy,
  type AgentDefV2,
  type FieldDef,
  type StepDef,
} from "@/lib/agent-def";

export const maxDuration = 300;

// Wake-on-visit scheduler: when someone opens the app, their own due
// scheduled agents run under their session — no service key required.
// The cron route covers true background runs when one is configured.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ran: 0 });

  let body: { workspace_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ran: 0 });
  }
  const workspaceId = body.workspace_id;
  if (!workspaceId) return NextResponse.json({ ran: 0 });

  const { data: agents } = await supabase
    .from("agents")
    .select(
      "id, name, split_lines, search_hint, respond_instructions, input_label, input_placeholder, fields, steps, schedule, schedule_inputs, last_scheduled_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("created_by", user.id)
    .not("schedule", "is", null);

  const due = (agents ?? [])
    .filter((a) => isDue(a.schedule as Schedule, a.last_scheduled_at))
    .slice(0, 2);

  let ran = 0;
  for (const a of due) {
    // claim before running so parallel tabs don't double-run
    let claim = supabase
      .from("agents")
      .update({ last_scheduled_at: new Date().toISOString() })
      .eq("id", a.id);
    claim = a.last_scheduled_at
      ? claim.eq("last_scheduled_at", a.last_scheduled_at)
      : claim.is("last_scheduled_at", null);
    const { data: claimed } = await claim.select("id");
    if (!claimed || claimed.length === 0) continue;

    const v2 = Array.isArray(a.steps) && (a.steps as StepDef[]).length > 0;
    const synth = v2 ? null : synthesizeLegacy(a);
    const def: AgentDefV2 = {
      id: a.id,
      slug: "custom",
      name: a.name,
      splitLines: a.split_lines,
      fields: v2 ? (a.fields as FieldDef[]) : synth!.fields,
      steps: (v2 ? (a.steps as StepDef[]) : synth!.steps).slice(0, MAX_STEPS),
    };
    const inputs = (a.schedule_inputs ?? {}) as Record<string, string>;
    const { ctx, items, error } = buildRunContext(def, inputs);
    if (error) continue;

    const { data: run } = await supabase
      .from("agent_runs")
      .insert({
        workspace_id: workspaceId,
        user_id: user.id,
        agent_slug: def.slug,
        agent_id: def.id,
        agent_name: def.name,
        input: { inputs: ctx },
        triggered_by: "schedule",
      })
      .select("id")
      .single();
    if (!run) continue;

    const { provider, ownKey, capped } = await workspaceAi(supabase, workspaceId);
    if (capped) {
      await supabase
        .from("agent_runs")
        .update({ status: "failed", finished_at: new Date().toISOString() })
        .eq("id", run.id);
      continue;
    }
    await executeAgentRun({
      supabase,
      provider,
      ownKey,
      def,
      ctx,
      items,
      runId: run.id,
      workspaceId,
      principalEmail: user.email ?? "",
    });
    ran++;
  }
  return NextResponse.json({ ran });
}
