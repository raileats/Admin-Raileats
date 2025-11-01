// app/api/restros/[code]/menu/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase service configuration missing");
  // no session persistence for server routes
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/restros/[code]/menu
 * Query params:
 *  - q            : fuzzy search across item_code, item_name, item_description
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
      .from("RestroMenuItems" as any)
      .select("*")
      .eq("restro_code", codeStr);

    if (q) {
      query = query.or(
        [
          `item_code.ilike.%${q}%`,
          `item_name.ilike.%${q}%`,
          `item_description.ilike.%${q}%`,
        ].join(","),
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

    const { data, error } = await query.order("created_at", { ascending: false });
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
 * Also: auto-assigns a GLOBAL sequential item_code ("1","2","3",...)
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
    // Find the last row by 'id' and increment. Fallback to 1 if table is empty.
    const { data: lastRows, error: lastErr } = await supabase
      .from("RestroMenuItems" as any)
      .select("id,item_code")
      .order("id", { ascending: false })
      .limit(1);

    if (lastErr) throw lastErr;

    let nextCode = 1;
    if (lastRows && lastRows.length > 0) {
      const last = lastRows[0] as { id: number; item_code: any };
      const numericItemCode = Number(String(last.item_code ?? "").replace(/\D/g, ""));
      const safeItemCode = Number.isFinite(numericItemCode) ? numericItemCode : 0;
      nextCode = Math.max(last.id ?? 0, safeItemCode) + 1;
    }
    // --------------------------------------------

    const insert = {
      restro_code: codeStr,
      item_code: String(nextCode), // <- auto assigned here
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
      // deleted_at stays null on create
    };

    const { error } = await supabase.from("RestroMenuItems").insert(insert as any);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
