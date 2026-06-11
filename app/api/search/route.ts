import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Instant keyword search. Permission filtering happens inside search_chunks,
// in the database — same guarantee as Ask, no AI call in the path.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace_id");
  const q = url.searchParams.get("q")?.trim();
  if (!workspaceId || !q) {
    return NextResponse.json({ results: [] });
  }

  // optional scope: ?sources=upload,gdrive and ?days=30
  const sources = url.searchParams.get("sources")?.split(",").filter(Boolean) ?? null;
  const days = Number(url.searchParams.get("days"));
  const afterTs =
    Number.isFinite(days) && days > 0
      ? new Date(Date.now() - days * 86400 * 1000).toISOString()
      : null;

  const { data, error } = await supabase.rpc("search_chunks", {
    ws: workspaceId,
    search_query: q,
    user_principals: [user.email],
    src_filter: sources && sources.length > 0 ? sources : null,
    after_ts: afterTs,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
