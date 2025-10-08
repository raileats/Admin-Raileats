// app/api/restros/[code]/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const revalidate = 0; // disable ISR for API

// Handler for GET -> fetch restro by code
export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const { code } = params;
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
  try {
    const body = await req.json().catch(() => ({}));

    // Filter allowed fields to avoid unwanted updates
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
      // add more allowed fields as needed
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
// Expects form fields and files. File input name can be `file` or `files` (multiple).
export async function POST(req: Request, { params }: { params: { code: string } }) {
  const { code } = params;

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ ok: false, error: "invalid_content_type" }, { status: 400 });
    }

    const form = await req.formData();

    // Example: other fields
    const docType = form.get("docType")?.toString() ?? "unknown"; // e.g., 'fssai', 'gst', etc.

    // Support single file input named 'file' or multiple named 'files'
    const fileLike = form.get("file") ?? form.get("files");

    if (!fileLike) {
      return NextResponse.json({ ok: false, error: "no_file_uploaded" }, { status: 400 });
    }

    // Helper to upload a single File object
    async function uploadFile(fileObj: File) {
      // generate path: restros/<code>/<timestamp>_<originalName>
      const ts = Date.now();
      const safeName = (fileObj as any).name?.replace(/[^a-zA-Z0-9.\-_]/g, "_") ?? `upload_${ts}`;
      const path = `restros/${code}/${ts}_${safeName}`;

      const arrayBuffer = await (fileObj as any).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabaseServer.storage
        .from("restro-docs")
        .upload(path, buffer, { contentType: (fileObj as any).type || "application/octet-stream", upsert: false });

      if (error) throw error;

      // get public url (may depend on your bucket policy)
      const { data: urlData } = await supabaseServer.storage.from("restro-docs").getPublicUrl(path);
      const publicUrl = (urlData as any)?.publicUrl ?? null;

      return { path, publicUrl };
    }

    // fileLike can be a single File, a FileList-like, or an array; handle robustly
    const uploads: Array<{ path: string; publicUrl: string | null }> = [];

    // If it's a single File instance
    if (typeof (File) !== "undefined" && fileLike instanceof File) {
      const res = await uploadFile(fileLike as File);
      uploads.push(res);
    } else if (Array.isArray(fileLike)) {
      // an array of items (some runtimes may return an array)
      for (const item of fileLike) {
        if (typeof (File) !== "undefined" && item instanceof File) {
          const res = await uploadFile(item as File);
          uploads.push(res);
        } else {
          console.warn("Skipping non-File item in array form data", item);
        }
      }
    } else if ((fileLike as any)?.length !== undefined && typeof (fileLike as any) !== "string") {
      // FileList-like (has .length). Convert to array and check each entry.
      const list = Array.from(fileLike as any);
      for (const f of list) {
        if (typeof (File) !== "undefined" && f instanceof File) {
          const res = await uploadFile(f as File);
          uploads.push(res);
        } else {
          console.warn("Skipping non-File item in FileList-like form data", f);
        }
      }
    } else {
      // Unknown shape (could be string or something else) — we won't cast blindly.
      console.warn("Uploaded file field has unexpected shape; skipping. Value:", fileLike);
    }

    // Optionally: store metadata in `restro_docs` table or similar
    // Example (uncomment and adjust table/columns if you have one):
    // await supabaseServer.from('restro_docs').insert(uploads.map(u=>({ restro_code: code, doc_type: docType, path: u.path, public_url: u.publicUrl })));

    return NextResponse.json({ ok: true, uploads });
  } catch (err) {
    console.error("POST /api/restros/[code] upload error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
