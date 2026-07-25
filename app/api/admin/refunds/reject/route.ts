export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { rejectRefund, type RefundActor } from "@/lib/refund";

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

    const remarks = cleanText(
      payload.remarks ??
        payload.reason ??
        payload.FailureReason ??
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

    if (!remarks) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "Rejection remarks are required",
          },
        },
        { status: 400 },
      );
    }

    const result = await rejectRefund({
      orderId,
      remarks,
      actor,
    });

    if (!result.ok) {
      return NextResponse.json(result, {
        status: getHttpStatus(result.error.code),
      });
    }

    return NextResponse.json({
      ok: true,
      rejected: true,
      refund: result.data,
      data: result.data,
    });
  } catch (error) {
    console.error("admin refund reject POST error", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DATABASE_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Refund could not be rejected",
        },
      },
      { status: 500 },
    );
  }
}
