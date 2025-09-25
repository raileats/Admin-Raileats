// app/api/states/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured (missing env)" }, { status: 500 });
  }

  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data, error } = await sb.from("StateMaster").select("StateCode,StateName").order("StateName", { ascending: true });

    if (error) {
      console.error("supabase state fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? "supabase error" }, { status: 500 });
    }

    const states = (data ?? []).map((r: any) => ({
      id: String(r.StateCode ?? r.statecode ?? r.id ?? ""),
      name: r.StateName ?? r.statename ?? r.name ?? "",
    }));

    return NextResponse.json({ ok: true, states });
  } catch (e: any) {
    console.error("states handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
