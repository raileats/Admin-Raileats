// ✅ path: app/api/restros/[code]/docs/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";  // updated import

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const restroCode = params.code;

  try {
    // ✅ initialize supabase safely
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("Supabase not initialized — missing env variables");
      return NextResponse.json({ ok: false, error: "server_client_not_initialized" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({} as any));
    const { type } = body;
    if (!type) return NextResponse.json({ ok: false, error: "Missing type" }, { status: 400 });

    // ----------- FSSAI -----------
    if (type === "fssai") {
      const { fssai_number, fssai_expiry, file_url } = body;
      if (!fssai_number || !fssai_expiry) {
        return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
      }

      // expiry >= 1 month
      const expiryDate = new Date(fssai_expiry);
      const now = new Date();
      const min = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      if (isNaN(expiryDate.getTime()) || expiryDate < min) {
        return NextResponse.json({ ok: false, error: "FSSAI expiry must be at least 1 month from today" }, { status: 400 });
      }

      const rpcRes = await supabase.rpc("add_fssai_atomic", {
        i_restro_code: restroCode,
        i_fssai_number: fssai_number,
        i_fssai_expiry: fssai_expiry,
        i_file_url: file_url ?? null,
      });

      if (rpcRes.error) {
        console.error("RPC add_fssai_atomic error:", rpcRes.error);
        return NextResponse.json({ ok: false, error: "Failed to add FSSAI", details: String(rpcRes.error) }, { status: 500 });
      }

      const { data, error: selErr } = await supabase
        .from("restros")
        .select("*")
        .eq("restro_code", restroCode)
        .single();

      return NextResponse.json({ ok: true, restro: data ?? null, warning: selErr ? "Fetched with warning" : undefined });
    }

    // ----------- GST -----------
    if (type === "gst") {
      const { gst_number } = body;
      if (!gst_number) return NextResponse.json({ ok: false, error: "Missing gst_number" }, { status: 400 });

      const rpc = await supabase.rpc("add_gst_atomic", {
        i_restro_code: restroCode,
        i_gst_number: gst_number,
      });

      if (rpc.error) {
        console.error("RPC add_gst_atomic error:", rpc.error);
        return NextResponse.json({ ok: false, error: "Failed to add GST", details: String(rpc.error) }, { status: 500 });
      }

      const { data, error: selErr } = await supabase
        .from("restros")
        .select("*")
        .eq("restro_code", restroCode)
        .single();

      return NextResponse.json({ ok: true, restro: data ?? null, warning: selErr ? "Fetched with warning" : undefined });
    }

    // ----------- PAN -----------
    if (type === "pan") {
      const { pan_number } = body;
      if (!pan_number) return NextResponse.json({ ok: false, error: "Missing pan_number" }, { status: 400 });

      const rpc = await supabase.rpc("add_pan_atomic", {
        i_restro_code: restroCode,
        i_pan_number: pan_number,
      });

      if (rpc.error) {
        console.error("RPC add_pan_atomic error:", rpc.error);
        return NextResponse.json({ ok: false, error: "Failed to add PAN", details: String(rpc.error) }, { status: 500 });
      }

      const { data, error: selErr } = await supabase
        .from("restros")
        .select("*")
        .eq("restro_code", restroCode)
        .single();

      return NextResponse.json({ ok: true, restro: data ?? null, warning: selErr ? "Fetched with warning" : undefined });
    }

    return NextResponse.json({ ok: false, error: "Unsupported type" }, { status: 400 });
  } catch (err: any) {
    console.error("docs route error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error", details: String(err) }, { status: 500 });
  }
}
