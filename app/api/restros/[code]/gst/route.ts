import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ================= GET GST ================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = params.code;

  const { data, error } = await supabase
    .from("RestroGST")
    .select("*")
    .eq("RestroCode", restroCode)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, rows: data });
}

/* ================= ADD NEW GST ================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = params.code;
  const form = await req.formData();

  const gst_number = form.get("gst_number") as string;
  const gst_type = form.get("gst_type") as string;
  const file = form.get("file") as File | null;

  if (!gst_number) {
    return NextResponse.json({
      ok: false,
      error: "GST number is required",
    });
  }

  if (!gst_type) {
    return NextResponse.json({
      ok: false,
      error: "GST type is required",
    });
  }

  /* ================= OLD GST INACTIVE ================= */
  await supabase
    .from("RestroGST")
    .update({ status: "inactive" })
    .eq("RestroCode", restroCode);

  /* ================= FILE UPLOAD ================= */
  let file_url: string | null = null;

  if (file) {
    const path = `${restroCode}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("gst-docs")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      return NextResponse.json({
        ok: false,
        error: uploadError.message,
      });
    }

    const { data } = supabase.storage
      .from("gst-docs")
      .getPublicUrl(path);

    file_url = data.publicUrl;
  }

  /* ================= INSERT NEW GST ================= */
  const { error } = await supabase.from("RestroGST").insert({
    RestroCode: restroCode,
    gst_number,
    gst_type,
    file_url,
    status: "active",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
