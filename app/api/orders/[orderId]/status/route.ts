import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

type TabKey =
  | "booked"
  | "verification"
  | "inkitchen"
  | "outfordelivery"
  | "delivered"
  | "cancelled"
  | "notdelivered"
  | "baddelivery";

type Body = {
  newStatus: string;
  remarks?: string;
  changedBy?: string;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    const resolvedParams = "then" in context.params ? await context.params : context.params;
    const orderId = resolvedParams?.orderId;
    
    if (!orderId) {
      return NextResponse.json({ error: "missing_order_id", details: "Params did not resolve orderId" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const incomingStatus = String(body.newStatus || "").toLowerCase().replace(/[^a-z]/g, "");

    const statusMap: Record<string, string> = {
      booked: "Booked",
      verification: "In Verification",
      inverification: "In Verification",
      inkitchen: "In Kitchen",
      outfordelivery: "Out for Delivery",
      delivered: "Delivered",
      cancelled: "Cancelled",
      notdelivered: "Not Delivered",
      baddelivery: "Bad Delivery",
    };

    const dbStatus = statusMap[incomingStatus];

    if (!dbStatus) {
      return NextResponse.json(
        { error: "invalid_status", details: `Received status '${body.newStatus}' mapped to nothing.` },
        { status: 400 }
      );
    }

    // 1) Fetch current order state
    const { data: order, error: fetchErr } = await serviceClient
      .from("Orders")
      .select("OrderId, Status")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: "order_lookup_failed", details: fetchErr.message, hint: fetchErr.hint }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "order_not_found", details: `No row matches OrderId: ${orderId}` }, { status: 404 });
    }

    const oldStatus = order.Status; 
    const nowIso = new Date().toISOString();

    // 2) Core Status Update with DB Error Expose
    const { error: updErr } = await serviceClient
      .from("Orders")
      .update({
        Status: dbStatus,
        UpdatedAt: nowIso,
      })
      .eq("OrderId", orderId);

    if (updErr) {
      // YAHAN SE ERROR KA ASLI DETAILS FRONTEND KO JAYEGA
      return NextResponse.json({ 
        error: "order_update_failed", 
        details: updErr.message, 
        hint: updErr.hint,
        code: updErr.code 
      }, { status: 500 });
    }

    // 3) Audit history row
    try {
      const { error: histErr } = await serviceClient.from("OrderStatusHistory").insert({
        OrderId: orderId,
        OldStatus: oldStatus ? String(oldStatus) : null,
        NewStatus: dbStatus,
        Note: body.remarks || `Status updated to ${dbStatus}`,
        ChangedBy: body.changedBy || "admin",
        ChangedAt: nowIso,
      });
      if (histErr) console.error("History DB Error: ", histErr.message);
    } catch (hE) {
      console.error("History Insert Crash: ", hE);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: e?.message || "Unknown dynamic error" }, { status: 500 });
  }
}
