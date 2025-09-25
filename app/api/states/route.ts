// app/api/states/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // safe debug: DON'T log the secret key itself
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("[api/states] env NEXT_PUBLIC_SUPABASE_URL:", hasUrl ? "yes" : "no");
    console.log("[api/states] env SUPABASE_SERVICE_ROLE_KEY present:", hasServiceKey ? "yes" : "no");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/StateMaster?select=id,name,code&is_active=eq.true&order=sort_order.asc`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      console.log("[api/states] supabase fetch failed:", res.status, txt);
      return NextResponse.json({ ok: false, error: txt }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, states: data });
  } catch (e: any) {
    console.log("[api/states] exception:", e?.message ?? e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
