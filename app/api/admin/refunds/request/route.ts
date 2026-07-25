export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function supabaseServer() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function refundNumber(orderId: string) {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = `${now.getTime()}`.slice(-6);
  const orderSuffix = orderId.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
  return `RF-${date}-${orderSuffix || suffix}-${suffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, error: { message: "Valid JSON body is required" } },
        { status: 400 },
      );
    }

    const orderId = cleanText(body.orderId ?? body.OrderId);
    const reason = cleanText(body.reason ?? body.RefundReason);
    const remarks = cleanText(body.remarks ?? body.AdminRemarks);
    const requestedAmount = numberValue(
      body.requestedAmount ?? body.RefundAmount,
    );


    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: { message: "orderId is required" } },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        { ok: false, error: { message: "reason is required" } },
        { status: 400 },
      );
    }

    if (requestedAmount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "requestedAmount must be greater than zero" },
        },
        { status: 400 },
      );
    }

    const supabase = supabaseServer();
    const { data: order, error: orderError } = await supabase
      .from("Orders")
      .select("*")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json(
        { ok: false, error: { message: orderError.message } },
        { status: 500 },
      );
    }

    if (!order) {
      return NextResponse.json(
        { ok: false, error: { message: "Order not found" } },
        { status: 404 },
      );
    }

    const paidAmount = Math.max(
      0,
      numberValue(order.PPDAmount) ||
        numberValue(order.PaidAmount) ||
        numberValue(order.TotalAmount),
    );

    if (requestedAmount > paidAmount) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: `Refund amount cannot exceed paid/order amount Rs ${paidAmount}`,
          },
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      OrderId: orderId,
      RefundNo: refundNumber(orderId),
      RestroCode: order.RestroCode ?? null,
      RestroName: order.RestroName ?? null,
      StationCode: order.StationCode ?? null,
      StationName: order.StationName ?? null,
      CustomerName: order.CustomerName ?? null,
      CustomerMobile: order.CustomerMobile ?? null,
      PaymentMode: cleanText(order.PaymentMode) || "COD",
      PaidAmount: paidAmount,
      RefundAmount: requestedAmount,
      OrderStatus: cleanText(order.Status) || null,
      OrderSubStatus: cleanText(order.SubStatus) || reason,
      RefundReason: reason,
      RefundStatus: "Pending",
      AdminRemarks: remarks || null,
      UpdatedAt: now,
    };

    const { data: existing, error: findError } = await supabase
      .from("OrderRefunds")
      .select("*")
      .eq("OrderId", orderId)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { ok: false, error: { message: findError.message } },
        { status: 500 },
      );
    }

    if (existing) {
      const existingStatus = cleanText(existing.RefundStatus).toLowerCase();
      if (["approved", "processing", "success"].includes(existingStatus)) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: `Refund already exists with status ${existing.RefundStatus}`,
            },
          },
          { status: 409 },
        );
      }

      const updatePayload = { ...payload };
      delete updatePayload.RefundNo;

      let updateQuery = supabase.from("OrderRefunds").update(updatePayload);
      updateQuery =
        existing.RefundId != null
          ? updateQuery.eq("RefundId", existing.RefundId)
          : updateQuery.eq("OrderId", orderId);

      const { data, error } = await updateQuery.select("*").maybeSingle();
      if (error) {
        return NextResponse.json(
          { ok: false, error: { message: error.message } },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { ok: true, created: false, refund: data },
        { status: 200 },
      );
    }

    const { data, error } = await supabase
      .from("OrderRefunds")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: { message: error.message } },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, created: true, refund: data },
      { status: 201 },
    );
  } catch (error) {
    console.error("admin refund request POST error", error);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Refund request could not be created",
        },
      },
      { status: 500 },
    );
  }
}
