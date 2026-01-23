import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ================= GET PAN ================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = Number(params.code);

  const { data, error } = await supabase
    .from("RestroPAN")
    .select(`
      RestroCode,
      PanNumber,
      PanStatus,
      createdDate,
      fileurl
    `)
    .eq("RestroCode", restroCode)
    .order("createdDate", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  const rows = (data || []).map((r: any, idx: number) => ({
    id: `${r.RestroCode}-${r.PanNumber}-${idx}`,
    pan_number: r.PanNumber,
    status: r.PanStatus === "Active" ? "active" : "inactive",
    created_at: r.createdDate,
    file_url: r.fileurl ?? null,
  }));

  return NextResponse.json({ ok: true, rows });
}

/* ================= POST PAN ================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = Number(params.code);
  const form = await req.formData();

  const pan_number = (form.get("pan_number") as string)?.toUpperCase();
  const file = form.get("file") as File | null;

  // ✅ PAN validation: 5 letters + 4 digits + 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  if (!pan_number || !panRegex.test(pan_number)) {
    return NextResponse.json({
      ok: false,
      error: "Invalid PAN format (ABCDE1234F)",
    });
  }

  /* 🔥 OLD PAN → INACTIVE */
  await supabase
    .from("RestroPAN")
    .update({ PanStatus: "Inactive" })
    .eq("RestroCode", restroCode);

  let fileurl: string | null = null;

  if (file) {
    const path = `${restroCode}/${Date.now()}-${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("pan-docs")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      return NextResponse.json({ ok: false, error: uploadErr.message });
    }

    const { data } = supabase.storage
      .from("pan-docs")
      .getPublicUrl(path);

    fileurl = data.publicUrl;
  }

  const { error } = await supabase.from("RestroPAN").insert({
    RestroCode: restroCode,
    PanNumber: pan_number,
    PanStatus: "Active",
    fileurl,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
