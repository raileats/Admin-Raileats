import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const code = String(params.code || "").trim();

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Restro code missing" },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY missing in Vercel" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "File missing" },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".webp")) {
      return NextResponse.json(
        { ok: false, error: "Only WEBP image allowed" },
        { status: 400 }
      );
    }

    const fileName = `${code}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await supabaseAdmin.storage
      .from("RestroDisplayPhoto")
      .remove([fileName]);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("RestroDisplayPhoto")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/webp",
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: updateError } = await supabaseAdmin
      .from("RestroMaster")
      .update({ RestroDisplayPhoto: fileName })
      .eq("RestroCode", code);

    if (updateError) {
      throw updateError;
    }

    const { data } = supabaseAdmin.storage
      .from("RestroDisplayPhoto")
      .getPublicUrl(fileName);

    return NextResponse.json({
      ok: true,
      fileName,
      publicUrl: `${data.publicUrl}?v=${Date.now()}`,
    });
  } catch (err: any) {
  console.error("DISPLAY PHOTO API ERROR:", err);

  return NextResponse.json(
    {
      ok: false,
      error: err?.message || "Upload failed",
      details: err,
    },
    { status: 500 }
  );
}
