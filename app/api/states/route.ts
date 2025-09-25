// app/api/states/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
    }

    // NOTE: uses statemaster_v view if you created it; if not, replace 'statemaster_v' with your table name (lowercased)
    const url = `${SUPABASE_URL}/rest/v1/statemaster_v?select=id,name&is_active=eq.true&order=sort_order.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ ok: false, error: txt }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, states: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
