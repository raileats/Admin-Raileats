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
    const incomingStatus = String(body.newStatus || "").toLowerCase().replace(/[^a-z]/g, "");

    // Exact database strings matching backend requirements
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

    const nowIso = new Date().toISOString();

    // 1) Pehle current order ka status fetch karte hain taaki OldStatus mil sake
    // FIXED: Wrapped 'Orders' in literal double quotes
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

    // 2) Main table '"Orders"' ko update karte hain
    const { data: updatedData, error: updErr } = await serviceClient
      .from('"Orders"') 
      .update({
        Status: dbStatus,
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

    // Checking if any row actually matched and got updated
    if (!updatedData || updatedData.length === 0) {
      return NextResponse.json({ 
        error: "order_not_found", 
        details: `No row matched with OrderId: ${orderId} inside the database.` 
      }, { status: 404 });
    }

    // 3) Audit history log insert karte hain '"OrderStatusHistory"' table par uppercase columns ke sath
    // FIXED: Wrapped 'OrderStatusHistory' in literal double quotes to respect case sensitivity
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
      // Agar database triggers automatic handle kar rahe honge toh koi conflict nahi hoga, catch safe handle karega
      console.log("History logging details: ", historyError);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: e?.message || "Unknown dynamic error" }, { status: 500 });
  }
}
