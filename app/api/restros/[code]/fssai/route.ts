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
  const restroCode = Number(params.code);

  if (!restroCode || Number.isNaN(restroCode)) {
    return NextResponse.json({
      ok: false,
      error: "Invalid RestroCode",
    });
  }

  const { data, error } = await supabase
    .from("RestroFSSAI")
    .select("*")
    .eq("RestroCode", restroCode)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  const rows = (data || []).map((r: any, idx: number) => ({
    id: r.id ?? r.FssaiId ?? `${r.RestroCode}-${r.fssai_number}-${idx}`,
    fssai_number: r.fssai_number,
    expiry_date: r.expiry_date,
    file_url: r.file_url ?? null,
    status: String(r.status || "").toLowerCase() === "active" ? "active" : "inactive",
    created_at: r.created_at ?? r.CreatedDate ?? null,
  }));

  return NextResponse.json({ ok: true, rows });
}

/* ========================= POST ========================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = Number(params.code);

  if (!restroCode || Number.isNaN(restroCode)) {
    return NextResponse.json({
      ok: false,
      error: "Invalid RestroCode",
    });
  }

  const form = await req.formData();

  const fssai_number = form.get("fssai_number") as string;
  const expiry_date = (form.get("expiry_date") as string | null) || null;
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
  const { data: row, error } = await supabase
    .from("RestroFSSAI")
    .insert({
      RestroCode: restroCode,
      fssai_number, // ✅ CORRECT COLUMN NAME
      expiry_date,
      file_url,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
    });
  }

  /* 🔥 STEP 4: SYNC LATEST FSSAI INTO RESTRO MASTER */
  const { error: masterError } = await supabase
    .from("RestroMaster")
    .update({
      FSSAINumber: fssai_number,
      FSSAIExpiryDate: expiry_date,
      FSSAICopyUpload: file_url,
      FSSAIStatus: "Active",
      UpdatedAt: new Date().toISOString(),
    })
    .eq("RestroCode", restroCode);

  if (masterError) {
    return NextResponse.json({
      ok: false,
      error: masterError.message,
    });
  }

  return NextResponse.json({ ok: true, row });
}
