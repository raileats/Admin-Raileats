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

    // Exact database strings matching backend triggers requirements
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

    // FIXED KEYPOINT: Using '"Orders"' literal to force uppercase match in live DB without changing schema
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

    // Optional Audit log for '"OrderStatusHistory"' table with case-sensitive wrap
    try {
      await serviceClient.from('"OrderStatusHistory"').insert({
        OrderId: orderId,
        NewStatus: dbStatus,
        Note: body.remarks || `Status updated to ${dbStatus}`,
        ChangedBy: body.changedBy || "admin",
        ChangedAt: nowIso,
      });
    } catch (hE) {
      console.log("History logging bypassed or handled by DB Triggers natively:", hE);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "server_error", details: e?.message || "Unknown dynamic error" }, { status: 500 });
  }
}
