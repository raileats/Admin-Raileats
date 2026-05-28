import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    .from("RestroPAN")
    .select(`
      id,
      RestroCode,
      PanNumber,
      PanType,
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
    pan_type: r.PanType ?? "",
    status: r.PANStatus === "Active" ? "active" : "inactive",
    created_at: r.CreatedDate,
    file_url: r.fileurl ?? null,
  }));

  return NextResponse.json(
    { ok: true, rows },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
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

  const pan_number = form.get("pan_number") as string;
  const pan_type = ((form.get("pan_type") as string | null) || "").trim();
  const file = form.get("file") as File | null;

  if (!pan_number) {
    return NextResponse.json({ ok: false, error: "Missing PAN number" });
  }

  // 🔥 OLD PAN → INACTIVE
  await supabase
    .from("RestroPAN")
    .update({ PANStatus: "Inactive" })
    .eq("RestroCode", restroCode)
    .eq("PANStatus", "Active");

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

  const { data: row, error } = await supabase
    .from("RestroPAN")
    .insert({
      RestroCode: restroCode,
      PanNumber: pan_number,
      PanType: pan_type || null,
      PANStatus: "Active",
      fileurl,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  const { error: masterError } = await supabase
    .from("RestroMaster")
    .update({
      PANNumber: pan_number,
      PANType: pan_type || null,
      UploadPanCopy: fileurl,
      PANStatus: "Active",
      UpdatedAt: new Date().toISOString(),
    })
    .eq("RestroCode", restroCode);

  if (masterError) {
    return NextResponse.json({ ok: false, error: masterError.message });
  }

  return NextResponse.json(
    { ok: true, row },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
