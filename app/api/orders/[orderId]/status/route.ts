export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serviceClient } from "../../../../../lib/supabaseServer";

type AnyRecord = Record<string, any>;

type RouteContext = {
  params: {
    orderId: string;
  };
};

const PENALTY_STAGE_KEYS = new Set(["inkitchen", "outfordelivery"]);

const DELIVERED_OUTCOME_REASONS = new Set([
  "Bad Delivery",
  "Partial Delivery",
]);

const NOT_DELIVERED_REASONS = new Set([
  "Customer Plan Change",
  "Customer Call Not Connect",
  "Customer Not on Seat",
  "Customer Refused Delivery",
  "Restro Closed",
  "Train Late",
  "Train Divert",
  "Item Issue",
  "Restro Refused without Reason",
  "Other",
  "Low & Order",
  "Natural Calamity",
]);

const PENALTY_BY_REASON: Record<string, number> = {
  "Partial Delivery": 0,
  "Bad Delivery": 50,
  "Customer Plan Change": 0,
  "Customer Call Not Connect": 0,
  "Customer Not on Seat": 0,
  "Customer Refused Delivery": 0,
  "Restro Closed": 100,
  "Train Late": 0,
  "Train Divert": 0,
  "Item Issue": 100,
  "Restro Refused without Reason": 100,
  Other: 0,
  "Low & Order": 0,
  "Natural Calamity": 0,
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeOrderId(value: unknown) {
  return decodeURIComponent(cleanText(value)).replace(/^#/, "");
}

function normalizeKey(value: unknown) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeOutcome(value: unknown) {
  return cleanText(value).replace(/\s*\(delivered\)\s*$/i, "").trim();
}

function toNumber(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function nullableText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function firstValue(source: AnyRecord, keys: string[]) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  return undefined;
}

function pickExisting(source: AnyRecord, keys: string[]) {
  return firstValue(source, keys);
}

function compactPayload(payload: AnyRecord) {
  const output: AnyRecord = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    output[key] = value;
  }

  return output;
}

function isPenaltyStage(status: unknown) {
  return PENALTY_STAGE_KEYS.has(normalizeKey(status));
}

function resolveFinalStatus(
  requestedStatus: string,
  outcomeStatus: string,
  currentStatus: string
) {
  if (isPenaltyStage(currentStatus) && outcomeStatus) {
    if (DELIVERED_OUTCOME_REASONS.has(outcomeStatus)) {
      return "Delivered";
    }

    if (NOT_DELIVERED_REASONS.has(outcomeStatus)) {
      return "Not Delivered";
    }
  }

  return requestedStatus || currentStatus;
}

function resolvePenalty(
  currentStatus: string,
  outcomeStatus: string,
  body: AnyRecord
) {
  if (!isPenaltyStage(currentStatus) || !outcomeStatus) {
    return null;
  }

  if (outcomeStatus === "Partial Delivery") {
    const manualPenalty = firstValue(body, [
      "OrderPenalty",
      "orderPenalty",
      "penalty",
      "penaltyAmount",
      "vendorPenalty",
      "partialPenalty",
      "amount",
    ]);

    return Math.max(0, toNumber(manualPenalty));
  }

  return PENALTY_BY_REASON[outcomeStatus] ?? 0;
}

function resolveActor(body: AnyRecord) {
  const actorName = cleanText(
    firstValue(body, [
      "actorName",
      "userName",
      "adminName",
      "name",
      "updatedBy",
      "actionBy",
      "changedBy",
    ]) || "System"
  );

  const actorType = cleanText(
    firstValue(body, [
      "actorType",
      "userType",
      "adminType",
      "type",
      "role",
      "actionType",
    ]) || "Admin"
  );

  return {
    actorName,
    actorType,
    actorLabel: `${actorName} ${actorType}`.trim(),
  };
}

async function fetchOrderById(orderId: string) {
  const normalizedId = normalizeOrderId(orderId);

  const firstAttempt = await serviceClient
    .from("Orders")
    .select("*")
    .eq("OrderId", normalizedId)
    .maybeSingle();

  if (firstAttempt.data || firstAttempt.error) {
    return firstAttempt;
  }

  return serviceClient
    .from("Orders")
    .select("*")
    .eq("OrderId", `#${normalizedId}`)
    .maybeSingle();
}

async function insertStatusHistorySafely(params: {
  orderId: string;
  previousStatus: string;
  nextStatus: string;
  subStatus: string | null;
  remarks: string | null;
  actorName: string;
  actorType: string;
  actorLabel: string;
  orderPenalty: number | null;
}) {
  const now = new Date().toISOString();

  const fullPayload = compactPayload({
    OrderId: params.orderId,
    order_id: params.orderId,
    PreviousStatus: params.previousStatus,
    previous_status: params.previousStatus,
    Status: params.nextStatus,
    status: params.nextStatus,
    NewStatus: params.nextStatus,
    new_status: params.nextStatus,
    SubStatus: params.subStatus,
    sub_status: params.subStatus,
    Remarks: params.remarks,
    remarks: params.remarks,
    ActionBy: params.actorLabel,
    action_by: params.actorLabel,
    ActorName: params.actorName,
    actor_name: params.actorName,
    ActorType: params.actorType,
    actor_type: params.actorType,
    OrderPenalty: params.orderPenalty,
    order_penalty: params.orderPenalty,
    CreatedAt: now,
    created_at: now,
  });

  const { error } = await serviceClient
    .from("OrderStatusHistory")
    .insert(fullPayload);

  if (!error) return;

  console.error("ORDER_STATUS_HISTORY_INSERT_ERROR:", error);

  const fallbackPayload = compactPayload({
    OrderId: params.orderId,
    Status: params.nextStatus,
    SubStatus: params.subStatus,
    Remarks: params.remarks,
    ActionBy: params.actorLabel,
    CreatedAt: now,
  });

  const { error: fallbackError } = await serviceClient
    .from("OrderStatusHistory")
    .insert(fallbackPayload);

  if (fallbackError) {
    console.error("ORDER_STATUS_HISTORY_FALLBACK_ERROR:", fallbackError);
  }
}

function buildRestroRdsPayload(order: AnyRecord) {
  const basePrice = toNumber(
    pickExisting(order, ["BasePrice", "base_price", "basePrice"])
  );

  const restroPrice = toNumber(
    pickExisting(order, ["RestroPrice", "restro_price", "restroPrice"])
  );

  const couponDiscount = toNumber(
    pickExisting(order, ["CouponDiscount", "coupon_discount", "couponDiscount"])
  );

  const restroDiscount = toNumber(
    pickExisting(order, ["RestroDiscount", "restro_discount", "restroDiscount"])
  );

  const reDiscount = toNumber(
    pickExisting(order, ["REDiscount", "re_discount", "raileatsDiscount"])
  );

  const orderPenalty = toNumber(
    pickExisting(order, ["OrderPenalty", "order_penalty", "orderPenalty"])
  );

  const finalTotal = toNumber(
    pickExisting(order, [
      "FinalTotal",
      "TotalAmount",
      "total_amount",
      "final_total",
      "PayableAmount",
    ])
  );

  const paymentMode = cleanText(
    pickExisting(order, ["PaymentMode", "payment_mode", "paymentMode"])
  );

  const paymentStatus = cleanText(
    pickExisting(order, ["PaymentStatus", "payment_status", "paymentStatus"])
  );

  const status = cleanText(pickExisting(order, ["Status", "order_status"]));
  const subStatus = cleanText(pickExisting(order, ["SubStatus", "sub_status"]));

  return {
    OrderId: pickExisting(order, ["OrderId", "order_id", "id"]),
    RestroCode: pickExisting(order, ["RestroCode", "restro_code"]),
    RestroName: pickExisting(order, ["RestroName", "restro_name"]),
    StationCode: pickExisting(order, ["StationCode", "station_code"]),
    StationName: pickExisting(order, ["StationName", "station_name"]),
    DeliveryDate: pickExisting(order, ["DeliveryDate", "arrival_date"]),
    DeliveryTime: pickExisting(order, ["DeliveryTime", "arrival_time"]),
    TrainNumber: pickExisting(order, ["TrainNumber", "train_number"]),
    CustomerName: pickExisting(order, ["CustomerName", "customer_name"]),
    CustomerMobile: pickExisting(order, ["CustomerMobile", "customer_mobile"]),
    Status: status,
    SubStatus: subStatus || null,
    Remarks: pickExisting(order, ["Remarks", "remarks"]),
    PaymentMode: paymentMode || null,
    PaymentStatus: paymentStatus || null,
    BasePrice: basePrice,
    RestroPrice: restroPrice,
    CouponDiscount: couponDiscount,
    RestroDiscount: restroDiscount,
    REDiscount: reDiscount,
    OrderPenalty: orderPenalty,
    FinalTotal: finalTotal,
    PreviousBal: toNumber(pickExisting(order, ["PreviousBal"])) || 0,
    UpdatedAt: new Date().toISOString(),
  };
}

async function syncRestroRdsSafely(order: AnyRecord) {
  try {
    const fullPayload = compactPayload(buildRestroRdsPayload(order));

    if (!fullPayload.OrderId) {
      return;
    }

    const { error } = await serviceClient
      .from("RestroRDS")
      .upsert(fullPayload, { onConflict: "OrderId" });

    if (!error) return;

    console.error("RESTRO_RDS_UPSERT_ERROR:", error);

    const minimalPayload = compactPayload({
      OrderId: fullPayload.OrderId,
      RestroCode: fullPayload.RestroCode,
      RestroName: fullPayload.RestroName,
      StationCode: fullPayload.StationCode,
      StationName: fullPayload.StationName,
      Status: fullPayload.Status,
      SubStatus: fullPayload.SubStatus,
      Remarks: fullPayload.Remarks,
      OrderPenalty: fullPayload.OrderPenalty,
      UpdatedAt: new Date().toISOString(),
    });

    const { error: minimalError } = await serviceClient
      .from("RestroRDS")
      .upsert(minimalPayload, { onConflict: "OrderId" });

    if (!minimalError) return;

    console.error("RESTRO_RDS_MINIMAL_UPSERT_ERROR:", minimalError);

    const safePayload = compactPayload({
      OrderId: fullPayload.OrderId,
      RestroCode: fullPayload.RestroCode,
      RestroName: fullPayload.RestroName,
      StationCode: fullPayload.StationCode,
      Status: fullPayload.Status,
      SubStatus: fullPayload.SubStatus,
      Remarks: fullPayload.Remarks,
    });

    const { error: safeError } = await serviceClient
      .from("RestroRDS")
      .upsert(safePayload, { onConflict: "OrderId" });

    if (safeError) {
      console.error("RESTRO_RDS_SAFE_UPSERT_ERROR:", safeError);
    }
  } catch (error) {
    console.error("RESTRO_RDS_SYNC_ERROR:", error);
  }
}

async function handleStatusChange(request: Request, context: RouteContext) {
  try {
    const orderId = normalizeOrderId(context.params.orderId);

    if (!orderId) {
      return NextResponse.json(
        { ok: false, success: false, error: "missing_order_id" },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as AnyRecord;

    const { data: existingOrder, error: fetchError } = await fetchOrderById(orderId);

    if (fetchError) {
      console.error("ORDER_FETCH_ERROR:", fetchError);
      return NextResponse.json(
        { ok: false, success: false, error: "order_fetch_failed" },
        { status: 500 }
      );
    }

    if (!existingOrder) {
      return NextResponse.json(
        { ok: false, success: false, error: "order_not_found" },
        { status: 404 }
      );
    }

    const currentStatus = cleanText(
      existingOrder.Status || existingOrder.order_status || ""
    );

    const requestedStatus = cleanText(
      firstValue(body, [
        "Status",
        "status",
        "newStatus",
        "targetStatus",
        "order_status",
      ]) || ""
    );

    const outcomeStatus = normalizeOutcome(
      firstValue(body, [
        "SubStatus",
        "subStatus",
        "sub_status",
        "reason",
        "outcome",
        "outcomeStatus",
        "markStatus",
        "mark_status",
      ]) || ""
    );

    const finalStatus = resolveFinalStatus(
      requestedStatus,
      outcomeStatus,
      currentStatus
    );

    if (!finalStatus) {
      return NextResponse.json(
        { ok: false, success: false, error: "missing_status" },
        { status: 400 }
      );
    }

    const remarks = nullableText(
      firstValue(body, ["Remarks", "remarks", "remark", "note", "notes"])
    );

    const resolvedPenalty = resolvePenalty(currentStatus, outcomeStatus, body);

    const { actorName, actorType, actorLabel } = resolveActor(body);

    const updatePayload: AnyRecord = compactPayload({
      Status: finalStatus,
      SubStatus: outcomeStatus || nullableText(body.SubStatus),
      Remarks: remarks,
      UpdatedAt: new Date().toISOString(),
    });

    if (resolvedPenalty !== null) {
      updatePayload.OrderPenalty = resolvedPenalty;
    }

    const actualOrderId = cleanText(existingOrder.OrderId || orderId);

    const { data: updatedRows, error: updateError } = await serviceClient
      .from("Orders")
      .update(updatePayload)
      .eq("OrderId", actualOrderId)
      .select("*");

    if (updateError) {
      console.error("ORDER_STATUS_UPDATE_ERROR:", updateError);
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "db_update_failed",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    const updatedOrder = Array.isArray(updatedRows) && updatedRows.length > 0
      ? updatedRows[0]
      : {
          ...existingOrder,
          ...updatePayload,
        };

    await insertStatusHistorySafely({
      orderId: actualOrderId,
      previousStatus: currentStatus,
      nextStatus: finalStatus,
      subStatus: updatePayload.SubStatus ?? null,
      remarks,
      actorName,
      actorType,
      actorLabel,
      orderPenalty: resolvedPenalty,
    });

    await syncRestroRdsSafely(updatedOrder);

    return NextResponse.json({
      ok: true,
      success: true,
      message: "Order status updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("ORDER_STATUS_ROUTE_ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "server_error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleStatusChange(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleStatusChange(request, context);
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: "method_not_allowed",
    },
    { status: 405 }
  );
}
