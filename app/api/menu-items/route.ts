// app/api/menu-items/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const restroCode = (url.searchParams.get("restroCode") ?? "").trim();
    const itemName = (url.searchParams.get("itemName") ?? "").trim();
    const status = (url.searchParams.get("status") ?? "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? PAGE_SIZE) || PAGE_SIZE));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseServer
      .from("RestroMenuItems")
      .select("*", { count: "exact" })
      .order("restro_code", { ascending: true })
      .order("item_code", { ascending: true })
      .range(from, to);

    if (restroCode) query = query.eq("restro_code", Number(restroCode));
    if (itemName) query = query.ilike("item_name", `%${itemName}%`);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      rows: data ?? [],
      total: count ?? 0,
      page,
      pageSize,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed to load menu items" },
      { status: 500 }
    );
  }
}
