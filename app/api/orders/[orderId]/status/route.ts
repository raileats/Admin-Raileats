export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serviceClient } from "../../../../../lib/supabaseServer";
import { syncRestroRdsForOrder } from "../../../../../lib/restroRds";

type RouteContext = {
  params: {
    orderId: string;
  };
};

type AnyOrder = Record<string, any>;

const NEXT_STATUS: Record<string, string> = {
  Booked: "In Verification",
  "In Verification": "New Order",
  "New Order": "In Kitchen",
  "In Kitchen": "Out for Delivery",
  "Out for Delivery": "Delivered",
};

const FINAL_RDS_STATUSES = new Set([
  "Delivered",
  "Cancelled",
  "Canceled",
  "Not Delivered",
  "Bad Delivery",
]);

const DELIVERED_OUTCOMES = new Set(["BAD DELIVERY", "PARTIAL DELIVERY"]);

const PENALTY_REASONS: Record<string, number> = {
  "CUSTOMER PLAN CHANGE": 0,
  "CUSTOMER CALL NOT CONNECT": 0,
  "CUSTOMER NOT ON SEAT": 0,
  "CUSTOMER REFUSED DELIVERY": 0,
  "RESTRO CLOSED": 100,
  "TRAIN LATE": 0,
  "TRAIN DIVERT": 0,
  "ITEM ISSUE": 100,
  "RESTRO REFUSED WITHOUT REASON": 100,
  OTHER: 0,
  "LOW & ORDER": 0,
  "NATURAL CALAMITY": 0,
  "BAD DELIVERY": 50,
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function money(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : fallback;
}

function normalizeKey(value: unknown) {
  return text(value)
    .replace(/\s*\(Delivered\)\s*/gi, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function canonicalStatus(value: unknown) {
  const raw = text(value);
  const key = raw.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();

  const map: Record<string, string> = {
    booked: "Booked",
    verification: "In Verification",
    "in verification": "In Verification",
    inverification: "In Verification",
    neworder: "New Order",
    "new order": "New Order",
    inkitchen: "In Kitchen",
    "in kitchen": "In Kitchen",
    outfordelivery: "Out for Delivery",
    "out for delivery": "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    notdelivered: "Not Delivered",
    "not delivered": "Not Delivered",
    baddelivery: "Bad Delivery",
    "bad delivery": "Bad Delivery",
    cancellationrequest: "Cancellation Request",
    "cancellation request": "Cancellation Request",
  };

  return map[key] || raw;
}

function getBodyValue(body: any, keys: string[]) {
  for (const key of keys) {
    if (body?.[key] !== undefined && body?.[key] !== null && body?.[key] !== "") {
      return body[key];
    }
  }
  return "";
}

function resolveSubStatus(body: any) {
  return text(
    getBodyValue(body, [
      "SubStatus",
      "subStatus",
      "sub_status",
      "reason",
      "Reason",
      "cancelReason",
      "outcomeStatus",
      "outcome",
    ])
  );
}

function resolveRemarks(body: any) {
  return text(
    getBodyValue(body, [
      "Remarks",
      "remarks",
      "remark",
      "Remark",
      "adminRemarks",
      "cancelRemarks",
    ])
  );
}

function resolvePenalty(currentStatus: string, targetStatus: string, subStatus: string, body: any) {
  const fromKitchenOrDelivery =
    currentStatus === "In Kitchen" || currentStatus === "Out for Delivery";

  if (!fromKitchenOrDelivery) {
    return { shouldSave: false, value: undefined as number | undefined };
  }

  const normalizedReason = normalizeKey(subStatus);

  if (normalizedReason === "PARTIAL DELIVERY") {
    return {
      shouldSave: true,
      value: money(
        getBodyValue(body, [
          "OrderPenalty",
          "orderPenalty",
          "penalty",
          "penaltyAmount",
          "manualPenalty",
          "partialAmount",
        ]),
        0
      ),
    };
  }

  if (PENALTY_REASONS[normalizedReason] !== undefined) {
    return {
      shouldSave: true,
      value: money(PENALTY_REASONS[normalizedReason]),
    };
  }

  if (FINAL_RDS_STATUSES.has(targetStatus)) {
    return {
      shouldSave: true,
      value: 0,
    };
  }

  return { shouldSave: false, value: undefined as number | undefined };
}

function resolveTargetStatus(currentStatus: string, subStatus: string, body: any) {
  const explicitStatus = getBodyValue(body, [
    "Status",
    "status",
    "newStatus",
    "nextStatus",
    "toStatus",
    "order_status",
  ]);

  if (explicitStatus) {
    return canonicalStatus(explicitStatus);
  }

  const action = normalizeKey(getBodyValue(body, ["action", "Action"]));
  if (action === "DELIVERED" || action === "MARK AS DELIVERED") return "Delivered";
  if (action === "CANCELLED" || action === "CANCELED" || action === "CANCEL") return "Cancelled";
  if (action === "NOT DELIVERED") return "Not Delivered";

  const normalizedSubStatus = normalizeKey(subStatus);

  if (DELIVERED_OUTCOMES.has(normalizedSubStatus)) {
    return "Delivered";
  }

  if (subStatus && (currentStatus === "In Kitchen" || currentStatus === "Out for Delivery")) {
    return "Not Delivered";
  }

  return NEXT_STATUS[currentStatus] || currentStatus;
}

function shouldSyncRds(targetStatus: string, subStatus: string) {
  if (FINAL_RDS_STATUSES.has(targetStatus)) return true;

  const normalizedSubStatus = normalizeKey(subStatus);
  return normalizedSubStatus === "BAD DELIVERY" || normalizedSubStatus === "PARTIAL DELIVERY";
}

function getActor(body: any) {
  const name =
    text(
      getBodyValue(body, [
        "ActionBy",
        "actionBy",
        "userName",
        "adminName",
        "actorName",
        "updatedBy",
      ])
    ) || "System";

  const type =
    text(
      getBodyValue(body, [
        "ActionType",
        "actionType",
        "userType",
        "actorType",
        "updatedByType",
      ])
    ) || "Admin";

  return { name, type };
}

async function fetchOrder(orderId: string) {
  const { data, error } = await serviceClient
    .from("Orders")
    .select("*")
    .eq("OrderId", orderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as AnyOrder | null;
}

async function writeStatusHistory(params: {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  subStatus: string;
  remarks: string;
  actorName: string;
  actorType: string;
}) {
  const payload = {
    OrderId: params.orderId,
    OldStatus: params.oldStatus,
    NewStatus: params.newStatus,
    Status: params.newStatus,
    SubStatus: params.subStatus || null,
    Remarks: params.remarks || null,
    ActionBy: params.actorName,
    ActionType: params.actorType,
    CreatedAt: new Date().toISOString(),
  };

  const { error } = await serviceClient.from("OrderStatusHistory").insert(payload);

  if (error) {
    console.error("ORDER STATUS HISTORY INSERT ERROR:", error);
  }
}

async function handleStatusChange(req: Request, context: RouteContext) {
  const orderId = decodeURIComponent(context.params.orderId || "");

  if (!orderId) {
    return NextResponse.json(
      { ok: false, error: "missing_order_id" },
      { status: 400 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  try {
    const currentOrder = await fetchOrder(orderId);

    if (!currentOrder) {
      return NextResponse.json(
        { ok: false, error: "order_not_found" },
        { status: 404 }
      );
    }

    const currentStatus = canonicalStatus(currentOrder.Status || currentOrder.order_status);
    const subStatus = resolveSubStatus(body);
    const remarks = resolveRemarks(body);
    const targetStatus = resolveTargetStatus(currentStatus, subStatus, body);
    const actor = getActor(body);

    const penalty = resolvePenalty(currentStatus, targetStatus, subStatus, body);

    const updatePayload: Record<string, any> = {
      Status: targetStatus,
      SubStatus: subStatus || null,
      Remarks: remarks || null,
      UpdatedAt: new Date().toISOString(),
    };

    if (penalty.shouldSave) {
      updatePayload.OrderPenalty = penalty.value ?? 0;
    }

    const projectedOrder = {
      ...currentOrder,
      ...updatePayload,
      OrderId: currentOrder.OrderId || orderId,
    };

    let rdsResult: any = null;
    const needsRds = shouldSyncRds(targetStatus, subStatus);
    const forceWithoutRds = Boolean(
      body?.forceWithoutRds || body?.confirmWithoutRds || body?.skipRdsConfirmation
    );

    if (needsRds) {
      rdsResult = await syncRestroRdsForOrder(projectedOrder);

      if (!rdsResult.ok && !forceWithoutRds) {
        return NextResponse.json(
          {
            ok: false,
            code: "RDS_SYNC_FAILED",
            requiresConfirmation: true,
            message:
              "RestroRDS entry save nahi ho paayi. Kya aap sure hain ki status RDS ke bina update karna hai?",
            details: rdsResult,
            retryWith: {
              forceWithoutRds: true,
            },
          },
          { status: 409 }
        );
      }
    }

    const { data: updatedOrder, error: updateError } = await serviceClient
      .from("Orders")
      .update(updatePayload)
      .eq("OrderId", orderId)
      .select("*")
      .single();

    if (updateError) {
      console.error("ORDER STATUS UPDATE ERROR:", updateError);
      return NextResponse.json(
        {
          ok: false,
          error: "db_update_failed",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    await writeStatusHistory({
      orderId,
      oldStatus: currentStatus,
      newStatus: targetStatus,
      subStatus,
      remarks,
      actorName: actor.name,
      actorType: actor.type,
    });

    return NextResponse.json({
      ok: true,
      success: true,
      order: updatedOrder,
      rds: rdsResult,
      warning:
        needsRds && rdsResult && !rdsResult.ok
          ? "Status updated without RestroRDS after confirmation."
          : null,
    });
  } catch (error) {
    console.error("ORDER STATUS API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  return handleStatusChange(req, context);
}

export async function POST(req: Request, context: RouteContext) {
  return handleStatusChange(req, context);
}
