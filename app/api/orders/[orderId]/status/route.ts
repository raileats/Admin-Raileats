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
    // FIXED: Handled Next.js dynamic routing parameter promise safely
    const resolvedParams = "then" in context.params ? await context.params : context.params;
    const orderId = resolvedParams?.orderId;
    
    if (!orderId) {
      return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
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
        { error: "invalid_status", received: body.newStatus },
        { status: 400 }
      );
    }

    // 1) Fetch current order state safely
    const { data: order, error: fetchErr } = await serviceClient
      .from("Orders")
      .select("OrderId, Status")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (fetchErr) {
      console.error("status PATCH: fetchErr", fetchErr);
      return NextResponse.json({ error: "order_lookup_failed" }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    }

    const oldStatus = order.Status; 
    const nowIso = new Date().toISOString();

    // 2) Execute core status change update inside Orders Table
    const { error: updErr } = await serviceClient
      .from("Orders")
      .update({
        Status: dbStatus,
        UpdatedAt: nowIso,
      })
      .eq("OrderId", orderId);

    if (updErr) {
      console.error("status PATCH: updateErr", updErr);
      return NextResponse.json({ error: "order_update_failed", message: updErr.message }, { status: 500 });
    }

    // 3) Push audit trace logs silently to OrderStatusHistory Table
    try {
      await serviceClient.from("OrderStatusHistory").insert({
        OrderId: orderId,
        OldStatus: oldStatus ? String(oldStatus) : null,
        NewStatus: dbStatus,
        Note: body.remarks || `Status updated to ${dbStatus}`,
        ChangedBy: body.changedBy || "admin",
        ChangedAt: nowIso,
      });
    } catch (histErr) {
      console.error("status PATCH: history logger fallback triggered", histErr);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("status PATCH: runtime shell exception caught", e);
    return NextResponse.json({ error: "server_error", message: e?.message }, { status: 500 });
  }
}
