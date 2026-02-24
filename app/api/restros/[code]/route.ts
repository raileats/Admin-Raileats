export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ================= SUPABASE CLIENT ================= */

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL missing in env");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY missing in env");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

/* ================= PATCH ================= */

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    console.log("===== PATCH CALLED =====");
    console.log("Supabase URL:", process.env.SUPABASE_URL);

    const RestroCode = Number(params.code);

    if (!RestroCode || isNaN(RestroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();

    console.log("Incoming body:", body);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid body" },
        { status: 400 }
      );
    }

    /* ========== CLEAN PAYLOAD ========== */

    const payload: Record<string, any> = { ...body };

    delete payload.RestroCode; // never update PK

    payload.UpdatedAt = new Date().toISOString();

    console.log("Final payload:", payload);

    /* ========== EXECUTE UPDATE ========== */

    const { data, error, count } = await supabase
      .from("RestroMaster")
      .update(payload, { count: "exact" })
      .eq("RestroCode", RestroCode)
      .select();

    console.log("Rows affected:", count);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!count || count === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No rows updated. Check RestroCode or Supabase project.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Restro updated successfully",
      row: data?.[0] ?? null,
      updatedRows: count,
    });
  } catch (err: any) {
    console.error("PATCH FAILED:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
