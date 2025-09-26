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

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    // Primary: try to fetch distinct "State Name" values from District_Masters
    try {
      const { data: rows, error } = await sb
        .from("District_Masters")
        .select('"State Name"')
        .neq('"State Name"', null)
        .order('"State Name"', { ascending: true });

      if (!error && Array.isArray(rows) && rows.length > 0) {
        const unique = Array.from(
          new Set(rows.map((r: any) => (r["State Name"] ? String(r["State Name"]).trim() : "")))
        ).filter(Boolean);

        const states = unique.map((s) => ({ id: s, name: s }));
        return NextResponse.json({ ok: true, states });
      }
      // If error or empty rows, fall through to try StateMaster below
      if (error) console.error("District_Masters fetch returned error:", error);
    } catch (e) {
      console.error("Error querying District_Masters for states:", e);
    }

    // Fallback: try StateMaster table (if your project has it)
    try {
      const { data: smRows, error: smErr } = await sb
        .from("StateMaster")
        .select("StateCode,StateName")
        .order("StateName", { ascending: true });

      if (!smErr && Array.isArray(smRows)) {
        const states = (smRows || []).map((r: any) => ({
          id: String(r.StateCode ?? r.statecode ?? r.id ?? r["StateName"] ?? r.StateName ?? ""),
          name: r.StateName ?? r.statename ?? r.name ?? String(r.StateCode ?? ""),
        }));
        return NextResponse.json({ ok: true, states });
      }
      if (smErr) console.error("StateMaster fetch returned error:", smErr);
    } catch (e) {
      console.error("Error querying StateMaster for states:", e);
    }

    // If nothing found, return empty list (client shows fallback)
    return NextResponse.json({ ok: true, states: [] });
  } catch (e: any) {
    console.error("states handler error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
