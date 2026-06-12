import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";
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

// True background scheduler, fired by Vercel cron each IST morning. Needs
// SUPABASE_SERVICE_ROLE_KEY to act without a user session; until that's
// configured it no-ops and wake-on-visit carries the schedules instead.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (
    !request.headers.get("x-vercel-cron") &&
    !request.headers.get("user-agent")?.startsWith("vercel-cron")
  ) {
    // Without a secret the claim-gating makes early triggers harmless, but
    // still require the cron caller shape.
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({
      skipped: "SUPABASE_SERVICE_ROLE_KEY not configured — schedules run via wake-on-visit",
    });
  }
  const supabase = createServiceClient(SUPABASE_URL, serviceKey);

  const { data: agents } = await supabase
    .from("agents")
    .select(
      "id, workspace_id, created_by, name, split_lines, search_hint, respond_instructions, input_label, input_placeholder, fields, steps, schedule, schedule_inputs, last_scheduled_at",
    )
    .not("schedule", "is", null);

  const due = (agents ?? [])
    .filter((a) => isDue(a.schedule as Schedule, a.last_scheduled_at))
    .slice(0, 6);

  let ran = 0;
  for (const a of due) {
    let claim = supabase
      .from("agents")
      .update({ last_scheduled_at: new Date().toISOString() })
      .eq("id", a.id);
    claim = a.last_scheduled_at
      ? claim.eq("last_scheduled_at", a.last_scheduled_at)
      : claim.is("last_scheduled_at", null);
    const { data: claimed } = await claim.select("id");
    if (!claimed || claimed.length === 0) continue;

    // scheduled runs execute as the agent's creator
    const { data: creator } = await supabase.auth.admin.getUserById(a.created_by);
    const email = creator?.user?.email;
    if (!email) continue;

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
    const { ctx, items, error } = buildRunContext(
      def,
      (a.schedule_inputs ?? {}) as Record<string, string>,
    );
    if (error) continue;

    const { data: run } = await supabase
      .from("agent_runs")
      .insert({
        workspace_id: a.workspace_id,
        user_id: a.created_by,
        agent_slug: def.slug,
        agent_id: def.id,
        agent_name: def.name,
        input: { inputs: ctx },
        triggered_by: "schedule",
      })
      .select("id")
      .single();
    if (!run) continue;

    const { provider, ownKey, capped } = await workspaceAi(supabase, a.workspace_id);
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
      workspaceId: a.workspace_id,
      principalEmail: email,
    });
    ran++;
  }
  return NextResponse.json({ due: due.length, ran });
}
