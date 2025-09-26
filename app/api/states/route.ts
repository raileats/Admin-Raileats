// app/api/states/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

const CANDIDATE_TABLES = [
  "District_Masters",
  "district_masters",
  "DistrictMaster",
  "district_master",
  "DistrictsMaster",
  "districts_master",
  "District_Master",
  "StateMaster",
  "state_master",
];

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    // Try Districts table first to derive distinct State Name
    for (const t of CANDIDATE_TABLES) {
      try {
        const { data, error } = await sb.from(t).select('"State Name"').neq('"State Name"', null).limit(1000);
        if (!error && Array.isArray(data) && data.length > 0) {
          const unique = Array.from(new Set(data.map((r: any) => (r["State Name"] ? String(r["State Name"]).trim() : "")))).filter(Boolean);
          const states = unique.map((s) => ({ id: s, name: s }));
          console.error("[DBG] states handler derived from table:", t, "count:", states.length);
          return NextResponse.json({ ok: true, states, _table: t });
        }
      } catch (e) {
        // ignore and continue trying other candidate tables
      }
    }

    // Fallback: try explicit StateMaster table
    try {
      const { data: sm, error: smErr } = await sb.from("StateMaster").select("StateCode,StateName").order("StateName");
      if (!smErr && Array.isArray(sm) && sm.length > 0) {
        const states = sm.map((r: any) => ({ id: String(r.StateCode ?? r.statecode ?? r.id ?? r.StateName ?? ""), name: r.StateName ?? r.statename ?? "" }));
        return NextResponse.json({ ok: true, states, _table: "StateMaster" });
      }
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ ok: true, states: [], _table: null });
  } catch (e: any) {
    console.error("states handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
