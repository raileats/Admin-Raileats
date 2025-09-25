// app/api/districts/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  export async function GET() {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const stateId = url.searchParams.get("stateId") || "";

    if (!stateId) {
      return NextResponse.json({ ok: false, error: "stateId required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("DistrictMaster")
      .select("DistrictCode, DistrictName, StateCode")
      .eq("StateCode", stateId)
      .order("DistrictName", { ascending: true });

    if (error) {
      console.error("supabase districts error", error);
      return NextResponse.json({ ok: false, error: error.message || String(error) }, { status: 500 });
    }

    const districts = (data || []).map((r: any) => ({
      id: String(r.DistrictCode),
      name: r.DistrictName,
      state_id: String(r.StateCode),
    }));

    return NextResponse.json({ ok: true, districts }, { status: 200 });
  } catch (e: any) {
    console.error("districts route exception", e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
