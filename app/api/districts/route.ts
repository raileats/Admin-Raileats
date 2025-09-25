// app/api/districts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    // client uses stateId param (StateCode). We also accept stateName as fallback.
    const stateId = url.searchParams.get("stateId") ?? "";
    const stateName = url.searchParams.get("stateName") ?? "";

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // if stateId provided -> query by StateCode
    if (stateId) {
      const { data, error } = await sb
        .from("DistrictMaster")
        .select("DistrictCode,DistrictName,StateCode")
        .eq("StateCode", stateId)
        .order("DistrictName", { ascending: true });

      if (error) {
        console.error("supabase district fetch error:", error);
        return NextResponse.json({ ok: false, error: error.message ?? "supabase error" }, { status: 500 });
      }

      const districts = (data ?? []).map((r: any) => ({
        id: String(r.DistrictCode ?? r.districtcode ?? r.id ?? ""),
        name: r.DistrictName ?? r.districtname ?? r.name ?? "",
        state_id: String(r.StateCode ?? r.statecode ?? ""),
      }));

      return NextResponse.json({ ok: true, districts });
    }

    // fallback: if stateName provided, find matching state codes then fetch districts
    if (stateName) {
      // find state codes matching name (case-insensitive)
      const { data: states, error: stateErr } = await sb
        .from("StateMaster")
        .select("StateCode,StateName")
        .ilike("StateName", `%${stateName}%`);

      if (stateErr) {
        console.error("supabase state lookup error:", stateErr);
        return NextResponse.json({ ok: false, error: stateErr.message ?? "supabase error" }, { status: 500 });
      }

      if (!states || states.length === 0) {
        return NextResponse.json({ ok: true, districts: [] });
      }

      const stateCodes = states.map((s: any) => s.StateCode);
      const { data, error } = await sb
        .from("DistrictMaster")
        .select("DistrictCode,DistrictName,StateCode")
        .in("StateCode", stateCodes)
        .order("DistrictName", { ascending: true });

      if (error) {
        console.error("supabase district fetch error (by stateName):", error);
        return NextResponse.json({ ok: false, error: error.message ?? "supabase error" }, { status: 500 });
      }

      const districts = (data ?? []).map((r: any) => ({
        id: String(r.DistrictCode ?? r.districtcode ?? r.id ?? ""),
        name: r.DistrictName ?? r.districtname ?? r.name ?? "",
        state_id: String(r.StateCode ?? r.statecode ?? ""),
      }));

      return NextResponse.json({ ok: true, districts });
    }

    // no params => return empty list
    return NextResponse.json({ ok: true, districts: [] });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
