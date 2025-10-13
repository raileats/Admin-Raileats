// path: app/api/restros/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * POST - create new RestroMaster row (minimal required fields).
 * Returns inserted row (including RestroCode if DB generates it).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // whitelist allowed fields for create
    const allowed = [
      "RestroName","RestroEmail","RestroPhone","OwnerName","OwnerEmail","OwnerPhone",
      "BrandName","StationCode","StationName","State","District","City","RestroAddress",
      "PinCode","RestroLatitude","RestroLongitude"
    ];
    const row: any = {};
    for (const k of Object.keys(body || {})) {
      if (allowed.includes(k)) row[k] = body[k] === "" ? null : body[k];
    }
    // set defaults for minimal create
    if (!row.RestroName) row.RestroName = body.RestroName ?? "New Restro";
    // attempt insert
    const res = await supabaseServer.from("RestroMaster").insert(row).select().maybeSingle();
    if (res.error) {
      console.error("Insert error", res.error);
      return NextResponse.json({ ok: false, error: res.error.message || res.error }, { status: 500 });
    }
    return NextResponse.json({ ok: true, row: res.data });
  } catch (err: any) {
    console.error("POST /api/restros error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
