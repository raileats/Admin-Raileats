import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ================= GET ================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = params.code;

  const { data, error } = await supabase
    .from("RestroGST")
    .select("*")
    .eq("RestroCode", restroCode)
    .order("createdDate", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, rows: data });
}

/* ================= POST ================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = params.code;
  const form = await req.formData();

  const gst_number = form.get("gst_number") as string;
  const gst_type = form.get("gst_type") as string; // Regular / Composition
  const file = form.get("file") as File | null;

  if (!gst_number) {
    return NextResponse.json({ ok: false, error: "Missing GST number" });
  }

  if (!gst_type) {
    return NextResponse.json({ ok: false, error: "Missing GST type" });
  }

  /* 🔥 OLD GST -> INACTIVE */
  await supabase
    .from("RestroGST")
    .update({ Gststatus: "Inactive" })
    .eq("RestroCode", restroCode);

  let fileurl: string | null = null;

  /* ================= FILE UPLOAD ================= */
  if (file) {
    const path = `${restroCode}/${Date.now()}-${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("gst-docs")
      .upload(path, file);

    if (uploadErr) {
      return NextResponse.json({ ok: false, error: uploadErr.message });
    }

    const { data } = supabase.storage
      .from("gst-docs")
      .getPublicUrl(path);

    fileurl = data.publicUrl;
  }

  /* ================= INSERT ================= */
  const { error } = await supabase.from("RestroGST").insert({
    RestroCode: restroCode,
    GstNumber: gst_number,
    GstType: gst_type,
    fileurl: fileurl,
    Gststatus: "Active",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
