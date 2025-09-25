// app/api/states/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
    }

    // Query StateMaster table directly
    const url = `${SUPABASE_URL}/rest/v1/StateMaster?select=StateCode,StateName&order=StateName.asc`;

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

    const rows = await res.json();

    // Normalize to {id, name}
    const states = rows.map((r: any) => ({
      id: r.StateCode,
      name: r.StateName,
    }));

    return NextResponse.json({ ok: true, states });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
