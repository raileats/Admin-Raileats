// Use segment export runtime value supported by this Next.js version
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // ensure this is your server-side Supabase client (service role)
import formidable from "formidable";
import fs from "fs";
import path from "path";

/**
 * parseForm - parse incoming multipart/form-data using formidable
 */
function parseForm(req: Request): Promise<{ fields: any; files: any }> {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm({ multiples: false });
    // @ts-ignore - adapt to Node request
    form.parse(req as any, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const restroCode = params.code;
  const contentType = req.headers.get("content-type") ?? "";

  try {
    // --- multipart/form-data (FSSAI + file) ---
    if (contentType.includes("multipart/form-data")) {
      const { fields, files } = await parseForm(req);
      const type = fields.type;
      if (type !== "fssai") {
        return NextResponse.json({ error: "Unsupported form type" }, { status: 400 });
      }

      const fssai_number = fields.fssai_number;
      const fssai_expiry = fields.fssai_expiry;
      const file = files.fssai_file;
      // server-side validate expiry >= 1 month
      const expiryDate = new Date(fssai_expiry);
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      if (isNaN(expiryDate.getTime()) || expiryDate < min) {
        return NextResponse.json({ error: "FSSAI expiry must be at least 1 month from today" }, { status: 400 });
      }

      // upload file to supabase storage if exists
      let public_url: string | null = null;
      if (file) {
        // formidable v2+ stores filepath in file.filepath (or .path for older versions)
        // @ts-ignore
        const tmpPath = file.filepath ?? file.path;
        const origName = file.originalFilename ?? file.name ?? "fssai_doc";
        const ext = path.extname(origName) || ".pdf";
        const destFileName = `fssai_${restroCode}_${Date.now()}${ext}`;

        const buffer = fs.readFileSync(tmpPath);

        const uploadRes = await supabaseServer.storage.from("restro-docs").upload(destFileName, buffer, {
          contentType: file.mimetype ?? "application/octet-stream",
          upsert: false,
        });

        if (uploadRes.error) {
          console.error("Storage upload error:", uploadRes.error);
          return NextResponse.json({ error: "File upload failed" }, { status: 500 });
        }

        const { data: publicData, error: publicUrlErr } = supabaseServer.storage.from("restro-docs").getPublicUrl(destFileName);
        if (!publicUrlErr && publicData?.publicUrl) {
          public_url = publicData.publicUrl;
        } else {
          public_url = null; // bucket may be private — handle signed URLs if needed
        }
      }

      // Call RPC add_fssai_atomic — adjust param names if your RPC differs
      const rpcRes = await supabaseServer.rpc("add_fssai_atomic", {
        i_restro_code: restroCode,
        i_fssai_number: fssai_number,
        i_fssai_expiry: fssai_expiry,
        i_file_url: public_url,
      });

      if (rpcRes.error) {
        console.error("RPC add_fssai_atomic error:", rpcRes.error);
        return NextResponse.json({ error: "Failed to add FSSAI (RPC)" }, { status: 500 });
      }

      const { data: restroData, error: restroErr } = await supabaseServer.from("restros").select("*").eq("restro_code", restroCode).single();
      if (restroErr) {
        return NextResponse.json({ ok: true, message: "FSSAI added, but failed to fetch restro" });
      }

      return NextResponse.json({ ok: true, restro: restroData });
    }

    // --- JSON body (GST / PAN) ---
    const body = await req.json().catch(() => ({} as any));
    const { type } = body;
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

    if (type === "gst") {
      const gst_number = body.gst_number;
      if (!gst_number) return NextResponse.json({ error: "Missing gst_number" }, { status: 400 });

      const rpc = await supabaseServer.rpc("add_gst_atomic", {
        i_restro_code: restroCode,
        i_gst_number: gst_number,
      });

      if (rpc.error) {
        console.error("RPC add_gst_atomic error:", rpc.error);
        return NextResponse.json({ error: "Failed to add GST" }, { status: 500 });
      }

      const { data: restroData } = await supabaseServer.from("restros").select("*").eq("restro_code", restroCode).single();
      return NextResponse.json({ ok: true, restro: restroData });
    }

    if (type === "pan") {
      const pan_number = body.pan_number;
      if (!pan_number) return NextResponse.json({ error: "Missing pan_number" }, { status: 400 });

      const rpc = await supabaseServer.rpc("add_pan_atomic", {
        i_restro_code: restroCode,
        i_pan_number: pan_number,
      });

      if (rpc.error) {
        console.error("RPC add_pan_atomic error:", rpc.error);
        return NextResponse.json({ error: "Failed to add PAN" }, { status: 500 });
      }

      const { data: restroData } = await supabaseServer.from("restros").select("*").eq("restro_code", restroCode).single();
      return NextResponse.json({ ok: true, restro: restroData });
    }

    return NextResponse.json({ error: "Unsupported type" }, { status: 400 });
  } catch (err: any) {
    console.error("docs route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
