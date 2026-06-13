import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase/config";
import { workspaceAi } from "@/lib/workspace-ai";
import { buildRunContext, executeAgentRun, MAX_STEPS } from "@/lib/agent-engine";
import {
  synthesizeLegacy,
  type AgentDefV2,
  type FieldDef,
  type StepDef,
} from "@/lib/agent-def";

export const maxDuration = 300;

// External webhook trigger: anyone with the secret URL can POST to run the
// agent. Runs as the agent's creator (their permissions). Needs the service
// role key to act without a session — until that's set it no-ops cleanly.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Webhook triggers aren't enabled on this server yet." },
      { status: 503 },
    );
  }
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = createServiceClient(SUPABASE_URL, serviceKey);
  const { data: a } = await supabase
    .from("agents")
    .select(
      "id, workspace_id, created_by, name, split_lines, search_hint, respond_instructions, input_label, input_placeholder, fields, steps",
    )
    .eq("webhook_token", token)
    .single();
  if (!a) return NextResponse.json({ error: "Unknown webhook" }, { status: 404 });

  const { data: creator } = await supabase.auth.admin.getUserById(a.created_by);
  const email = creator?.user?.email;
  if (!email) return NextResponse.json({ error: "Agent owner missing" }, { status: 500 });

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

  // map the POST body to the agent's input fields
  let body: { inputs?: Record<string, string>; text?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* empty body is allowed */
  }
  const rawInputs: Record<string, string> = {};
  if (body.inputs && typeof body.inputs === "object") {
    for (const [k, v] of Object.entries(body.inputs)) rawInputs[k] = String(v);
  } else if (typeof body.text === "string") {
    if (def.fields[0]) rawInputs[def.fields[0].key] = body.text;
  } else if (def.fields[0]) {
    // arbitrary payload → hand the whole thing to the first field
    rawInputs[def.fields[0].key] = JSON.stringify(body);
  }

  const { ctx, items, error } = buildRunContext(def, rawInputs);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: a.workspace_id,
      user_id: a.created_by,
      agent_slug: def.slug,
      agent_id: def.id,
      agent_name: def.name,
      input: { inputs: ctx },
      triggered_by: "webhook",
    })
    .select("id")
    .single();
  if (!run) return NextResponse.json({ error: "Could not start run" }, { status: 500 });

  const { provider, ownKey, capped } = await workspaceAi(supabase, a.workspace_id);
  if (capped) {
    await supabase
      .from("agent_runs")
      .update({ status: "failed", finished_at: new Date().toISOString() })
      .eq("id", run.id);
    return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
  }

  // run to completion (no streaming — webhooks want a final result)
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

  const { data: done } = await supabase
    .from("agent_runs")
    .select("status, output, citations")
    .eq("id", run.id)
    .single();

  return NextResponse.json({
    ok: done?.status === "done",
    run_id: run.id,
    status: done?.status,
    output: done?.output ?? null,
    citations: done?.citations ?? [],
  });
}
