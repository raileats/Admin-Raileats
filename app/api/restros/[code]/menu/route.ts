import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Row = {
  id: number;
  restro_code: string;
  item_code: string;
  item_name: string;
  item_description: string | null;
  item_category: string | null;
  item_cuisine: string | null;
  start_time: string | null; // HH:MM:SS
  end_time: string | null;
  restro_price: number | null;
  base_price: number | null;
  gst_percent: number | null;
  selling_price: number | null;
  status: "ON" | "OFF" | "DELETED";
  created_at: string;
  updated_at: string;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const supabase = adminClient();
    const codeStr = String(params.code ?? "");

    const { searchParams } = new URL(req.url);
    const includeAll = searchParams.get("include_all") === "1";
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") || "").toUpperCase(); // ON/OFF/DELETED

    let query = supabase
      .from<"RestroMenuItems", Row>("RestroMenuItems" as any)
      .select("*")
      .eq("restro_code", codeStr);

    if (!includeAll) query = query.neq("status", "DELETED");
    if (statusFilter === "ON" || statusFilter === "OFF" || statusFilter === "DELETED") {
      query = query.eq("status", statusFilter as any);
    }
    if (q) {
      // very simple search (handled client-side too); server side narrow by name/code
      query = query.or(`item_name.ilike.%${q}%,item_code.ilike.%${q}%`);
    }

    const { data, error } = await query.order("item_name", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ ok: true, rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = adminClient();
    const codeStr = String(params.code ?? "");

    const {
      item_code,
      item_name,
      item_description = null,
      item_category = null,
      item_cuisine = null,
      start_time = null,
      end_time = null,
      restro_price = null,
      base_price = null,
      gst_percent = 0,
      status = "ON",
    } = body || {};

    if (!item_code || !item_name) throw new Error("item_code & item_name required");

    const selling =
      base_price != null && !Number.isNaN(base_price)
        ? Math.round((Number(base_price) * (1 + Number(gst_percent || 0) / 100)) * 100) / 100
        : null;

    const payload = {
      restro_code: codeStr,
      item_code: String(item_code),
      item_name: String(item_name),
      item_description,
      item_category,
      item_cuisine,
      start_time: start_time ? `${start_time}:00` : null, // expect "HH:MM"
      end_time: end_time ? `${end_time}:00` : null,
      restro_price: restro_price != null ? Number(restro_price) : null,
      base_price: base_price != null ? Number(base_price) : null,
      gst_percent: gst_percent != null ? Number(gst_percent) : 0,
      selling_price: selling,
      status: ["ON", "OFF", "DELETED"].includes(String(status).toUpperCase())
        ? String(status).toUpperCase()
        : "ON",
    };

    const { data, error } = await supabase.from("RestroMenuItems").insert(payload).select("*").single();
    if (error) throw error;

    return NextResponse.json({ ok: true, row: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "failed" }, { status: 400 });
  }
}
