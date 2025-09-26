// app/api/districts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    // client will call /api/districts?stateId=XXX (stateId = StateCode)
    const stateId = url.searchParams.get("stateId") ?? "";

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Fetch from DistrictMaster table — expecting columns: DistrictCode, DistrictName, StateCode
    // Mirror the simple, predictable logic used by /api/states
    let query = sb.from("DistrictMaster").select("DistrictCode,DistrictName,StateCode").order("DistrictName", { ascending: true });

    if (stateId) {
      query = query.eq("StateCode", stateId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("supabase district fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? "supabase error" }, { status: 500 });
    }

    const districts = (data ?? []).map((r: any) => ({
      id: String(r.DistrictCode ?? r.districtcode ?? r.District ?? r.id ?? ""),
      name: r.DistrictName ?? r.districtname ?? r.name ?? "",
      state_id: String(r.StateCode ?? r.statecode ?? ""),
    }));

    return NextResponse.json({ ok: true, districts });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
