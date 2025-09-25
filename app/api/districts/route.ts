// app/api/districts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

function pickField(obj: any, candidates: string[]) {
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(obj, c)) return c;
    // try lowercase-insensitive
    const found = Object.keys(obj).find((k) => k.toLowerCase() === c.toLowerCase());
    if (found) return found;
  }
  return null;
}

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  try {
    const url = new URL(req.url);
    const stateId = url.searchParams.get("stateId") ?? ""; // usually StateCode

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // We'll fetch rows (by state if given) but request all columns so we can detect fields
    let q = sb.from("DistrictMaster").select("*").order("id", { ascending: true }).limit(200);
    if (stateId) {
      // try filter by common state-code columns (StateCode, state_code, State)
      // We'll attempt eq on multiple common column names; whichever exists will be used.
      // Try StateCode
      const test1 = await sb.from("DistrictMaster").select("StateCode").limit(1);
      if (test1.error === null && Array.isArray(test1.data)) {
        // likely StateCode exists
        q = sb.from("DistrictMaster").select("*").eq("StateCode", stateId).order("DistrictName", { ascending: true }).limit(500);
      } else {
        // fallback: try state_code or State
        q = sb.from("DistrictMaster").select("*").or(`StateCode.eq.${stateId},state_code.eq.${stateId},State.eq.${stateId}`).order("DistrictName", { ascending: true }).limit(500);
      }
    } else {
      // no state filter, just return all (limited)
      q = sb.from("DistrictMaster").select("*").order("DistrictName", { ascending: true }).limit(1000);
    }

    const { data, error } = await q;
    if (error) {
      console.error("supabase district fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? "supabase error" }, { status: 500 });
    }

    const rows = data ?? [];

    // If empty, return ok with empty array
    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: true, districts: [] });
    }

    // Detect which fields correspond to code/name/state
    const sample = rows[0];
    const codeField = pickField(sample, ["DistrictCode", "districtcode", "district_id", "id", "Districts", "District"]);
    const nameField = pickField(sample, ["DistrictName", "districtname", "name", "Districts", "district"]);
    const stateField = pickField(sample, ["StateCode", "statecode", "state_code", "State", "state"]);

    const districts = (rows as any[]).map((r) => ({
      id: String(r[codeField] ?? r.id ?? ""),
      name: String(r[nameField] ?? r.name ?? ""),
      state_id: String(r[stateField] ?? ""),
      // keep original row for debugging if needed
      _raw: undefined,
    }));

    return NextResponse.json({ ok: true, districts });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
