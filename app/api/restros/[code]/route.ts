export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const RestroCode = Number(params.code);

    if (!RestroCode || isNaN(RestroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: "Invalid body" },
        { status: 400 }
      );
    }

    /* 🔥 FIX: FIELD MAPPING */
    const payload: Record<string, any> = {
      ...body,

      // snake_case → DB CamelCase mapping
      OpenTime: body.open_time,
      ClosedTime: body.closed_time,
    };

    delete payload.open_time;
    delete payload.closed_time;
    delete payload.RestroCode;

    payload.UpdatedAt = new Date().toISOString();

    const { data, error, count } = await supabase
      .from("RestroMaster")
      .update(payload, { count: "exact" })
      .eq("RestroCode", RestroCode)
      .select();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    if (!count || count === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No rows updated",
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
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
