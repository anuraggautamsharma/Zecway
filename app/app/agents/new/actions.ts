"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Create or update an agent recipe. RLS enforces membership on insert and
// author-or-admin on update.
export async function saveAgent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const name = get("name");
  const instructions = get("respond_instructions");
  if (!name || !instructions) throw new Error("missing required fields");

  let fields: unknown = [];
  let steps: unknown = [];
  try {
    fields = JSON.parse(get("fields") || "[]");
    steps = JSON.parse(get("steps") || "[]");
  } catch {
    throw new Error("invalid recipe");
  }

  const values = {
    name,
    description: get("description"),
    emoji: get("emoji") || "🤖",
    input_label: get("input_label") || "Input",
    input_placeholder: get("input_placeholder"),
    split_lines: formData.get("split_lines") === "on",
    search_hint: get("search_hint"),
    respond_instructions: instructions,
    fields,
    steps,
  };

  const agentId = get("agent_id");
  if (agentId) {
    const { error } = await supabase
      .from("agents")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", agentId);
    if (error) throw new Error(error.message);
    redirect(`/app/agents/${agentId}`);
  }

  const { data: agent, error } = await supabase
    .from("agents")
    .insert({ ...values, workspace_id: get("workspace_id"), created_by: user.id })
    .select("id")
    .single();
  if (error || !agent) throw new Error(error?.message ?? "insert failed");
  redirect(`/app/agents/${agent.id}`);
}
