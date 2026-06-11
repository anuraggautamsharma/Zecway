import type { SupabaseClient } from "@supabase/supabase-js";
import { ai, aiWithKey, type AiProvider } from "./ai";
import { decryptSecret } from "./crypto";

export type WorkspaceAi = {
  provider: AiProvider;
  // true when the workspace's own key is in use — error copy differs
  ownKey: boolean;
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
    if (key) return { provider: aiWithKey(key), ownKey: true };
  }
  return { provider: ai(), ownKey: false };
}

export const KEY_REJECTED =
  "Your workspace's AI key was rejected — an admin can fix it in Settings.";
