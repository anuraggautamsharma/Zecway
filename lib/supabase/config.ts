// Zecway Supabase project's publishable credentials — safe to ship publicly;
// row-level security guards every table. Env vars override for other projects.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://huwyqieadhssdnrqrblx.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "sb_publishable_bwy_MkoFBVkzMQCbjHt5PQ_Lw_WsUHy";
