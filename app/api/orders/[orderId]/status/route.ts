import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

export async function PATCH(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    const body = await req.json();

    const newStatus = String(body.newStatus || "").trim();
    const remarks = body.remarks || "";
    const changedBy = body.changedBy || "admin";

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { ok: false, error: "missing_data" },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      "Booked",
      "In Verification",
      "In Kitchen",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Not Delivered",
      "Bad Delivery",
    ];

    if (!allowedStatuses.includes(newStatus)) {
      return NextResponse.json(
        { ok: false, error: "invalid_status" },
        { status: 400 }
      );
    }

    const supa = serviceClient;

    // current order
    const { data: oldOrder, error: fetchError } = await supa
      .from("Orders")
      .select("*")
      .eq("OrderId", orderId)
      .single();

    if (fetchError || !oldOrder) {
      return NextResponse.json(
        { ok: false, error: "order_not_found" },
        { status: 404 }
      );
    }

    // update order
    const { error: updateError } = await supa
      .from("Orders")
      .update({
        Status: newStatus,
        UpdatedAt: new Date().toISOString(),
      })
      .eq("OrderId", orderId);

    if (updateError) {
      console.error(updateError);

      return NextResponse.json(
        { ok: false, error: "update_failed" },
        { status: 500 }
      );
    }

    // history insert
    await supa.from("OrderStatusHistory").insert({
      OrderId: orderId,
      OldStatus: oldOrder.Status,
      NewStatus: newStatus,
      Note: remarks,
      ChangedBy: changedBy,
      ChangedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
