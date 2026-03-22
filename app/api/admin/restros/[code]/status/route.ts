export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ================================
   SUPABASE CLIENT
================================ */
function srv() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/* ================================
   UPDATE RESTRO (MAIN API)
================================ */
export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = Number(params.code); // 🔥 FIX

    if (!restroCode || isNaN(restroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid restro code" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("Incoming Body:", body);

    const supabase = srv();

    /* ================================
       UPDATE OBJECT
    ================================= */

    const updateData: any = {
      RestroName: body.RestroName,
      OwnerName: body.OwnerName,
      OwnerEmail: body.OwnerEmail,
      OwnerPhone: body.OwnerPhone,
      RestroEmail: body.RestroEmail,
      RestroPhone: body.RestroPhone,
      BrandNameifAny: body.BrandName,
      RestroRating: body.RestroRating,

      WeeklyOff: body.WeeklyOff, // 🔥 added
      MinimumOrderValue: body.MinimumOrderValue, // 🔥 added
      CutOffTime: body.CutOffTime, // 🔥 added

      updated_at: new Date().toISOString(),
    };

    /* 🔥 TIME FIELDS FIX */

    if (body.open_time !== undefined) {
      updateData.open_time = body.open_time;
    }

    if (body.closed_time !== undefined) {
      updateData.closed_time = body.closed_time;
    }

    console.log("Final Update Data:", updateData);

    /* ================================
       UPDATE QUERY
    ================================= */

    const { data, error } = await supabase
      .from("RestroMaster")
      .update(updateData)
      .eq("RestroCode", restroCode)
      .select(); // 🔥 VERY IMPORTANT

    console.log("Updated Row:", data);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No row updated (check RestroCode)" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, row: data[0] });
  } catch (e: any) {
    console.error("PATCH ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
