// ADMIN PROJECT
// app/api/admin/restros/[code]/status/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeSupabase() {
  const SUPABASE_URL =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE =
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return null;

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
}

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = makeSupabase();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server misconfigured: Supabase not configured" },
        { status: 500 }
      );
    }

    /* ---------------- Validate RestroCode ---------------- */
    const restroCode = String(params.code || "").trim();
    if (!restroCode) {
      return NextResponse.json(
        { error: "RestroCode is required in URL" },
        { status: 400 }
      );
    }

    /* ---------------- Parse body safely ---------------- */
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    /* ---------------- Extract status ---------------- */
    const raw =
      body.raileatsStatus ??
      body.raileats ??
      body.RaileatsStatus ??
      body.raileats_status;

    if (typeof raw === "undefined") {
      return NextResponse.json(
        { error: "raileatsStatus is required" },
        { status: 400 }
      );
    }

    const newStatus =
      raw === true ||
      raw === 1 ||
      raw === "1" ||
      raw === "true"
        ? 1
        : 0;

    /* ---------------- MAIN FIX ----------------
       DO NOT let trigger touch `updated_at`
       Explicitly set correct column: `UpdatedAt`
    -------------------------------------------- */
    const updatePayload = {
      RaileatsStatus: newStatus,
      UpdatedAt: new Date().toISOString(), // ✅ correct DB column
    };

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(updatePayload)
      .eq("RestroCode", restroCode)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Raileats status update error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: `No restro found with RestroCode=${restroCode}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      RestroCode: restroCode,
      RaileatsStatus: newStatus,
    });
  } catch (err: any) {
    console.error("admin/restros/status crash:", err);
    return NextResponse.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
