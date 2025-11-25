// app/api/orders/[orderId]/status/route.ts
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
  newStatus: TabKey;
  remarks?: string;
  changedBy?: string;
};

export async function PATCH(
  req: Request,
  { params }: { params: { orderId: string } },
) {
  try {
    const orderId = params.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "missing_order_id" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const newStatus = body.newStatus;
    if (
      !newStatus ||
      ![
        "booked",
        "verification",
        "inkitchen",
        "outfordelivery",
        "delivered",
        "cancelled",
        "notdelivered",
        "baddelivery",
      ].includes(newStatus)
    ) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    const supa = serviceClient;

    // 1) current order fetch karo
    const { data: order, error: fetchErr } = await supa
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

    const oldStatus = order.Status as TabKey | null;
    const nowIso = new Date().toISOString();

    // 2) Orders table me Status update
    const { error: updErr } = await supa
      .from("Orders")
      .update({
        Status: newStatus,
        UpdatedAt: nowIso,
      })
      .eq("OrderId", orderId);

    if (updErr) {
      console.error("status PATCH: updateErr", updErr);
      return NextResponse.json({ error: "order_update_failed" }, { status: 500 });
    }

    // 3) OrderStatusHistory me row add karo
    const { error: histErr } = await supa.from("OrderStatusHistory").insert({
      OrderId: orderId,
      OldStatus: oldStatus,
      NewStatus: newStatus,
      Note: body.remarks || null,
      ChangedBy: body.changedBy || "admin",
      ChangedAt: nowIso,
    });

    if (histErr) {
      console.error("status PATCH: historyErr", histErr);
      // yahan error aaye to bhi 200 de sakte hai (status update ho chuka hai)
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("status PATCH: server_error", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
