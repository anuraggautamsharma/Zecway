"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function grantAccess(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const supabase = await createClient();
  await supabase.rpc("admin_grant_access", { grant_email: email });
  revalidatePath("/app/admin");
}

export async function revokeAccess(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  const supabase = await createClient();
  await supabase.rpc("admin_revoke_access", { grant_email: email });
  revalidatePath("/app/admin");
}
