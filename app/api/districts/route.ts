import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

function pickField(obj: any, candidates: string[]) {
  if (!obj || typeof obj !== "object") return null;
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(obj, c)) return c;
    // case-insensitive match
    const found = Object.keys(obj).find((k) => k.toLowerCase() === c.toLowerCase());
    if (found) return found;
  }
  return null;
}

/**
 * Try to detect which column name exists for state in DistrictMaster.
 * Returns first candidate that exists (by trying a safe select).
 */
async function detectStateColumn(sb: any, candidates: string[]) {
  for (const c of candidates) {
    try {
      const probe = await sb.from("DistrictMaster").select(c).limit(1);
      if (!probe.error) {
        // column exists (or at least the select didn't fail)
        return c;
      }
    } catch (e) {
      // ignore and try next candidate
    }
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

    // We'll try to detect the proper state column name to filter server-side.
    const stateCandidates = ["StateCode", "statecode", "state_code", "State", "state"];
    const detectedStateCol = await detectStateColumn(sb, stateCandidates);

    let res;
    if (stateId && detectedStateCol) {
      // if we detected a column we can filter on, do server-side filter
      res = await sb.from("DistrictMaster").select("*").eq(detectedStateCol, stateId).order("DistrictName", { ascending: true }).limit(1000);
    } else if (stateId && !detectedStateCol) {
      // no good column found to filter server-side — fetch all and filter client-side
      res = await sb.from("DistrictMaster").select("*").order("DistrictName", { ascending: true }).limit(2000);
    } else {
      // no state filter requested — just return all (limited)
      res = await sb.from("DistrictMaster").select("*").order("DistrictName", { ascending: true }).limit(2000);
    }

    if (res.error) {
      console.error("supabase district fetch error:", res.error);
      return NextResponse.json({ ok: false, error: res.error.message ?? "supabase error" }, { status: 500 });
    }

    const rows = res.data ?? [];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: true, districts: [] });
    }

    // detect code/name/state fields using a sample row
    const sample = rows[0];
    const codeField = pickField(sample, ["DistrictCode", "districtcode", "district_id", "id", "District"]);
    const nameField = pickField(sample, ["DistrictName", "districtname", "name", "District", "district"]);
    const stateField = pickField(sample, ["StateCode", "statecode", "state_code", "State", "state"]);

    // If server didn't filter but we have stateId, filter client-side using detected stateField (if any)
    let filtered = rows;
    if (stateId && !detectedStateCol) {
      if (stateField) {
        filtered = rows.filter((r: any) => String(r[stateField] ?? "").trim() === String(stateId).trim());
      } else {
        // we couldn't detect state field — leave unfiltered (safer than throwing)
        filtered = rows;
      }
    }

    const districts = (filtered as any[]).map((r) => ({
      id: String(r[codeField] ?? r.id ?? ""),
      name: String(r[nameField] ?? r.name ?? ""),
      state_id: String(r[stateField] ?? (detectedStateCol ? r[detectedStateCol] ?? "" : "")),
      _raw: r, // include raw row to help debugging if needed
    }));

    return NextResponse.json({ ok: true, districts });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
