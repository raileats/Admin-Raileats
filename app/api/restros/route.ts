// app/api/restros/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/* ======================================================
   POST — CREATE NEW RESTRO
====================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const allowed = [
      "RestroName",
      "RestroEmail",
      "RestroPhone",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "BrandName",
      "StationCode",
      "StationName",
      "State",
      "District",
      "City",
      "RestroAddress",
      "PinCode",
      "RestroLatitude",
      "RestroLongitude",
    ];

    const row: any = {};
    for (const k of Object.keys(body || {})) {
      if (allowed.includes(k)) {
        row[k] = body[k] === "" ? null : body[k];
      }
    }

    if (!row.RestroName) row.RestroName = "New Restro";

    const { data, error } = await supabaseServer
      .from("RestroMaster")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("POST restro error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (err: any) {
    console.error("POST /api/restros error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

/* ======================================================
   PATCH — UPDATE EXISTING RESTRO (SAVE BUTTON)
====================================================== */
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const { RestroCode } = body;
    if (!RestroCode) {
      return NextResponse.json(
        { ok: false, error: "RestroCode is required" },
        { status: 400 }
      );
    }

    const allowed = [
      "StationName",
      "StationCode",
      "State",
      "District",
      "City",
      "RestroName",
      "BrandNameifAny",
      "RaileatsStatus",
      "IsIrctcApproved",
      "RestroRating",
      "RestroDisplayPhoto",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "RestroEmail",
      "RestroPhone",
    ];

    const update: any = {};
    for (const k of allowed) {
      if (k in body) {
        update[k] = body[k] === "" ? null : body[k];
      }
    }

    const { data, error } = await supabaseServer
      .from("RestroMaster")
      .update(update)
      .eq("RestroCode", RestroCode)
      .select()
      .single();

    if (error) {
      console.error("PATCH restro error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "Restro not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Restro updated successfully",
      row: data,
    });
  } catch (err: any) {
    console.error("PATCH /api/restros error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
