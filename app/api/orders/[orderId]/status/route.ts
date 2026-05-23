import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // 1) Base query build karenge '"Orders"' table par literal double quotes ke sath
    let query = serviceClient
      .from('"Orders"')
      .select(`
        *,
        history: "OrderStatusHistory" (
          OrderId,
          OldStatus,
          NewStatus,
          Note,
          ChangedBy,
          ChangedAt
        )
      `);

    // 2) Agar status filter pass kiya hai toh correct case value lagayein
    if (statusFilter) {
      query = query.eq("Status", statusFilter);
    }

    // 3) Sorting lagayenge dynamic UpdatedAt column par
    query = query.order("UpdatedAt", { ascending: false });

    const { data: orders, error: fetchErr } = await query;

    if (fetchErr) {
      console.error("Supabase query error:", fetchErr);
      return NextResponse.json(
        { 
          error: "orders_fetch_failed", 
          details: fetchErr.message,
          hint: fetchErr.hint,
          code: fetchErr.code 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, orders: orders || [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", details: e?.message || "Unknown dynamic error" }, 
      { status: 500 }
    );
  }
}
