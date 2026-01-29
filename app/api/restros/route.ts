// app/api/restros/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ---------------- SUPABASE ---------------- */
function makeSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

/* ---------------- HELPERS ---------------- */
function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/* =========================================================
   POST  → CREATE NEW RESTRO (AUTO RESTROCODE)
   PATCH → UPDATE EXISTING RESTRO
========================================================= */

/* =========================
   CREATE NEW RESTRO
========================= */
export async function POST(req: Request) {
  try {
    const supabase = makeSupabase();
    if (!supabase) {
      return jsonError("Server misconfigured (Supabase)", 500);
    }

    const body = await req.json().catch(() => ({}));

    if (!body?.RestroName) {
      return jsonError("RestroName is required");
    }

    /* ---- AUTO RESTROCODE (MAX + 1) ---- */
    const { data: maxRow, error: maxErr } = await supabase
      .from("RestroMaster")
      .select("RestroCode")
      .order("RestroCode", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxErr) {
      return jsonError(maxErr.message, 500);
    }

    const nextRestroCode =
      (Number(maxRow?.RestroCode) || 1000) + 1;

    /* ---- ALLOWED FIELDS ---- */
    const allowed = [
      "RestroName",
      "BrandNameifAny",
      "StationCode",
      "StationName",
      "State",
      "District",
      "City",
      "RestroAddress",
      "RestroEmail",
      "RestroPhone",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "RestroRating",
      "RestroDisplayPhoto",
      "IsIrctcApproved",
      "RaileatsStatus",
    ];

    const row: any = {
      RestroCode: nextRestroCode,
    };

    for (const k of allowed) {
      if (k in body) row[k] = body[k] === "" ? null : body[k];
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .insert(row)
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    return NextResponse.json({
      ok: true,
      mode: "create",
      row: data,
    });
  } catch (err: any) {
    console.error("POST /api/restros", err);
    return jsonError(err.message || "Server error", 500);
  }
}

/* =========================
   UPDATE EXISTING RESTRO
========================= */
export async function PATCH(req: Request) {
  try {
    const supabase = makeSupabase();
    if (!supabase) {
      return jsonError("Server misconfigured (Supabase)", 500);
    }

    const body = await req.json().catch(() => ({}));

    const restroCode = Number(body?.RestroCode);
    if (!restroCode) {
      return jsonError("RestroCode is required");
    }

    /* ---- ALLOWED UPDATE FIELDS ---- */
    const allowed = [
      "RestroName",
      "BrandNameifAny",
      "StationCode",
      "StationName",
      "State",
      "District",
      "City",
      "RestroAddress",
      "RestroEmail",
      "RestroPhone",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "RestroRating",
      "RestroDisplayPhoto",
      "IsIrctcApproved",
      "RaileatsStatus",
    ];

    const update: any = {};
    for (const k of allowed) {
      if (k in body) update[k] = body[k] === "" ? null : body[k];
    }

    if (Object.keys(update).length === 0) {
      return jsonError("No fields to update");
    }

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(update)
      .eq("RestroCode", restroCode)
      .select()
      .maybeSingle();

    if (error) {
      return jsonError(error.message, 500);
    }

    if (!data) {
      return jsonError("Restro not found", 404);
    }

    return NextResponse.json({
      ok: true,
      mode: "update",
      row: data,
    });
  } catch (err: any) {
    console.error("PATCH /api/restros", err);
    return jsonError(err.message || "Server error", 500);
  }
}
