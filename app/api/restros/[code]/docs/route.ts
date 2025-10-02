// path: app/api/restros/[code]/docs/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const codeParam = params?.code ?? "";
    if (!codeParam) return NextResponse.json({ ok: false, error: "Missing code param" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const type = (body && body.type) || null;
    const payload = body.payload || {};
    const restroCode = Number(codeParam);

    if (!type) return NextResponse.json({ ok: false, error: "Missing type" }, { status: 400 });

    if (type === "fssai") {
      const { fssai_number, fssai_expiry, fssai_copy_url, created_by } = payload;
      const res = await supabaseServer.rpc("add_fssai_atomic", {
        p_restro_code: restroCode,
        p_fssai_number: fssai_number,
        p_fssai_expiry: fssai_expiry || null,
        p_fssai_copy_url: fssai_copy_url || null,
        p_created_by: created_by || "web",
      });
      if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
      return NextResponse.json({ ok: true, data: res.data });
    } else if (type === "gst") {
      const { gst_number, gst_type, gst_copy_url, created_by } = payload;
      const res = await supabaseServer.rpc("add_gst_atomic", {
        p_restro_code: restroCode,
        p_gst_number: gst_number,
        p_gst_type: gst_type || null,
        p_gst_copy_url: gst_copy_url || null,
        p_created_by: created_by || "web",
      });
      if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
      return NextResponse.json({ ok: true, data: res.data });
    } else if (type === "pan") {
      const { pan_number, pan_type, pan_copy_url, created_by } = payload;
      const res = await supabaseServer.rpc("add_pan_atomic", {
        p_restro_code: restroCode,
        p_pan_number: pan_number,
        p_pan_type: pan_type || null,
        p_pan_copy_url: pan_copy_url || null,
        p_created_by: created_by || "web",
      });
      if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
      return NextResponse.json({ ok: true, data: res.data });
    } else {
      return NextResponse.json({ ok: false, error: "Unknown type" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("POST /api/restros/[code]/docs error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
