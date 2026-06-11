import type { SupabaseClient } from "@supabase/supabase-js";
import { ai, aiWithKey, type AiProvider } from "./ai";
import { decryptSecret } from "./crypto";

export type WorkspaceAi = {
  provider: AiProvider;
  // true when the workspace's own key is in use — error copy differs
  ownKey: boolean;
  // true when the shared trial key's daily allowance is exhausted
  capped: boolean;
};

// Resolve which AI key serves this workspace: its own (BYOK) when set and
// decryptable, otherwise the shared trial key.
export async function workspaceAi(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<WorkspaceAi> {
  const { data } = await supabase
    .from("workspaces")
    .select("ai_key_cipher")
    .eq("id", workspaceId)
    .single();
  const cipher = data?.ai_key_cipher as string | null | undefined;
  if (cipher) {
    const key = decryptSecret(cipher);
    if (key) return { provider: aiWithKey(key), ownKey: true, capped: false };
  }
  const { data: used } = await supabase.rpc("ai_actions_today", { ws: workspaceId });
  return {
    provider: ai(),
    ownKey: false,
    capped: typeof used === "number" && used >= TRIAL_DAILY_ALLOWANCE,
  };
}

export const TRIAL_DAILY_ALLOWANCE = 50;

export const TRIAL_CAPPED =
  "This workspace has used today's free AI allowance. A workspace admin can add your own free Gemini key in Settings — unlimited use, still free.";

export const KEY_REJECTED =
  "Your workspace's AI key was rejected — an admin can fix it in Settings.";
