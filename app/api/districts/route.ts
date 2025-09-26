// app/api/districts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { ok: false, error: "Supabase not configured (missing env)" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(req.url);
    const stateId = url.searchParams.get("stateId") ?? ""; // usually StateCode or id

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Basic: try to select canonical columns that you said exist in DistrictMaster:
    // DistrictCode, DistrictName, StateCode
    let q;
    if (stateId) {
      // prefer filtering by StateCode column
      q = sb
        .from("DistrictMaster")
        .select("DistrictCode,DistrictName,StateCode")
        .eq("StateCode", stateId)
        .order("DistrictName", { ascending: true })
        .limit(1000);
    } else {
      q = sb
        .from("DistrictMaster")
        .select("DistrictCode,DistrictName,StateCode")
        .order("DistrictName", { ascending: true })
        .limit(1000);
    }

    const { data, error } = await q;
    if (error) {
      console.error("supabase district fetch error:", error);
      return NextResponse.json(
        { ok: false, error: error.message ?? "supabase error" },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    // Map to standardized shape: { id, name, state_id }
    const districts = (rows as any[]).map((r) => ({
      id: String(r?.DistrictCode ?? r?.districtcode ?? r?.id ?? ""),
      name: String(r?.DistrictName ?? r?.districtname ?? r?.name ?? ""),
      state_id: String(r?.StateCode ?? r?.statecode ?? r?.State ?? ""),
    }));

    return NextResponse.json({ ok: true, districts });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
