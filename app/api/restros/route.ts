// app/api/restros/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* --------------------------------------------------
   POST = CREATE RESTRO (AUTO RestroCode)
-------------------------------------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    /* ---------- 1. FIND MAX RestroCode ---------- */
    const { data: maxRow, error: maxErr } = await supabaseServer
      .from("RestroMaster")
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) {
      console.error("Max RestroCode error", maxErr);
      return NextResponse.json(
        { ok: false, error: "Failed to generate RestroCode" },
        { status: 500 }
      );
    }

    const nextRestroCode =
      (Number(maxRow?.RestroCode || 1000) || 1000) + 1;

    /* ---------- 2. BUILD INSERT ROW ---------- */
    const row: any = {
      RestroCode: nextRestroCode,
      RestroName: body.RestroName ?? "New Restro",
      BrandName: body.BrandName ?? null,
      StationCode: body.StationCode ?? null,
      StationName: body.StationName ?? null,
      State: body.State ?? null,
      RestroRating: body.RestroRating ?? null,
      RestroDisplayPhoto: body.RestroDisplayPhoto ?? null,
      OwnerName: body.OwnerName ?? null,
      OwnerEmail: body.OwnerEmail ?? null,
      OwnerPhone: body.OwnerPhone ?? null,
      RestroEmail: body.RestroEmail ?? null,
      RestroPhone: body.RestroPhone ?? null,
      IsIrctcApproved: body.IsIrctcApproved ?? false,
      RaileatsStatus: body.RaileatsStatus ?? 0,
    };

    /* ---------- 3. INSERT ---------- */
    const { data, error } = await supabaseServer
      .from("RestroMaster")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Insert error", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    /* ---------- 4. SUCCESS ---------- */
    return NextResponse.json({
      ok: true,
      row: data,
    });
  } catch (err: any) {
    console.error("POST /api/restros failed", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

/* --------------------------------------------------
   PATCH = UPDATE EXISTING RESTRO
-------------------------------------------------- */
export async function PATCH(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = body?.RestroCode;

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "RestroCode is required" },
        { status: 400 }
      );
    }

    delete body.RestroCode;

    const { data, error } = await supabaseServer
      .from("RestroMaster")
      .update(body)
      .eq("RestroCode", code)
      .select()
      .single();

    if (error) {
      console.error("Update error", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (err: any) {
    console.error("PATCH /api/restros failed", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
