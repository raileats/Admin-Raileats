export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { serviceClient } from "../../../../../lib/supabaseServer";
import { syncRestroRDSForOrder } from "../../../../../lib/restroRds";

type AnyRow = Record<string, any>;

const NEXT_STATUS: Record<string, string> = {
  Booked: "In Verification",
  "In Verification": "New Order",
  "New Order": "In Kitchen",
  "In Kitchen": "Out for Delivery",
  "Out for Delivery": "Delivered",
};

const PENALTY_REASONS: Record<string, number> = {
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
  "Bad Delivery": 50,
};

function cleanText(value: any) {
  return String(value ?? "").trim();
}

function cleanSubStatus(value: any) {
  return cleanText(value).replace(/\s*\(Delivered\)\s*$/i, "").trim();
}

function normalizeStatus(value: any) {
  const raw = cleanText(value);
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");

  if (key === "booked") return "Booked";
  if (key === "inverification" || key === "verification") return "In Verification";
  if (key === "cancellationrequest") return "Cancellation Request";
  if (key === "neworder") return "New Order";
  if (key === "inkitchen") return "In Kitchen";
  if (key === "outfordelivery") return "Out for Delivery";
  if (key === "delivered") return "Delivered";
  if (key === "cancelled" || key === "canceled") return "Cancelled";
  if (key === "notdelivered") return "Not Delivered";
  if (key === "baddelivery") return "Bad Delivery";

  return raw;
}

