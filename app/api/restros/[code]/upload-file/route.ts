// app/api/restros/[code]/upload-file/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "node"; // ensure Node runtime if Buffer is needed

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { code } = params;

  try {
    // Expect raw ArrayBuffer body and headers:
    // - x-file-name: original filename
    // - Content-Type: mime type
    const filenameHeader = req.headers.get("x-file-name");
    const contentType = req.headers.get("content-type") || "application/octet-stream";

    if (!filenameHeader) {
      return NextResponse.json({ ok: false, error: "missing_x-file-name_header" }, { status: 400 });
    }

    const destFileName = filenameHeader.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const destPath = `restros/${code}/${Date.now()}_${destFileName}`;

    // Read raw body
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const uploadRes = await supabaseServer.storage
      .from("restro-docs")
      .upload(destPath, buffer, {
        contentType,
        upsert: false,
      });

    // uploadRes may be { data, error } depending on client version
    if ((uploadRes as any)?.error) {
      const err = (uploadRes as any).error;
      console.error("Supabase upload error:", err);
      return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
    }

    // getPublicUrl returns { data: { publicUrl: string } } (no error property in some client types)
    const publicUrlResult = await supabaseServer.storage.from("restro-docs").getPublicUrl(destPath);
    // safe access:
    const publicUrl = (publicUrlResult as any)?.data?.publicUrl ?? null;

    // If you need a signed URL instead (private bucket), use createSignedUrl
    // const { data: signedData, error: signedErr } = await supabaseServer.storage.from("restro-docs").createSignedUrl(destPath, 60);

    return NextResponse.json({ ok: true, file_url: publicUrl, path: destPath });
  } catch (err) {
    console.error("upload-file route error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
