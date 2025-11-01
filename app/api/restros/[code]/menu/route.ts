// app/api/restros/[code]/menu/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase service configuration missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** GET: list items for a restro (newest first) */
export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const { searchParams } = new URL(req.url);

    const q        = (searchParams.get("q") || "").trim();
    const itemCode = (searchParams.get("item_code") || "").trim();
    const itemName = (searchParams.get("item_name") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const cuisine  = (searchParams.get("cuisine") || "").trim();
    const status   = (searchParams.get("status") || "").toUpperCase(); // "ON" | "OFF" | "DELETED"

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
    if (cuisine)  query = query.ilike("item_cuisine", `%${cuisine}%`);

    // Only filter by status if provided; DO NOT touch non-existent deleted_at
    if (status === "ON" || status === "OFF" || status === "DELETED") {
      query = query.eq("status", status);
    }

    // Use an always-present column for ordering
    query = query.order("id", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}

/** POST: create item (auto global item_code) */
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

    const selling_price =
      typeof base_price === "number"
        ? Math.round(base_price * (1 + (Number.isFinite(gst_percent) ? gst_percent : 0) / 100) * 100) / 100
        : null;

    // Auto item_code (global): get last row by id, +1
    const { data: lastRows, error: lastErr } = await supabase
      .from("RestroMenuItems")
      .select("id,item_code")
      .order("id", { ascending: false })
      .limit(1);
    if (lastErr) throw lastErr;

    let nextCode = 1;
    if (Array.isArray(lastRows) && lastRows.length > 0) {
      const last = lastRows[0] as { id: number; item_code: any };
      const numericItemCode = Number(String(last.item_code ?? "").replace(/\D/g, ""));
      const safeItemCode = Number.isFinite(numericItemCode) ? numericItemCode : 0;
      nextCode = Math.max(last.id ?? 0, safeItemCode) + 1;
    }

    const insert = {
      restro_code: codeStr,
      item_code: String(nextCode),
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

    return NextResponse.json({ ok: true, row: created }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
