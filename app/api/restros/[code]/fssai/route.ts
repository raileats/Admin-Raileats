// app/api/restros/[code]/fssai/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/*
TABLE: RestroFSSAI
Columns:
- id (uuid / text)
- RestroCode (text)
- FssaiNumber (text)
- FssaiExpiryDate (date/text)
- FssaiCopy (text)
- Status (active/inactive)
- created_at (timestamp)
*/

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const RestroCode = params.code;
    const body = await req.json();

    const {
      FssaiNumber,
      FssaiExpiryDate,
      FssaiCopy,
    } = body;

    if (!FssaiNumber) {
      return NextResponse.json(
        { ok: false, error: "FSSAI number required" },
        { status: 400 }
      );
    }

    // 1️⃣ पुरानी active entry को inactive करो
    await supabase
      .from("RestroFSSAI")
      .update({ Status: "inactive" })
      .eq("RestroCode", RestroCode)
      .eq("Status", "active");

    // 2️⃣ नई entry active के साथ insert करो
    const { data, error } = await supabase
      .from("RestroFSSAI")
      .insert({
        RestroCode,
        FssaiNumber,
        FssaiExpiryDate,
        FssaiCopy,
        Status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

