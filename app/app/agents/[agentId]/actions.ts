"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";

// Approve or dismiss a pending agent action. RLS scopes everything to
// workspace members; nothing leaves Zecway without this human step.
export async function resolveAgentAction(
  formData: FormData,
): Promise<string | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const actionId = String(formData.get("action_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!actionId || (decision !== "approve" && decision !== "dismiss")) return;

  const { data: action } = await supabase
    .from("agent_run_actions")
    .select("id, run_id, workspace_id, kind, payload, status")
    .eq("id", actionId)
    .single();
  if (!action || action.status !== "pending") return;

  let status = "dismissed";
  if (decision === "approve" && action.kind === "send_slack") {
    const { data: ws } = await supabase
      .from("workspaces")
      .select("slack_webhook_cipher")
      .eq("id", action.workspace_id)
      .single();
    if (!ws?.slack_webhook_cipher) {
      status = "failed";
    } else {
      try {
        const webhook = decryptSecret(ws.slack_webhook_cipher);
        if (!webhook) throw new Error("webhook unreadable");
        const message = String(
          (action.payload as { message?: string })?.message ?? "",
        );
        const res = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message || "(empty message)" }),
        });
        status = res.ok ? "sent" : "failed";
      } catch {
        status = "failed";
      }
    }
  }

  await supabase
    .from("agent_run_actions")
    .update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", actionId)
    .eq("status", "pending");

  revalidatePath(`/app/agents`);
  return status;
}
