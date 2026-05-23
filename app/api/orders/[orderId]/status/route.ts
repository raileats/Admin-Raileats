import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

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
    
    // 🔹 Pure string cleaning bina spaces aur underscores hataye taaki exact match pakad sake
    const incomingStatus = String(body.newStatus || "").toLowerCase().trim();

    // 🔹 FIX: Map frontend active values directly to your EXACT Database schema strings (Uppercase + Underscores)
    const statusMap: Record<string, string> = {
      booked: "BOOKED",
      verification: "UNDER_VERIFICATION",
      inverification: "UNDER_VERIFICATION",
      "in verification": "UNDER_VERIFICATION",
      under_verification: "UNDER_VERIFICATION",
      inkitchen: "IN_KITCHEN",
      "in kitchen": "IN_KITCHEN",
      in_kitchen: "IN_KITCHEN",
      outfordelivery: "OUT_FOR_DELIVERY",
      "out for delivery": "OUT_FOR_DELIVERY",
      out_for_delivery: "OUT_FOR_DELIVERY",
      delivered: "DELIVERED",
      cancelled: "CANCELLED",
      notdelivered: "NOT_DELIVERED",
      "not delivered": "NOT_DELIVERED",
      not_delivered: "NOT_DELIVERED",
      baddelivery: "BAD_DELIVERY",
      "bad delivery": "BAD_DELIVERY",
      bad_delivery: "BAD_DELIVERY",
    };

    const dbStatus = statusMap[incomingStatus] || body.newStatus; // Fallback to raw if already uppercase

    if (!dbStatus) {
      return NextResponse.json(
        { error: "invalid_status", details: `Received status '${body.newStatus}' mapped to nothing.` },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // 1) Pehle current order ka status fetch karte hain taaki OldStatus mil sake
    const { data: currentOrder, error: fetchErr } = await serviceClient
      .from('"Orders"')
      .select("Status")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ 
        error: "order_fetch_failed", 
        details: fetchErr.message 
      }, { status: 500 });
    }

    const oldStatus = currentOrder ? currentOrder.Status : null;

    // 2) Main table '"Orders"' ko update karte hain uppercase format database status ke sath
    const { data: updatedData, error: updErr } = await serviceClient
      .from('"Orders"') 
      .update({
        Status: dbStatus, // Database formats like 'UNDER_VERIFICATION', 'DELIVERED'
        UpdatedAt: nowIso,
      })
      .eq("OrderId", orderId)
      .select("OrderId, Status");

    if (updErr) {
      return NextResponse.json({ 
        error: "order_update_failed", 
        details: updErr.message, 
        hint: updErr.hint,
        code: updErr.code 
      }, { status: 500 });
    }

    if (!updatedData || updatedData.length === 0) {
      return NextResponse.json({ 
        error: "order_not_found", 
        details: `No row matched with OrderId: ${orderId} inside the database.` 
      }, { status: 404 });
    }

    // 3) Audit history log insert karte hain '"OrderStatusHistory"' table par
    try {
      await serviceClient.from('"OrderStatusHistory"').insert({
        OrderId: orderId,
        OldStatus: oldStatus,
        NewStatus: dbStatus,
        Note: body.remarks || `Status updated to ${dbStatus}`,
        ChangedBy: body.changedBy || "admin",
        ChangedAt: nowIso,
      });
    } catch (historyError) {
      console.log("History logging bypass log: ", historyError);
    }

    return NextResponse.json({ ok: true, currentStatus: dbStatus });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: e?.message || "Unknown dynamic error" }, { status: 500 });
  }
}
