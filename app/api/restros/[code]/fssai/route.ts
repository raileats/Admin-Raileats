import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/restros/[code]/fssai
 * - पुराने FSSAI records => inactive
 * - नया FSSAI record => active
 */
export async function POST(
  req: NextRequest,
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

    const {
      fssai_number,
      expiry_date,
      file_url,
    } = body || {};

    if (!fssai_number) {
      return NextResponse.json(
        { ok: false, error: "FSSAI number is required" },
        { status: 400 }
      );
    }

    /* ---------------------------------
       STEP 1: पुराने records inactive
    ---------------------------------- */
    const { error: deactivateError } = await supabase
      .from("RestroFSSAI")
      .update({ status: "inactive" })
      .eq("restro_code", restroCode)
      .eq("status", "active");

    if (deactivateError) {
      console.error("Deactivate error:", deactivateError);
      return NextResponse.json(
        { ok: false, error: deactivateError.message },
        { status: 500 }
      );
    }

    /* ---------------------------------
       STEP 2: नया record insert (active)
    ---------------------------------- */
    const { data, error: insertError } = await supabase
      .from("RestroFSSAI")
      .insert({
        restro_code: restroCode,
        fssai_number,
        expiry_date: expiry_date || null,
        file_url: file_url || null,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err: any) {
    console.error("FSSAI API error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
