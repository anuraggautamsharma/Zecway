import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type AppContext = {
  user: User | null;
  workspace: { id: string; name: string } | null;
  role: string | null;
  isFounder: boolean;
};

// One auth + workspace lookup per request, shared by layout and pages.
export const getAppContext = cache(async (): Promise<AppContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { user: null, workspace: null, role: null as string | null, isFounder: false };

  const [{ data: memberships }, { data: isFounder }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("role, workspaces (id, name)")
      .order("created_at", { ascending: true }),
    supabase.rpc("is_founder"),
  ]);

  const membership = memberships?.[0];
  return {
    user,
    workspace: (membership?.workspaces as unknown as { id: string; name: string }) ?? null,
    role: membership?.role ?? null,
    isFounder: Boolean(isFounder),
  };
});
