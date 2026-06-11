"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createAgent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const name = get("name");
  const instructions = get("respond_instructions");
  if (!name || !instructions) redirect("/app/agents/new");

  const { data: agent, error } = await supabase
    .from("agents")
    .insert({
      workspace_id: get("workspace_id"),
      name,
      description: get("description"),
      emoji: get("emoji") || "🤖",
      input_label: get("input_label") || "Input",
      input_placeholder: get("input_placeholder"),
      split_lines: formData.get("split_lines") === "on",
      search_hint: get("search_hint"),
      respond_instructions: instructions,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !agent) redirect("/app/agents");
  redirect(`/app/agents/${agent.id}`);
}
