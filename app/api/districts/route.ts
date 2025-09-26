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
    const stateQuery = url.searchParams.get("state") ?? url.searchParams.get("stateId") ?? "";

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Query DistrictMaster table (use the real table name you confirmed)
    let q = sb
      .from("DistrictMaster")
      .select('"DistrictCode","DistrictName","StateCode","StateName"')
      .order('"DistrictName"', { ascending: true })
      .limit(2000);

    if (stateQuery) {
      const numeric = /^\d+$/.test(String(stateQuery));
      if (numeric) {
        // try match by numeric state code
        q = q.eq("StateCode", stateQuery);
      } else {
        // case-insensitive match on state name
        q = q.ilike("StateName", `%${stateQuery}%`);
      }
    }

    const { data, error } = await q;

    if (error) {
      console.error("supabase DistrictMaster fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? "supabase error" }, { status: 500 });
    }

    const rows = data ?? [];

    const districts = rows.map((r: any) => ({
      id: String(r["DistrictCode"] ?? r.DistrictCode ?? r.id ?? ""),
      name: String(r["DistrictName"] ?? r.DistrictName ?? r.name ?? ""),
      state_id: String(r["StateCode"] ?? r.StateCode ?? r["StateName"] ?? r.StateName ?? ""),
    }));

    // include table used for debugging if you want
    return NextResponse.json({ ok: true, districts, _table: "DistrictMaster" });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
