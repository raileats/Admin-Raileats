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
    const stateId = url.searchParams.get("stateId") ?? url.searchParams.get("state") ?? "";

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Query the actual table District_Masters
    let q = sb
      .from("District_Masters")
      .select('"District Code","District Name","State Code","State Name"');

    if (stateId) {
      // अगर number जैसा है तो State Code से filter करो, वरना State Name से
      const isNumeric = /^\d+$/.test(stateId);
      if (isNumeric) {
        q = q.eq("State Code", stateId);
      } else {
        q = q.ilike("State Name", `%${stateId}%`);
      }
    }

    const { data, error } = await q;
    if (error) {
      console.error("supabase District_Masters fetch error:", error);
      return NextResponse.json(
        { ok: false, error: error.message ?? "supabase error" },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    // Map to standardized shape
    const districts = rows.map((r: any) => ({
      id: String(r["District Code"] ?? r.DistrictCode ?? ""),
      name: String(r["District Name"] ?? r.DistrictName ?? ""),
      state_id: String(r["State Code"] ?? r.StateCode ?? ""),
    }));

    return NextResponse.json({ ok: true, districts });
  } catch (e: any) {
    console.error("districts handler error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
