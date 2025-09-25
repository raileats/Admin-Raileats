// app/api/states/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // return 500 quick
  export async function GET() {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }
}

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false }});

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("StateMaster")
      .select("StateCode, StateName")
      .order("StateName", { ascending: true });

    if (error) {
      console.error("supabase states error", error);
      return NextResponse.json({ ok: false, error: error.message || String(error) }, { status: 500 });
    }

    // return normalized list items with id/name fields (client expects id/name)
    const states = (data || []).map((r: any) => ({ id: String(r.StateCode), name: r.StateName }));

    return NextResponse.json({ ok: true, states }, { status: 200 });
  } catch (e: any) {
    console.error("states route exception", e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
