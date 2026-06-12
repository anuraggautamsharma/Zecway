import { NextResponse } from "next/server";
import { workspaceAi, TRIAL_CAPPED } from "@/lib/workspace-ai";
import { createClient } from "@/lib/supabase/server";
import {
  type AgentDefV2,
  type StepDef,
  type FieldDef,
  synthesizeLegacy,
  BUILTIN_RFP,
} from "@/lib/agent-def";
import { buildRunContext, executeAgentRun, MAX_STEPS } from "@/lib/agent-engine";

export const maxDuration = 300;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: {
    workspace_id?: string;
    agent_slug?: string;
    agent_id?: string;
    preview?: {
      name?: string;
      split_lines?: boolean;
      fields?: FieldDef[];
      steps?: StepDef[];
      // legacy preview shape
      search_hint?: string;
      respond_instructions?: string;
    };
    input?: { text?: string; questions?: string; inputs?: Record<string, string> };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const workspaceId = body.workspace_id;
  if (!workspaceId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // ── resolve the definition: preview draft, saved agent, or built-in ──
  let def: AgentDefV2;
  if (body.preview) {
    const p = body.preview;
    if (Array.isArray(p.steps) && p.steps.length > 0) {
      def = {
        id: null,
        slug: "preview",
        name: p.name || "Untitled agent",
        splitLines: Boolean(p.split_lines),
        fields: Array.isArray(p.fields) ? p.fields : [],
        steps: p.steps.slice(0, MAX_STEPS),
      };
    } else if (p.respond_instructions) {
      const synth = synthesizeLegacy({
        input_label: "Input",
        input_placeholder: "",
        split_lines: Boolean(p.split_lines),
        search_hint: p.search_hint ?? "",
        respond_instructions: p.respond_instructions,
      });
      def = {
        id: null,
        slug: "preview",
        name: p.name || "Untitled agent",
        splitLines: Boolean(p.split_lines),
        ...synth,
      };
    } else {
      return NextResponse.json({ error: "Nothing to preview yet" }, { status: 400 });
    }
  } else if (body.agent_id) {
    const { data: a, error } = await supabase
      .from("agents")
      .select(
        "id, name, split_lines, search_hint, respond_instructions, input_label, input_placeholder, workspace_id, fields, steps",
      )
      .eq("id", body.agent_id)
      .single();
    if (error || !a || a.workspace_id !== workspaceId) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    const v2 = Array.isArray(a.steps) && a.steps.length > 0;
    const synth = v2 ? null : synthesizeLegacy(a);
    def = {
      id: a.id,
      slug: "custom",
      name: a.name,
      splitLines: a.split_lines,
      fields: v2 ? (a.fields as FieldDef[]) : synth!.fields,
      steps: (v2 ? (a.steps as StepDef[]) : synth!.steps).slice(0, MAX_STEPS),
    };
  } else if (body.agent_slug === "rfp-answerer") {
    def = BUILTIN_RFP;
  } else {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  // ── inputs → variable context ──
  const rawInputs = body.input?.inputs ?? {};
  if (def.fields.length > 0 && Object.keys(rawInputs).length === 0) {
    // legacy clients send a single text blob — map it to the first field
    const legacyText = body.input?.text ?? body.input?.questions ?? "";
    if (legacyText) rawInputs[def.fields[0].key] = legacyText;
  }
  const { ctx, items, error: inputError } = buildRunContext(def, rawInputs);
  if (inputError) {
    return NextResponse.json({ error: inputError }, { status: 400 });
  }

  const { data: run, error: runError } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      agent_slug: def.slug,
      agent_id: def.id,
      agent_name: def.name,
      input: { inputs: ctx },
    })
    .select("id")
    .single();
  if (runError || !run) {
    return NextResponse.json(
      { error: runError?.message ?? "Could not start run" },
      { status: 500 },
    );
  }
  const runId = run.id;
  const { provider, ownKey, capped } = await workspaceAi(supabase, workspaceId);
  if (capped) {
    await supabase
      .from("agent_runs")
      .update({ status: "failed", finished_at: new Date().toISOString() })
      .eq("id", runId);
    return NextResponse.json({ error: TRIAL_CAPPED }, { status: 429 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await executeAgentRun({
          supabase,
          provider,
          ownKey,
          def,
          ctx,
          items,
          runId,
          workspaceId,
          principalEmail: user.email ?? "",
          emit: (obj) =>
            controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n")),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