function toNumber(value: any, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function isPenaltyStage(status: string) {
  return status === "In Kitchen" || status === "Out for Delivery";
}

function resolveActor(body: AnyRow) {
  const isAuto =
    body?.actionSource === "auto" ||
    body?.actorType === "Auto" ||
    body?.type === "Auto" ||
    body?.isAuto === true;

  const name = cleanText(
    body?.actorName ||
      body?.userName ||
      body?.currentUserName ||
      body?.adminName ||
      body?.restroUserName ||
      body?.name ||
      (isAuto ? "System" : "Admin")
  );

  const type = cleanText(
    body?.actorType ||
      body?.userType ||
      body?.role ||
      body?.actionSource ||
      (isAuto ? "Auto" : "Admin")
  );

  return {
    name,
    type,
    changedBy: `${name}${type ? ` ${type}` : ""}`.trim(),
  };
}

function resolveTargetStatus(currentStatus: string, body: AnyRow) {
  const rawSubStatus =
    body?.SubStatus ||
    body?.subStatus ||
    body?.outcomeStatus ||
    body?.reason ||
    body?.markStatus;

  const subStatus = cleanSubStatus(rawSubStatus);

  const explicitStatus =
    body?.Status ||
    body?.status ||
    body?.nextStatus ||
    body?.targetStatus ||
    body?.order_status;

  let targetStatus = explicitStatus ? normalizeStatus(explicitStatus) : "";

  if (!targetStatus && subStatus && isPenaltyStage(currentStatus)) {
    if (subStatus === "Partial Delivery" || subStatus === "Bad Delivery") {
      targetStatus = "Delivered";
    } else {
      targetStatus = "Not Delivered";
    }
  }

  if (!targetStatus) {
    targetStatus = NEXT_STATUS[currentStatus] || currentStatus;
  }

  return {
    targetStatus,
    subStatus,
  };
}

function resolvePenalty(currentStatus: string, targetStatus: string, subStatus: string, body: AnyRow, existing: AnyRow) {
  if (!isPenaltyStage(currentStatus)) {
    return toNumber(existing?.OrderPenalty, 0);
  }

  if (subStatus === "Partial Delivery") {
    return toNumber(
      body?.OrderPenalty ??
        body?.orderPenalty ??
        body?.penaltyAmount ??
        body?.vendorPenalty ??
        body?.manualPenalty ??
        body?.partialPenalty,
      0
    );
  }

  if (Object.prototype.hasOwnProperty.call(PENALTY_REASONS, subStatus)) {
    return PENALTY_REASONS[subStatus];
  }

  if (targetStatus === "Delivered") {
    return 0;
  }

  return toNumber(
    body?.OrderPenalty ?? body?.orderPenalty ?? existing?.OrderPenalty,
    0
  );
}

async function insertStatusHistory(orderId: string, payload: AnyRow) {
  const attempts = [
    {
      OrderId: orderId,
      PreviousStatus: payload.previousStatus,
      Status: payload.status,
      SubStatus: payload.subStatus || null,
      Remarks: payload.remarks || null,
      ChangedBy: payload.actor.changedBy,
      ChangedByName: payload.actor.name,
      ChangedByType: payload.actor.type,
      ActionType: payload.actionType,
      CreatedAt: payload.now,
    },
    {
      order_id: orderId,
      previous_status: payload.previousStatus,
      status: payload.status,
      sub_status: payload.subStatus || null,
      remarks: payload.remarks || null,
      changed_by: payload.actor.changedBy,
      action_type: payload.actionType,
      created_at: payload.now,
    },
  ];

  for (let index = 0; index < attempts.length; index += 1) {
    const { error } = await serviceClient
      .from("OrderStatusHistory")
      .insert(attempts[index]);

    if (!error) return;

    if (index === attempts.length - 1) {
      console.error("ORDER STATUS HISTORY INSERT ERROR:", error);
    }
  }
}

async function updateOrderStatus(orderId: string, body: AnyRow) {
  const { data: existingOrder, error: fetchError } = await serviceClient
    .from("Orders")
    .select("*")
    .eq("OrderId", orderId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "order_fetch_failed",
        details: fetchError.message,
      },
      { status: 500 }
    );
  }

  if (!existingOrder) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "order_not_found",
      },
      { status: 404 }
    );
  }

  const previousStatus = normalizeStatus(existingOrder.Status);
  const { targetStatus, subStatus } = resolveTargetStatus(previousStatus, body);

  const remarks = cleanText(
    body?.Remarks ||
      body?.remarks ||
      body?.remark ||
      body?.AdminRemarks ||
      body?.adminRemarks ||
      ""
  );

  const now = new Date().toISOString();
  const actor = resolveActor(body);
  const orderPenalty = resolvePenalty(
    previousStatus,
    targetStatus,
    subStatus,
    body,
    existingOrder as AnyRow
  );

  const updatePayload: AnyRow = {
    Status: targetStatus,
    UpdatedAt: now,
  };

  if (subStatus) {
    updatePayload.SubStatus = subStatus;
  }

  if (remarks) {
    updatePayload.Remarks = remarks;
  }

  if (isPenaltyStage(previousStatus)) {
    updatePayload.OrderPenalty = orderPenalty;
  }

  const { data: updatedOrder, error: updateError } = await serviceClient
    .from("Orders")
    .update(updatePayload)
    .eq("OrderId", orderId)
    .select("*")
    .maybeSingle();

  if (updateError) {
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

  await insertStatusHistory(orderId, {
    previousStatus,
    status: targetStatus,
    subStatus,
    remarks,
    actor,
    actionType: body?.actionType || "STATUS_CHANGE",
    now,
  });

  const rdsResult = await syncRestroRDSForOrder(
    orderId,
    updatedOrder || {
      ...(existingOrder as AnyRow),
      ...updatePayload,
    }
  );

  if (!rdsResult.ok) {
    console.error("RESTRO RDS SYNC ERROR:", rdsResult);
  }

  return NextResponse.json({
    ok: true,
    success: true,
    order: updatedOrder,
    data: updatedOrder,
    rds: rdsResult,
  });
}

export async function PATCH(
  request: Request,
  context: { params: { orderId: string } }
) {
  try {
    const orderId = decodeURIComponent(context.params.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "missing_order_id",
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    return updateOrderStatus(orderId, body || {});
  } catch (error) {
    console.error("ORDER STATUS API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "server_error",
        details: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { orderId: string } }
) {
  return PATCH(request, context);
}
