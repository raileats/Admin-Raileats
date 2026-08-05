// app/api/admin/refunds/request/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requestRefund, type RefundActor } from "@/lib/refund";

function cleanText(value: unknown): string {
  return String(value ?? "").trim();
}

function readActor(value: unknown): RefundActor | null {
  if (!value || typeof value !== "object") return null;

  const actor = value as Record<string, unknown>;

  const userType = cleanText(actor.userType);
  const userName = cleanText(actor.userName);
  const source = cleanText(actor.source);

  if (!userType || !userName || !source) {
    return null;
  }

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

    case "INVALID_ARGUMENT":
    case "INVALID_AMOUNT":
    case "AMOUNT_EXCEEDS_PAID_AMOUNT":
    case "ORDER_NOT_ELIGIBLE":
    case "UNSUPPORTED_PAYMENT_MODE":
    case "COD_MANUAL_APPROVAL_REQUIRED":
    case "INVALID_REFUND_STATE":
      return 400;

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

    const requestedAmount = Number(
      payload.requestedAmount ?? payload.RefundAmount,
    );

    const reason = cleanText(
      payload.reason ??
        payload.RefundReason ??
        payload.subStatus ??
        "Manual Refund",
    );

    const remarks = cleanText(
      payload.remarks ??
        payload.RefundRemarks ??
        payload.AdminRemarks,
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

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "requestedAmount must be greater than zero",
          },
        },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "reason is required",
          },
        },
        { status: 400 },
      );
    }

    const result = await requestRefund({
      orderId,
      requestedAmount,
      reason,
      remarks: remarks || undefined,
      actor,
    });

    if (result.ok === false) {
      return NextResponse.json(result, {
        status: getHttpStatus(result.error.code),
      });
    }

    return NextResponse.json(
      {
        ok: true,
        created: true,
        refund: result.data,
        data: result.data,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("admin refund request POST error", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DATABASE_ERROR",
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
