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
    const restroCode = params.code;

    if (!restroCode) {
      return NextResponse.json(
        { ok: false, error: "Missing restro code" },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log("Incoming Body:", body);

    const supabase = srv();

    /* ================================
       SAFE UPDATE OBJECT
       (NO CRASH EVEN IF COLUMN MISSING)
    ================================= */

    const updateData: any = {
      RestroName: body.RestroName,
      FssaiNo: body.FssaiNo,
      FssaiExpDate: body.FssaiExpDate,
      GstNo: body.GstNo,
      PanNo: body.PanNo,
      BankName: body.BankName,
      BankAccount: body.BankAccount,
      IFSC: body.IFSC,
      Branch: body.Branch,
      updated_at: new Date().toISOString(),
    };

    /* ✅ OPTIONAL FIELD (SAFE HANDLING) */
    if (body.OpenTime !== undefined) {
      updateData.OpenTime = body.OpenTime;
    }

    if (body.CloseTime !== undefined) {
      updateData.CloseTime = body.CloseTime;
    }

    const { error } = await supabase
      .from("RestroMaster")
      .update(updateData)
      .eq("RestroCode", restroCode);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PATCH ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
