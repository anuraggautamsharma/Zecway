"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_workspace", { ws_name: name });
  if (error) throw new Error(`Could not create workspace: ${error.message}`);
  revalidatePath("/app");
}

export async function inviteMember(formData: FormData) {
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "member");
  if (!workspaceId || !email || !["admin", "member"].includes(role)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId,
    email,
    role,
    invited_by: user?.id,
  });
  // 23505 = already invited; treat as done
  if (error && error.code !== "23505") {
    throw new Error(`Could not create invite: ${error.message}`);
  }
  revalidatePath("/app");
}

export async function revokeInvite(formData: FormData) {
  const inviteId = String(formData.get("invite_id") ?? "");
  if (!inviteId) return;
  const supabase = await createClient();
  await supabase.from("workspace_invites").delete().eq("id", inviteId);
  revalidatePath("/app");
}

export async function acceptInvite(formData: FormData) {
  const inviteId = String(formData.get("invite_id") ?? "");
  if (!inviteId) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", { invite_id: inviteId });
  if (error) throw new Error(`Could not accept invite: ${error.message}`);
  revalidatePath("/app");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
