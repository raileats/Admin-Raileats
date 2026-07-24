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

  if (!userType || !userName || !source) return null;

  return {
    userType,
    userName,
    source,
    ip: cleanText(actor.ip) || null,
    device: cleanText(actor.device) || null,
  };
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

    const orderId = cleanText(body.orderId);
    const reason = cleanText(body.reason);
    const remarks = cleanText(body.remarks);
    const requestedAmount = Number(body.requestedAmount);
    const actor = readActor(body.actor);

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

    if (!actor) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "Valid actor details are required",
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

    if (!result.ok) {
      const status =
        result.error.code === "ORDER_NOT_FOUND" ||
        result.error.code === "REFUND_NOT_FOUND"
          ? 404
          : result.error.code === "DUPLICATE_REFUND" ||
              result.error.code === "CONCURRENT_UPDATE"
            ? 409
            : result.error.code === "DATABASE_ERROR" ||
                result.error.code === "CONFIGURATION_ERROR"
              ? 500
              : 400;

      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
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
