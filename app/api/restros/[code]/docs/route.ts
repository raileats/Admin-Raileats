// app/api/restros/[code]/docs/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const restroCode = params.code;
  try {
    const body = await req.json().catch(() => ({} as any));
    const { type } = body;
    if (!type) return NextResponse.json({ error: "Missing type" }, { status: 400 });

    if (type === "fssai") {
      const { fssai_number, fssai_expiry, file_url } = body;
      if (!fssai_number || !fssai_expiry) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

      // Validate expiry >= 1 month
      const expiryDate = new Date(fssai_expiry);
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      if (isNaN(expiryDate.getTime()) || expiryDate < min) {
        return NextResponse.json({ error: "FSSAI expiry must be at least 1 month from today" }, { status: 400 });
      }

      // Call RPC. Adjust parameter names to match your RPC signature.
      const rpcRes = await supabaseServer.rpc("add_fssai_atomic", {
        i_restro_code: restroCode,
        i_fssai_number: fssai_number,
        i_fssai_expiry: fssai_expiry,
        i_file_url: file_url ?? null,
      });

      if (rpcRes.error) {
        console.error("RPC add_fssai_atomic error:", rpcRes.error);
        return NextResponse.json({ error: "Failed to add FSSAI (RPC)" }, { status: 500 });
      }

      const { data: restroData } = await supabaseServer.from("restros").select("*").eq("restro_code", restroCode).single();
      return NextResponse.json({ ok: true, restro: restroData });
    }

    if (type === "gst") {
      const { gst_number } = body;
      if (!gst_number) return NextResponse.json({ error: "Missing gst_number" }, { status: 400 });

      const rpc = await supabaseServer.rpc("add_gst_atomic", { i_restro_code: restroCode, i_gst_number: gst_number });
      if (rpc.error) {
        console.error("RPC add_gst_atomic error:", rpc.error);
        return NextResponse.json({ error: "Failed to add GST" }, { status: 500 });
      }
      const { data: restroData } = await supabaseServer.from("restros").select("*").eq("restro_code", restroCode).single();
      return NextResponse.json({ ok: true, restro: restroData });
    }

    if (type === "pan") {
      const { pan_number } = body;
      if (!pan_number) return NextResponse.json({ error: "Missing pan_number" }, { status: 400 });

      const rpc = await supabaseServer.rpc("add_pan_atomic", { i_restro_code: restroCode, i_pan_number: pan_number });
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
