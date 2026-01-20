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
    .from("RestroFSSAI")
    .select("*")
    .eq("RestroCode", restroCode)
    .order("created_at", { ascending: false });

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

  const fssai_number = form.get("fssai_number") as string;
  const expiry_date = form.get("expiry_date") as string | null;
  const file = form.get("file") as File | null;

  if (!fssai_number) {
    return NextResponse.json({ ok: false, error: "Missing FSSAI number" });
  }

  /* 🔥 OLD ENTRIES INACTIVE */
  await supabase
    .from("RestroFSSAI")
    .update({ status: "inactive" })
    .eq("RestroCode", restroCode);

  let file_url: string | null = null;

  if (file) {
    const path = `${restroCode}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from("fssai-docs")
      .upload(path, file);

    if (!uploadErr) {
      const { data } = supabase.storage
        .from("fssai-docs")
        .getPublicUrl(path);
      file_url = data.publicUrl;
    }
  }

  const { error } = await supabase.from("RestroFSSAI").insert({
    RestroCode: restroCode,
    FssaiNumber: fssai_number,
    expiry_date,
    file_url,
    status: "active",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
