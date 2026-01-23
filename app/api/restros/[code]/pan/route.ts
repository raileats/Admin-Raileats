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

  const { data, error } = await supabase
    .from("RestroPAN")
    .select(`
      id,
      RestroCode,
      PanNumber,
      PANStatus,
      CreatedDate,
      fileurl
    `)
    .eq("RestroCode", restroCode)
    .order("CreatedDate", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  const rows = (data || []).map((r: any) => ({
    id: r.id,
    pan_number: r.PanNumber,
    status: r.PANStatus === "Active" ? "active" : "inactive",
    created_at: r.CreatedDate,
    file_url: r.fileurl ?? null,
  }));

  return NextResponse.json({ ok: true, rows });
}

/* ================= POST ================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const restroCode = Number(params.code);
  const form = await req.formData();

  const pan_number = form.get("pan_number") as string;
  const file = form.get("file") as File | null;

  if (!pan_number) {
    return NextResponse.json({ ok: false, error: "Missing PAN number" });
  }

  // 🔥 OLD PAN → INACTIVE
  await supabase
    .from("RestroPAN")
    .update({ PANStatus: "Inactive" })
    .eq("RestroCode", restroCode);

  let fileurl: string | null = null;

  if (file) {
    const path = `pan/${restroCode}/${Date.now()}-${file.name}`;

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
    PANStatus: "Active",
    fileurl,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
