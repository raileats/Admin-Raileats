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
  const restroCode = Number(params.code);

  if (!restroCode || Number.isNaN(restroCode)) {
    return NextResponse.json({
      ok: false,
      error: "Invalid RestroCode",
    });
  }

  const { data, error } = await supabase
    .from("RestroGST")
    .select(`
      RestroCode,
      GstNumber,
      GstType,
      Gststatus,
      createdDate,
      fileurl
    `)
    .eq("RestroCode", restroCode)
    .order("createdDate", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  // 🔥 RETURN DATA EXACTLY AS UI EXPECTS
  const rows = (data || []).map((r, idx) => ({
    id: `${r.RestroCode}-${r.GstNumber}-${idx}`, // react key only

    GstNumber: r.GstNumber,
    GstType: r.GstType,
    Gststatus: r.Gststatus,     // ✅ "Active" / "Inactive"
    createdDate: r.createdDate, // ✅ UI uses this
    fileurl: r.fileurl || null,
  }));

  return NextResponse.json({ ok: true, rows });
}

/* ================= POST ================= */
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

  const gstNumber = form.get("gst_number") as string;
  const gstType = form.get("gst_type") as string;
  const file = form.get("file") as File | null;

  if (!gstNumber) {
    return NextResponse.json({ ok: false, error: "Missing GST number" });
  }

  // 🔥 OLD GST → INACTIVE
  await supabase
    .from("RestroGST")
    .update({ Gststatus: "Inactive" })
    .eq("RestroCode", restroCode)
    .eq("Gststatus", "Active");

  let fileurl: string | null = null;

  if (file) {
    const path = `${restroCode}/${Date.now()}-${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("gst-docs")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      return NextResponse.json({ ok: false, error: uploadErr.message });
    }

    const { data } = supabase.storage
      .from("gst-docs")
      .getPublicUrl(path);

    fileurl = data.publicUrl;
  }

  const { data: row, error } = await supabase
    .from("RestroGST")
    .insert({
      RestroCode: restroCode,
      GstNumber: gstNumber,
      GstType: gstType,
      Gststatus: "Active",
      fileurl,
      // createdDate -> DB default now()
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  const { error: masterError } = await supabase
    .from("RestroMaster")
    .update({
      GSTNumber: gstNumber,
      GSTType: gstType,
      GSTCopyUpload: fileurl,
      GSTStatus: "Active",
      UpdatedAt: new Date().toISOString(),
    })
    .eq("RestroCode", restroCode);

  if (masterError) {
    return NextResponse.json({ ok: false, error: masterError.message });
  }

  return NextResponse.json({ ok: true, row });
}
