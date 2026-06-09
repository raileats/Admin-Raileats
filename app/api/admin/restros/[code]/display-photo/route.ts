import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const code = String(params.code || "").trim();

    if (!code) {
      return NextResponse.json({ ok: false, error: "Restro code missing" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "File missing" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".webp")) {
      return NextResponse.json({ ok: false, error: "Only WEBP image allowed" }, { status: 400 });
    }

    const fileName = `${code}.webp`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseServer.storage
      .from("RestroDisplayPhoto")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: "image/webp",
      });

    if (uploadError) throw uploadError;

    const { error: updateError } = await supabaseServer
      .from("RestroMaster")
      .update({ RestroDisplayPhoto: fileName })
      .eq("RestroCode", code);

    if (updateError) throw updateError;

    const { data } = supabaseServer.storage
      .from("RestroDisplayPhoto")
      .getPublicUrl(fileName);

    return NextResponse.json({
      ok: true,
      fileName,
      publicUrl: data.publicUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Upload failed" },
      { status: 500 }
    );
  }
}
