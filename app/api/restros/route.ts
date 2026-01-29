// app/api/restros/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

/* ======================================================
   POST  → CREATE NEW RESTRO (AUTO RESTROCODE)
   PATCH → UPDATE EXISTING RESTRO (BY RESTROCODE)
====================================================== */

export async function POST(req: Request) {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    /* --------- 1. GET NEXT RESTROCODE ---------- */
    const { data: maxRow, error: maxErr } = await supabase
      .from("RestroMaster")
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) {
      return NextResponse.json(
        { ok: false, error: maxErr.message },
        { status: 500 }
      );
    }

    const nextRestroCode =
      Number(maxRow?.RestroCode || 1000) + 1;

    /* --------- 2. BUILD INSERT ROW ---------- */
    const row: any = {
      RestroCode: nextRestroCode,
      RestroName: body.RestroName ?? "New Restro",
      BrandNameifAny: body.BrandNameifAny ?? null,
      StationCode: body.StationCode ?? null,
      StationName: body.StationName ?? null,
      State: body.State ?? null,
      RestroEmail: body.RestroEmail ?? null,
      RestroPhone: body.RestroPhone ?? null,
      OwnerName: body.OwnerName ?? null,
      OwnerEmail: body.OwnerEmail ?? null,
      OwnerPhone: body.OwnerPhone ?? null,
      RestroRating: body.RestroRating ?? null,
      RestroDisplayPhoto: body.RestroDisplayPhoto ?? null,
      IsIrctcApproved: body.IsIrctcApproved ?? false,
      RaileatsStatus: body.RaileatsStatus ?? 0,
    };

    /* --------- 3. INSERT ---------- */
    const { data, error } = await supabase
      .from("RestroMaster")
      .insert(row)
      .select()
      .maybeSingle();

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
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

/* ======================================================
   UPDATE EXISTING RESTRO
====================================================== */
export async function PATCH(req: Request) {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    if (!body.RestroCode) {
      return NextResponse.json(
        { ok: false, error: "RestroCode is required" },
        { status: 400 }
      );
    }

    const code = Number(body.RestroCode);

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(body)
      .eq("RestroCode", code)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Restro updated",
      row: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
