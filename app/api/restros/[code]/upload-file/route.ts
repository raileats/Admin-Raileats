// path: app/api/restros/[code]/upload-file/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * Upload endpoint expects raw body (ArrayBuffer).
 * Headers required:
 *  - x-file-name: original filename (required)
 *  - Content-Type: mime type (optional, defaults to application/octet-stream)
 *
 * Returns JSON: { ok: true, file_url, path } or { ok: false, error }
 */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { code } = params;

  try {
    // initialize server supabase client safely
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("Supabase server client not initialized - missing envs");
      return NextResponse.json({ ok: false, error: "server_client_not_initialized" }, { status: 500 });
    }

    // headers
    const filenameHeader = req.headers.get("x-file-name");
    const contentType = req.headers.get("content-type") ?? "application/octet-stream";

    if (!filenameHeader) {
      return NextResponse.json({ ok: false, error: "missing_x-file-name_header" }, { status: 400 });
    }

    // sanitize name and build path
    const safeName = filenameHeader.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const destPath = `restros/${code}/${Date.now()}_${safeName}`;

    // read raw body as ArrayBuffer (client should send file bytes directly)
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // upload to Supabase storage (bucket: restro-docs)
    const uploadRes = await supabase.storage.from("restro-docs").upload(destPath, buffer, {
      contentType,
      upsert: false,
    });

    // handle client version differences (some versions return { data, error })
    if ((uploadRes as any)?.error) {
      console.error("Supabase upload error:", (uploadRes as any).error);
      return NextResponse.json({ ok: false, error: String((uploadRes as any).error) }, { status: 500 });
    }

    // get public url (some versions return shape { data: { publicUrl } })
    const publicRes = await supabase.storage.from("restro-docs").getPublicUrl(destPath);
    const publicUrl = (publicRes as any)?.data?.publicUrl ?? null;

    return NextResponse.json({ ok: true, file_url: publicUrl, path: destPath });
  } catch (err: any) {
    console.error("upload-file route error:", err);
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
}
