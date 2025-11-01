// app/api/restros/[code]/menu/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase service configuration missing");
  // server routes don't need session persistence
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/restros/[code]/menu
 * Query params:
 *  - q            : fuzzy search across item_code, item_name, item_description, item_category, item_cuisine
 *  - item_code    : ILIKE filter
 *  - item_name    : ILIKE filter
 *  - category     : ILIKE filter on item_category
 *  - cuisine      : ILIKE filter on item_cuisine
 *  - status       : ON | OFF | DELETED  (default: not deleted; any status)
 */
export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const itemCode = (searchParams.get("item_code") || "").trim();
    const itemName = (searchParams.get("item_name") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const cuisine = (searchParams.get("cuisine") || "").trim();
    const statusFilter = (searchParams.get("status") || "").toUpperCase(); // ON | OFF | DELETED

    let query = supabase
      .from("RestroMenuItems")
      .select("*")
      .eq("restro_code", codeStr);

    if (q) {
      query = query.or(
        [
          `item_code.ilike.%${q}%`,
          `item_name.ilike.%${q}%`,
          `item_description.ilike.%${q}%`,
          `item_category.ilike.%${q}%`,
          `item_cuisine.ilike.%${q}%`,
        ].join(",")
      );
    }

    if (itemCode) query = query.ilike("item_code", `%${itemCode}%`);
    if (itemName) query = query.ilike("item_name", `%${itemName}%`);
    if (category) query = query.ilike("item_category", `%${category}%`);
    if (cuisine) query = query.ilike("item_cuisine", `%${cuisine}%`);

    // status & soft-delete handling
    if (statusFilter === "DELETED") {
      query = query.not("deleted_at", "is", null);
    } else if (statusFilter === "ON" || statusFilter === "OFF") {
      query = query.eq("status", statusFilter).is("deleted_at", null);
    } else {
      query = query.is("deleted_at", null);
    }

    // order by stable always-present column
    query = query.order("id", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}

/**
 * POST /api/restros/[code]/menu
 * Body:
 *  - item_name (required)
 *  - item_description, item_category, item_cuisine, menu_type
 *  - start_time, end_time        // "HH:MM"
 *  - restro_price, base_price, gst_percent
 *  - status ("ON" | "OFF")
 *
 * Also: auto-assigns a GLOBAL sequential item_code ("1","2","3",...).
 */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const body = await req.json();

    const item_name: string = (body.item_name ?? "").toString().trim();
    if (!item_name) throw new Error("Item Name required");

    const base_price =
      body.base_price === "" || body.base_price == null ? null : Number(body.base_price);
    const gst_percent =
      body.gst_percent === "" || body.gst_percent == null ? 0 : Number(body.gst_percent);

    // compute selling price if base & gst available
    const selling_price =
      typeof base_price === "number"
        ? Math.round(base_price * (1 + (Number.isFinite(gst_percent) ? gst_percent : 0) / 100) * 100) / 100
        : null;

    // ---------- AUTO item_code (global) ----------
    // Try to compute numeric max(item_code) and id; fallback safely to 0
    const { data: agg, error: aggErr } = await supabase
      .from("RestroMenuItems")
      .select("max_id=max(id), last_code=item_code")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (aggErr && aggErr.code !== "PGRST116") throw aggErr; // ignore "no rows" error

    let nextCode = 1;
    if (agg) {
      const lastNumeric =
        typeof agg.last_code === "string"
          ? Number(agg.last_code.replace(/\D/g, "")) || 0
          : 0;
      const maxId = Number(agg.max_id || 0);
      nextCode = Math.max(maxId, lastNumeric) + 1;
    }
    // --------------------------------------------

    const insert = {
      restro_code: codeStr,
      item_code: String(nextCode), // auto code
      item_name,
      item_description: (body.item_description ?? "").toString().trim() || null,
      item_category: body.item_category || null,
      item_cuisine: body.item_cuisine || null,
      menu_type: body.menu_type || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      restro_price:
        body.restro_price === "" || body.restro_price == null ? null : Number(body.restro_price),
      base_price,
      gst_percent,
      selling_price,
      status: body.status === "OFF" ? "OFF" : "ON",
    };

    const { data: created, error } = await supabase
      .from("RestroMenuItems")
      .insert(insert)
      .select("*")
      .single();

    if (error) throw error;

    // return created row so UI can update immediately
    return NextResponse.json({ ok: true, row: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
