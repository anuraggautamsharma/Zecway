"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { aiWithKey } from "@/lib/ai";
import { encryptSecret, encryptionReady } from "@/lib/crypto";

export async function saveAiKey(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = String(formData.get("workspace_id") ?? "");
  const key = String(formData.get("api_key") ?? "").trim();
  if (!workspaceId || !key) redirect("/app/settings?error=missing");
  if (!encryptionReady()) redirect("/app/settings?error=not-ready");

  // prove the key works before storing it — one tiny embedding call
  try {
    await aiWithKey(key).embedTexts(["zecway key check"]);
  } catch {
    redirect("/app/settings?error=invalid");
  }

  const { error } = await supabase.rpc("set_workspace_ai_key", {
    ws: workspaceId,
    cipher: encryptSecret(key),
  });
  if (error) redirect("/app/settings?error=denied");
  redirect("/app/settings?saved=1");
}

export async function saveSlackWebhook(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = String(formData.get("workspace_id") ?? "");
  const url = String(formData.get("webhook_url") ?? "").trim();
  if (!workspaceId || !url) redirect("/app/settings?error=missing");
  if (!/^https:\/\/hooks\.slack\.com\//.test(url)) {
    redirect("/app/settings?error=slack-invalid");
  }
  if (!encryptionReady()) redirect("/app/settings?error=not-ready");

  const { error } = await supabase.rpc("set_workspace_slack", {
    ws: workspaceId,
    cipher: encryptSecret(url),
  });
  if (error) redirect("/app/settings?error=denied");
  redirect("/app/settings?slack=1");
}

export async function clearSlackWebhook(formData: FormData) {
  const supabase = await createClient();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!workspaceId) redirect("/app/settings");
  await supabase.rpc("clear_workspace_slack", { ws: workspaceId });
  redirect("/app/settings?slack-cleared=1");
}

export async function clearAiKey(formData: FormData) {
  const supabase = await createClient();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!workspaceId) redirect("/app/settings");
  await supabase.rpc("clear_workspace_ai_key", { ws: workspaceId });
  redirect("/app/settings?cleared=1");
}
