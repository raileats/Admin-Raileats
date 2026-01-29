// app/api/restros/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/* --------------------------------------------------
   HELPERS
-------------------------------------------------- */
async function generateNextRestroCode() {
  const { data, error } = await supabaseServer
    .from("RestroMaster")
    .select("RestroCode")
    .order("RestroCode", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  const lastCode = Number(data?.RestroCode ?? 1000);
  return lastCode + 1;
}

function cleanPayload(body: any) {
  const allowed = [
    "RestroName",
    "BrandName",
    "RestroEmail",
    "RestroPhone",
    "OwnerName",
    "OwnerEmail",
    "OwnerPhone",
    "StationCode",
    "StationName",
    "State",
    "District",
    "City",
    "RestroAddress",
    "PinCode",
    "RestroLatitude",
    "RestroLongitude",
    "IsIrctcApproved",
    "RestroRating",
    "RestroDisplayPhoto",
    "RaileatsStatus",
  ];

  const row: any = {};
  for (const k of allowed) {
    if (k in body) {
      row[k] = body[k] === "" ? null : body[k];
    }
  }
  return row;
}

/* --------------------------------------------------
   POST → CREATE RESTRO (AUTO RESTROCODE)
-------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const row = cleanPayload(body);

    if (!row.RestroName) {
      return NextResponse.json(
        { ok: false, error: "RestroName is required" },
        { status: 400 }
      );
    }

    const nextCode = await generateNextRestroCode();
    row.RestroCode = nextCode;

    const { data, error } = await supabaseServer
      .from("RestroMaster")
      .insert(row)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Restro created",
      row: data,
    });
  } catch (err: any) {
    console.error("POST /api/restros", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

/* --------------------------------------------------
   PATCH → UPDATE RESTRO (SAVE BUTTON)
-------------------------------------------------- */
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const restroCode = Number(body.RestroCode);
    if (!restroCode) {
      return NextResponse.json(
        { ok: false, error: "RestroCode is required" },
        { status: 400 }
      );
    }

    const row = cleanPayload(body);
    delete row.RestroCode;

    const { data, error } = await supabaseServer
      .from("RestroMaster")
      .update(row)
      .eq("RestroCode", restroCode)
      .select()
      .maybeSingle();

    if (error) {
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
      message: "Restro updated",
      row: data,
    });
  } catch (err: any) {
    console.error("PATCH /api/restros", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
