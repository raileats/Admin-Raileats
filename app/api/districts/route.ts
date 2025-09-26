// app/api/districts/route.ts
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
  "district_master",
  "districts",
];

async function tryQueryTable(sb: any, tableName: string, stateId: string | null) {
  // try a lightweight probe (limit 1) to see if this table exists/accessible
  try {
    const probe = sb.from(tableName).select("1").limit(1);
    // if stateId passed, try a filtered probe (but it's optional)
    if (stateId) {
      // try ilike on State Name or eq on State Code when numeric
      const isNumeric = /^\d+$/.test(String(stateId));
      if (isNumeric) {
        probe.eq("StateCode", stateId).limit(1);
      } else {
        // many schemas use "State Name" as quoted identifier; we attempt both
        // but here probe can't easily be dynamic; we just run unfiltered probe
      }
    }
    const { error } = await probe;
    if (!error) return true;
    // if error mentions relation does not exist, return false
    return false;
  } catch (err) {
    return false;
  }
}

export async function GET(req: Request) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const url = new URL(req.url);
    const stateId = url.searchParams.get("stateId") ?? url.searchParams.get("state") ?? null;

    // 1) detect which table name works
    let foundTable: string | null = null;
    for (const t of CANDIDATE_TABLES) {
      const ok = await tryQueryTable(sb, t, stateId);
      if (ok) {
        foundTable = t;
        break;
      }
    }

    if (!foundTable) {
      console.error("districts handler: no candidate table found. Tried:", CANDIDATE_TABLES);
      return NextResponse.json({ ok: false, error: "Could not find Districts table (tried candidates)" }, { status: 500 });
    }

    console.error("[DBG] districts handler using table:", foundTable);

    // 2) build query depending on detected table's likely columns
    // We'll attempt to select multiple common column names (quoted and unquoted)
    const selectCols = [
      '"District Code","District Name","State Code","State Name"',
      '"DistrictCode","DistrictName","StateCode","StateName"',
      "DistrictCode,DistrictName,StateCode,StateName",
      "*",
    ];

    let rows: any[] | null = null;
    let lastErr: any = null;

    for (const sel of selectCols) {
      try {
        let q = sb.from(foundTable).select(sel).order("DistrictName", { ascending: true }).limit(2000);
        // if state filter provided, try to apply it in a tolerant way
        if (stateId) {
          if (/^\d+$/.test(stateId)) {
            // numeric -> try StateCode or "State Code"
            try {
              q = q.eq("StateCode", stateId); // unquoted
            } catch {}
          } else {
            // non-numeric -> apply ilike to "State Name" and StateName both possibility
            try {
              q = q.ilike("State Name", `%${stateId}%`);
            } catch {}
          }
        }
        const { data, error } = await q;
        if (error) {
          lastErr = error;
          continue;
        }
        rows = (data || []) as any[];
        break;
      } catch (err) {
        lastErr = err;
        continue;
      }
    }

    if (!rows) {
      console.error("districts handler: no rows from table", foundTable, "lastErr:", lastErr);
      return NextResponse.json({ ok: false, error: `Could not fetch districts from ${foundTable}` }, { status: 500 });
    }

    // Map to standardized shape
    const districts = rows.map((r: any) => {
      return {
        id: String(r["District Code"] ?? r.DistrictCode ?? r.districtcode ?? r.id ?? r["district_code"] ?? ""),
        name: String(r["District Name"] ?? r.DistrictName ?? r.districtname ?? r.name ?? r["district_name"] ?? ""),
        state_id: String(r["State Code"] ?? r.StateCode ?? r.statecode ?? r["State Name"] ?? r.StateName ?? ""),
      };
    });

    return NextResponse.json({ ok: true, districts, _table: foundTable });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
