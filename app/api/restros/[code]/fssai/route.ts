import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* 🔥 SUPABASE CLIENT (SERVICE ROLE REQUIRED) */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ========================= GET ========================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = params.code;

  const { data, error } = await supabase
    .from("RestroFSSAI")
    .select("*")
    .eq("RestroCode", restroCode)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, rows: data });
}

/* ========================= POST ========================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = params.code;
  const form = await req.formData();

  const fssai_number = form.get("fssai_number") as string;
  const expiry_date = form.get("expiry_date") as string | null;
  const file = form.get("file") as File | null;

  if (!fssai_number) {
    return NextResponse.json({
      ok: false,
      error: "FSSAI number is required",
    });
  }

  /* 🔥 STEP 1: OLD ACTIVE → INACTIVE (BANK LOGIC) */
  await supabase
    .from("RestroFSSAI")
    .update({ status: "inactive" })
    .eq("RestroCode", restroCode)
    .eq("status", "active");

  /* 🔥 STEP 2: FILE UPLOAD */
  let file_url: string | null = null;

  if (file) {
    const ext = file.name.split(".").pop();
    const path = `${restroCode}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("fssai-docs")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      return NextResponse.json({
        ok: false,
        error: uploadError.message,
      });
    }

    const { data } = supabase.storage
      .from("fssai-docs")
      .getPublicUrl(path);

    file_url = data.publicUrl;
  }

  /* 🔥 STEP 3: INSERT NEW ACTIVE FSSAI */
  const { error } = await supabase.from("RestroFSSAI").insert({
    RestroCode: restroCode,
    fssai_number,      // ✅ CORRECT COLUMN NAME
    expiry_date,
    file_url,
    status: "active",
  });

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
    });
  }

  return NextResponse.json({ ok: true });
}
