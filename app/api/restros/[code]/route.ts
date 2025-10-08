// app/api/restros/[code]/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const revalidate = 0; // disable ISR for API

function missingSupabaseResponse() {
  return NextResponse.json(
    { ok: false, error: "Missing SUPABASE_URL or SUPABASE key in environment" },
    { status: 500 }
  );
}

// Handler for GET -> fetch restro by code
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const { code } = params;
  const supabaseServer = getSupabaseServer();
  if (!supabaseServer) return missingSupabaseResponse();

  try {
    const { data, error } = await supabaseServer
      .from("restros")
      .select("*")
      .eq("code", code)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("GET /api/restros/[code] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Handler for PATCH -> update restro fields (expects JSON body)
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const { code } = params;
  const supabaseServer = getSupabaseServer();
  if (!supabaseServer) return missingSupabaseResponse();

  try {
    const body = await req.json().catch(() => ({}));

    const allowed = [
      "RestroName",
      "RestroEmail",
      "RestroPhone",
      "OwnerName",
      "OwnerEmail",
      "OwnerPhone",
      "BrandName",
      "StationCode",
      "StationName",
      "State",
      "District",
      "Address",
      "Pincode",
    ];

    const payload: Record<string, any> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) payload[k] = body[k];
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: false, error: "no_valid_fields" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("restros")
      .update(payload)
      .eq("code", code)
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("PATCH /api/restros/[code] error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// Handler for POST -> handle multipart form uploads via Request.formData()
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { code } = params;
  const supabaseServer = getSupabaseServer();
  if (!supabaseServer) return missingSupabaseResponse();

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "invalid_content_type" }, { status: 400 });
    }

    const form = await req.formData();
    const docType = form.get("docType")?.toString() ?? "unknown";
    const fileLike = form.get("file") ?? form.get("files");
    if (!fileLike) return NextResponse.json({ ok: false, error: "no_file_uploaded" }, { status: 400 });

    async function uploadFile(fileObj: File) {
      const ts = Date.now();
      const safeName = (fileObj as any).name?.replace(/[^a-zA-Z0-9.\-_]/g, "_") ?? `upload_${ts}`;
      const path = `restros/${code}/${ts}_${safeName}`;
      const arrayBuffer = await (fileObj as any).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabaseServer.storage
        .from("restro-docs")
        .upload(path, buffer, { contentType: (fileObj as any).type || "application/octet-stream", upsert: false });

      if (error) throw error;
      const { data: urlData } = await supabaseServer.storage.from("restro-docs").getPublicUrl(path);
      const publicUrl = (urlData as any)?.publicUrl ?? null;
      return { path, publicUrl };
    }

    const uploads: Array<{ path: string; publicUrl: string | null }> = [];

    if (typeof (File) !== "undefined" && fileLike instanceof File) {
      uploads.push(await uploadFile(fileLike as File));
    } else if (Array.isArray(fileLike)) {
      for (const item of fileLike) {
        if (typeof (File) !== "undefined" && item instanceof File) uploads.push(await uploadFile(item as File));
      }
    } else if ((fileLike as any)?.length !== undefined && typeof (fileLike as any) !== "string") {
      const list = Array.from(fileLike as any);
      for (const f of list) {
        if (typeof (File) !== "undefined" && f instanceof File) uploads.push(await uploadFile(f as File));
      }
    } else {
      console.warn("Uploaded file field has unexpected shape; skipping. Value:", fileLike);
    }

    return NextResponse.json({ ok: true, uploads });
  } catch (err) {
    console.error("POST /api/restros/[code] upload error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
