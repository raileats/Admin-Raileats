// app/api/districts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

function pickField(obj: any, candidates: string[]) {
  for (const c of candidates) {
    if (Object.prototype.hasOwnProperty.call(obj, c)) return c;
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
    const stateId = url.searchParams.get("stateId") ?? "";

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // fetch a sample set without filter first (to inspect columns)
    const sampleRes = await sb.from("DistrictMaster").select("*").limit(1);
    const sampleRow = Array.isArray(sampleRes.data) && sampleRes.data.length > 0 ? sampleRes.data[0] : null;

    // pick likely column names (we will still try a safe query)
    const codeField = sampleRow ? pickField(sampleRow, ["DistrictCode", "districtcode", "district_id", "id", "Districts", "District"]) : null;
    const nameField = sampleRow ? pickField(sampleRow, ["DistrictName", "districtname", "name", "Districts", "district"]) : null;
    const stateField = sampleRow ? pickField(sampleRow, ["StateCode", "statecode", "state_code", "State", "state", "StateName"]) : null;

    // build a filter clause in a robust way
    let q;
    let usedFilter = null;
    if (stateId) {
      // try simple eq on common StateCode columns in order
      const possibleStateCols = ["StateCode", "statecode", "state_code", "State", "state", "StateName", "state_name"];
      let foundCol: string | null = null;
      for (const col of possibleStateCols) {
        // check if column exists by doing a meta-request (select that column limit 1)
        const test = await sb.from("DistrictMaster").select(col).limit(1);
        if (!test.error) {
          foundCol = col;
          break;
        }
      }

      if (foundCol) {
        usedFilter = `${foundCol} = ${stateId}`;
        q = sb.from("DistrictMaster").select("*").eq(foundCol, stateId).order(nameField ?? "DistrictName", { ascending: true }).limit(1000);
      } else {
        // fallback: try or() on several column names (supabase or syntax)
        const orExpr = `StateCode.eq.${stateId},state_code.eq.${stateId},State.eq.${stateId},state.eq.${stateId}`;
        usedFilter = `or(${orExpr})`;
        q = sb.from("DistrictMaster").select("*").or(orExpr).order(nameField ?? "DistrictName", { ascending: true }).limit(1000);
      }
    } else {
      q = sb.from("DistrictMaster").select("*").order(nameField ?? "DistrictName", { ascending: true }).limit(1000);
    }

    const { data, error } = await q;
    if (error) {
      console.error("supabase district fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? "supabase error", debug: { sampleRow, codeField, nameField, stateField, usedFilter } }, { status: 500 });
    }

    const rows = data ?? [];

    // normalize fields based on detection
    const mapped = (rows as any[]).map((r) => {
      const id = String(r[codeField ?? "DistrictCode"] ?? r.id ?? r.District ?? r.Districts ?? "");
      const name = String(r[nameField ?? "DistrictName"] ?? r.name ?? r.District ?? r.Districts ?? "");
      const state_id = String(r[stateField ?? "StateCode"] ?? r.State ?? r.state ?? r.StateName ?? "");
      return { id, name, state_id, _raw: r };
    });

    return NextResponse.json({
      ok: true,
      detected: { codeField, nameField, stateField, usedFilter },
      sampleRow,
      count: mapped.length,
      districts: mapped,
    });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
