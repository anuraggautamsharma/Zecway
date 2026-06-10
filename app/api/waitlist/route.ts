import { NextResponse } from "next/server";

// Defaults are the Zecway Supabase project's publishable credentials — safe to
// ship publicly; row-level security only allows inserts, never reads.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://huwyqieadhssdnrqrblx.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY ?? "sb_publishable_bwy_MkoFBVkzMQCbjHt5PQ_Lw_WsUHy";

export async function POST(request: Request) {
  let body: { email?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { error: "Waitlist is not configured yet" },
      { status: 503 },
    );
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, company: body.company?.trim() || null }),
  });

  // 409 = already on the list; treat as success for the visitor
  if (!res.ok && res.status !== 409) {
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
