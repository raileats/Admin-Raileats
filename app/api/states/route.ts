// app/api/states/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // read distinct StateName values from DistrictMaster
    const { data, error } = await sb
      .from("DistrictMaster")
      .select('"StateName"')
      .neq('"StateName"', null)
      .order('"StateName"', { ascending: true });

    if (error) {
      console.error("DistrictMaster -> states fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? "supabase error" }, { status: 500 });
    }

    const unique = Array.from(new Set((data || []).map((r: any) => (r["StateName"] ? String(r["StateName"]).trim() : "")))).filter(Boolean);
    const states = unique.map((s) => ({ id: s, name: s }));

    return NextResponse.json({ ok: true, states, _table: "DistrictMaster" });
  } catch (e: any) {
    console.error("states handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
