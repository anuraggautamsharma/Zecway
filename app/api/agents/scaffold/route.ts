import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { workspaceAi, TRIAL_CAPPED } from "@/lib/workspace-ai";
import { fieldKey, type FieldDef, type StepDef } from "@/lib/agent-def";

export const maxDuration = 60;

const SYSTEM = `You design agents for Zecway, a company-knowledge tool. Given a plain-English description, output ONE JSON object describing the agent — no prose, no code fences.

Shape:
{
  "name": "short name",
  "emoji": "one emoji",
  "description": "one sentence teammates see on the card",
  "split_lines": false,
  "fields": [{ "key": "snake_case", "label": "Human label", "placeholder": "example", "long": false }],
  "steps": [ ...ordered steps... ]
}

Fields are the input form. Reference a field anywhere as [[field_key]]. A step's output is referenced as [[step_1]], [[step_2]] in the order they appear.

Step kinds (use the minimum needed):
{"kind":"search","query":"…"} — searches the company's own documents (permission-checked, cited). Prefer this.
{"kind":"web_search","query":"…"} — searches the public web.
{"kind":"think","instructions":"…"} — hidden reasoning whose output feeds later steps.
{"kind":"auto","goal":"…"} — autonomous: plans its own company+web searches toward a goal. Use for open-ended research.
{"kind":"branch","condition":"a yes/no question","if_true":[…steps…],"if_false":[…steps…]} — picks a lane.
{"kind":"send_slack","message":"…"} — drafts a Slack message for human approval.
{"kind":"respond","instructions":"…"} — writes the final cited answer. REQUIRED, and almost always LAST.

Rules:
- Always include exactly one top-level "respond" step, and make it last.
- Keep it to 2–4 steps unless the task truly needs more.
- Set "split_lines": true only when the first field is a list processed one item per line (e.g. questionnaire questions).
- Do not use a "read_doc" step (the user picks documents manually later).
- Put real, useful instructions in each step, referencing the fields and prior steps.`;

type RawStep = { kind?: string; [k: string]: unknown };

const KINDS = new Set([
  "search",
  "web_search",
  "think",
  "auto",
  "branch",
  "send_slack",
  "respond",
]);

// Keep only well-formed steps; coerce missing text to empty so the builder
// can show and fix them rather than crash.
function clean(steps: RawStep[], depth = 0): StepDef[] {
  if (!Array.isArray(steps)) return [];
  const out: StepDef[] = [];
  for (const s of steps) {
    if (!s || typeof s !== "object" || !KINDS.has(String(s.kind))) continue;
    const k = s.kind as string;
    if (k === "search" || k === "web_search") {
      out.push({ kind: k, query: String(s.query ?? "") } as StepDef);
    } else if (k === "auto") {
      out.push({ kind: "auto", goal: String(s.goal ?? "") });
    } else if (k === "send_slack") {
      out.push({ kind: "send_slack", message: String(s.message ?? "") });
    } else if (k === "branch" && depth === 0) {
      out.push({
        kind: "branch",
        condition: String(s.condition ?? ""),
        if_true: clean((s.if_true as RawStep[]) ?? [], depth + 1).slice(0, 3),
        if_false: clean((s.if_false as RawStep[]) ?? [], depth + 1).slice(0, 3),
      });
    } else if (k === "think" || k === "respond") {
      out.push({ kind: k, instructions: String(s.instructions ?? "") } as StepDef);
    }
  }
  return out;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { workspace_id?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const workspaceId = body.workspace_id;
  const description = (body.description ?? "").trim();
  if (!workspaceId || description.length < 8) {
    return NextResponse.json(
      { error: "Describe the agent in a sentence or two first." },
      { status: 400 },
    );
  }

  const { provider, capped } = await workspaceAi(supabase, workspaceId);
  if (capped) return NextResponse.json({ error: TRIAL_CAPPED }, { status: 429 });

  let raw: string;
  try {
    raw = await provider.generateText(`Description: ${description}`, SYSTEM);
  } catch {
    return NextResponse.json(
      { error: "The AI couldn't draft that — try rephrasing." },
      { status: 502 },
    );
  }

  let parsed: {
    name?: string;
    emoji?: string;
    description?: string;
    split_lines?: boolean;
    fields?: FieldDef[];
    steps?: RawStep[];
  };
  try {
    parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|```\s*$/gm, "").trim());
  } catch {
    return NextResponse.json(
      { error: "The AI returned something unexpected — try again." },
      { status: 502 },
    );
  }

  const fields: FieldDef[] = (Array.isArray(parsed.fields) ? parsed.fields : [])
    .slice(0, 4)
    .map((f, i) => ({
      key: fieldKey(String(f?.label ?? f?.key ?? `field_${i + 1}`), i),
      label: String(f?.label ?? "Input"),
      placeholder: f?.placeholder ? String(f.placeholder) : "",
      long: Boolean(f?.long),
    }));
  if (fields.length === 0) {
    fields.push({ key: "input", label: "Input", placeholder: "", long: true });
  }

  let steps = clean(parsed.steps ?? []).slice(0, 8);
  const hasRespond = steps.some(
    (s) =>
      s.kind === "respond" ||
      (s.kind === "branch" && [...s.if_true, ...s.if_false].some((t) => t.kind === "respond")),
  );
  if (!hasRespond) {
    steps.push({
      kind: "respond",
      instructions: "Write the final answer using the sources above. Cite every claim.",
    });
  }
  if (steps.length === 0) {
    steps = [
      { kind: "search", query: `[[${fields[0].key}]]` },
      { kind: "respond", instructions: "Answer using the sources. Cite every claim." },
    ];
  }

  return NextResponse.json({
    draft: {
      name: String(parsed.name ?? "Untitled agent").slice(0, 60),
      emoji: String(parsed.emoji ?? "🤖").slice(0, 4) || "🤖",
      description: String(parsed.description ?? "").slice(0, 140),
      splitLines: Boolean(parsed.split_lines),
      fields,
      steps,
      schedule: null,
      scheduleInputs: {},
    },
  });
}
