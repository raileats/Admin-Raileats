import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MenuRow = {
  id: number;
  restro_code: string;
  item_code?: string | number | null;
  item_name?: string | null;
  item_description?: string | null;
  item_category?: string | null;
  cuisine?: string | null;
  item_start_time?: string | null; // "HH:MM"
  item_end_time?: string | null;   // "HH:MM"
  restro_price?: number | null;
  base_price?: number | null;
  gst_percent?: number | null;
  selling_price?: number | null;
  status?: "ON" | "OFF" | string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase service configuration missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/restros/[code]/menu
 * Query params supported:
 *  - q: generic search (item_code, item_name, item_description)
 *  - item_code
 *  - item_name
 *  - category
 *  - cuisine
 *  - status: ON | OFF | DELETED
 */
export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const q = (searchParams.get("q") || "").trim();
    const itemCode = (searchParams.get("item_code") || "").trim();
    const itemName = (searchParams.get("item_name") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const cuisine = (searchParams.get("cuisine") || "").trim();
    const statusFilter = (searchParams.get("status") || "").toUpperCase(); // ON/OFF/DELETED

    // base query
    let query = supabase
      .from("RestroMenuItems" as any)
      .select("*")
      .eq("restro_code", codeStr);

    // generic text search
    if (q) {
      // try OR across common columns; if some columns don't exist it is still safe on PG
      query = query.or(
        ["item_code.ilike.%"+q+"%", "item_name.ilike.%"+q+"%", "item_description.ilike.%"+q+"%"].join(",")
      );
    }

    if (itemCode) query = query.ilike("item_code", `%${itemCode}%`);
    if (itemName) query = query.ilike("item_name", `%${itemName}%`);
    if (category) query = query.ilike("item_category", `%${category}%`);
    if (cuisine) query = query.ilike("cuisine", `%${cuisine}%`);

    // status handling
    if (statusFilter === "DELETED") {
      // deleted rows: deleted_at IS NOT NULL
      query = query.not("deleted_at", "is", null);
    } else if (statusFilter === "ON" || statusFilter === "OFF") {
      // active rows by status and not deleted
      query = query.eq("status", statusFilter).is("deleted_at", null);
    } else {
      // default: not deleted
      query = query.is("deleted_at", null);
    }

    // newest first
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ ok: true, rows: (data ?? []) as MenuRow[] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}
