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

  const { data, error } = await supabase.rpc("search_chunks", {
    ws: workspaceId,
    search_query: q,
    user_principals: [user.email],
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
