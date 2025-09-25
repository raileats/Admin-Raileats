// app/api/districts/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const stateId = url.searchParams.get("stateId");

    if (!stateId) {
      return NextResponse.json({ ok: false, error: "Missing stateId" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
    }

    // Filter by StateCode
    const endpoint = `${SUPABASE_URL}/rest/v1/DistrictMaster?select=DistrictCode,DistrictName,StateCode&StateCode=eq.${encodeURIComponent(
      stateId
    )}&order=DistrictName.asc`;

    const res = await fetch(endpoint, {
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

    // Normalize to {id, name, state_id}
    const districts = rows.map((r: any) => ({
      id: r.DistrictCode,
      name: r.DistrictName,
      state_id: r.StateCode,
    }));

    return NextResponse.json({ ok: true, districts });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? String(e) }, { status: 500 });
  }
}
