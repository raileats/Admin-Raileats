// app/api/states/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // server-only

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/StateMaster?select=id,name,code&is_active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ ok: false, error: txt }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, states: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
