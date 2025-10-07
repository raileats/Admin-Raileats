// app/api/restros/[code]/upload-file/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // server-side supabase client with service role
import path from "path";

/**
 * Accepts raw binary body and stores into Supabase storage bucket `restro-docs`.
 * Client must send:
 *  - header "x-file-name": original filename
 *  - Content-Type header (mime)
 *  - body: raw ArrayBuffer (fetch with body = arrayBuffer)
 */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const restroCode = params.code;
  try {
    const filename = req.headers.get("x-file-name") || `upload_${Date.now()}`;
    const contentType = req.headers.get("content-type") || "application/octet-stream";

    const buffer = Buffer.from(await req.arrayBuffer());
    const ext = path.extname(filename) || "";
    const destFileName = `fssai_${restroCode}_${Date.now()}${ext}`;

    const uploadRes = await supabaseServer.storage
      .from("restro-docs")
      .upload(destFileName, buffer, { contentType, upsert: false });

    if (uploadRes.error) {
      console.error("Storage upload error:", uploadRes.error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // get public url (or you can create signed URL)
    const { data: publicData, error: publicUrlErr } = supabaseServer.storage.from("restro-docs").getPublicUrl(destFileName);
    let public_url: string | null = null;
    if (!publicUrlErr && publicData?.publicUrl) {
      public_url = publicData.publicUrl;
    }

    return NextResponse.json({ ok: true, file_url: public_url });
  } catch (err: any) {
    console.error("upload-file route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
