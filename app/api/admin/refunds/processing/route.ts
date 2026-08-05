export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  startRefundProcessing,
  type RefundActor,
} from "@/lib/refund";

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function readActor(value: unknown): RefundActor | null {
  if (!value || typeof value !== "object") return null;

  const actor = value as Record<string, unknown>;

  const userType = cleanText(actor.userType);
  const userName = cleanText(actor.userName);
  const source = cleanText(actor.source);

  if (!userType || !userName || !source) return null;

  return {
    userType,
    userName,
    source,
    ip: cleanText(actor.ip) || null,
    device: cleanText(actor.device) || null,
  };
}

function getHttpStatus(code: string): number {
  switch (code) {
    case "ORDER_NOT_FOUND":
    case "REFUND_NOT_FOUND":
      return 404;

    case "DUPLICATE_REFUND":
    case "CONCURRENT_UPDATE":
      return 409;

    case "CONFIGURATION_ERROR":
    case "DATABASE_ERROR":
      return 500;

    default:
      return 400;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "Valid JSON body is required",
          },
        },
        { status: 400 },
      );
    }

    const payload = body as Record<string, unknown>;

    const orderId = cleanText(payload.orderId ?? payload.OrderId);

    const refundMethod = cleanText(
      payload.refundMethod ?? payload.RefundMethod,
    );

    const paymentProvider = cleanText(
      payload.paymentProvider ?? payload.PaymentProvider,
    );

    const gatewayTransactionId = cleanText(
      payload.gatewayTransactionId ??
        payload.GatewayTransactionId,
    );

    const remarks = cleanText(
      payload.remarks ??
        payload.AdminRemarks ??
        "Refund processing started",
    );

    const actor =
      readActor(payload.actor) ??
      ({
        userType: "Admin",
        userName: cleanText(payload.userName) || "Admin",
        source: cleanText(payload.source) || "Admin Panel",
        ip: null,
        device: null,
      } satisfies RefundActor);

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "orderId is required",
          },
        },
        { status: 400 },
      );
    }

    const result = await startRefundProcessing({
  orderId,
  refundMethod: refundMethod || undefined,
  PaymentGateway: paymentProvider || undefined,
  gatewayTransactionId: gatewayTransactionId || undefined,
  remarks: remarks || undefined,
  actor,
});

    if (result.ok === false) {
      return NextResponse.json(result, {
        status: getHttpStatus(result.error.code),
      });
    }

    return NextResponse.json({
      ok: true,
      processing: true,
      refund: result.data,
      data: result.data,
    });
  } catch (error) {
    console.error("admin refund processing POST error", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DATABASE_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Refund processing could not be started",
        },
      },
      { status: 500 },
    );
  }
}
