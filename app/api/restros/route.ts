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
   PATCH → UPDATE EXISTING RESTRO BY URL PARAM
   URL: /api/restros/1234
====================================================== */

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const code = Number(params.id);

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode in URL" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));

    /* -------- SAFE COLUMN MAPPING -------- */
    const updateRow: any = {
      RestroName: body.RestroName ?? null,
      OwnerName: body.OwnerName ?? null,
      StationCode: body.StationCode ?? null,
      StationName: body.StationName ?? null,
      OwnerPhone: body.OwnerPhone ?? null,
      OwnerEmail: body.OwnerEmail ?? null,
      BrandNameifAny: body.BrandNameifAny ?? null,
      RestroEmail: body.RestroEmail ?? null,
      RestroPhone: body.RestroPhone ?? null,
      IRCTCStatus: body.IRCTCStatus ?? 0,
      RaileatsStatus: body.RaileatsStatus ?? 0,
      IsIrctcApproved: body.IsIrctcApproved ?? "0",
      RestroRating: body.RestroRating ?? null,
      IsPureVeg: body.IsPureVeg ?? 0,
      RestroDisplayPhoto: body.RestroDisplayPhoto ?? null,
      State: body.State ?? null,
      UpdatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(updateRow)
      .eq("RestroCode", code)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "No rows updated" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Restro updated successfully",
      row: data,
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
