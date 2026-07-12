export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeStatus(value: any) {
  const raw = cleanText(value);
  if (!raw) return null;

  const key = raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const aliases: Record<string, string> = {
    booked: "Booked",

    verification: "In Verification",
    inverification: "In Verification",

    cancellationrequest: "Cancellation Request",

    neworder: "New Order",
    inkitchen: "In Kitchen",
    outfordelivery: "Out for Delivery",

    delivered: "Delivered",

    cancelled: "Cancelled",
    canceled: "Cancelled",

    notdelivered: "Not Delivered",
    baddelivery: "Bad Delivery",
    partialdelivery: "Partial Delivery",
  };

  return aliases[key] || raw;
}

function normalizeNumber(
  value: any,
  fallback: number | null = null
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const numericValue = Number(
    String(value).replace(/[^\d.-]/g, "")
  );

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return numericValue;
}

function normalizePenalty(value: any) {
  const numericValue = normalizeNumber(value, null);

  if (numericValue === null) {
    return null;
  }

  if (numericValue < 0) {
    return 0;
  }

  return numericValue;
}

function readOrderPenalty(body: any) {
  const directValue =
    body.OrderPenalty ??
    body.orderPenalty ??
    body.VendorPenalty ??
    body.vendorPenalty ??
    body.vendorPenaltyAmount ??
    body.VendorPenaltyAmount ??
    body.penalty ??
    body.Penalty;

  const parsedDirectValue =
    normalizePenalty(directValue);

  if (parsedDirectValue !== null) {
    return parsedDirectValue;
  }

  const subStatus =
    cleanText(
      body.subStatus ??
        body.SubStatus
    ) || "";

  const key = subStatus
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const penaltyBySubStatus: Record<
    string,
    number
  > = {
    partialdelivery: 0,
    baddelivery: 50,

    customerplanchange: 0,
    customercallnotconnect: 0,
    customernotonseat: 0,
    customerrefuseddelivery: 0,

    deliveryboymissed: 100,
    restroclosed: 100,

    trainlate: 0,
    traindivert: 0,

    itemissue: 100,
    restrorefusedwithoutreason: 100,

    other: 0,
    loworder: 0,
    lowandorder: 0,
    naturalcalamity: 0,
  };

  if (key in penaltyBySubStatus) {
    return penaltyBySubStatus[key];
  }

  return null;
}

function normalizeKey(value: any) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateFinalIGST(
  existing: any,
  newStatus: string,
  subStatus: string | null,
  orderPenalty: number
) {
  const statusKey = normalizeKey(newStatus);
  const subStatusKey = normalizeKey(subStatus);

  const commission = Math.max(
    0,
    normalizeNumber(
      existing?.Commission ??
        existing?.commission,
      0
    ) || 0
  );

  const penalty = Math.max(
    0,
    normalizeNumber(orderPenalty, 0) || 0
  );

  /*
   * Cancelled / Not Delivered:
   * IGST sirf OrderPenalty ke 18% par lagega.
   * Commission include nahi hogi.
   */
  const isCancelled =
    statusKey === "cancelled" ||
    statusKey === "canceled";

  const isNotDelivered =
    statusKey === "notdelivered";

  if (isCancelled || isNotDelivered) {
    return roundMoney(
      penalty * 0.18
    );
  }

  /*
   * Delivered / Bad Delivery / Partial Delivery:
   * IGST = (Commission + OrderPenalty) × 18%
   *
   * Current admin flow me Bad Delivery aur
   * Partial Delivery aksar:
   *
   * Status = Delivered
   * SubStatus = Bad Delivery / Partial Delivery
   *
   * ke form me save hote hain.
   */
  const isDelivered =
    statusKey === "delivered";

  const isBadDelivery =
    statusKey === "baddelivery" ||
    subStatusKey === "baddelivery";

  const isPartialDelivery =
    statusKey === "partialdelivery" ||
    subStatusKey === "partialdelivery";

  if (
    isDelivered ||
    isBadDelivery ||
    isPartialDelivery
  ) {
    return roundMoney(
      (commission + penalty) * 0.18
    );
  }

  /*
   * Booked, In Verification, Cancellation Request,
   * New Order, In Kitchen, Out for Delivery:
   * IGST update nahi hoga.
   */
  return null;
}

function pickStatusColumn(row: any) {
  const candidates = [
    "OrderStatus",
    "Status",
    "CurrentStatus",
    "OrderCurrentStatus",
    "orderStatus",
    "status",
  ];

  return (
    candidates.find(
      (key) =>
        row &&
        row[key] !== undefined
    ) || "Status"
  );
}

function missingColumnName(
  message: string
) {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" of relation/i,
    /column "([^"]+)" does not exist/i,
    /record "new" has no field "([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

async function findOrder(
  supabase: any,
  orderId: string
) {
  const idColumns = [
    "OrderId",
    "id",
    "orderId",
    "order_id",
  ];

  for (const column of idColumns) {
    const { data, error } =
      await supabase
        .from("Orders")
        .select("*")
        .eq(column, orderId)
        .maybeSingle();

    if (data) {
      return {
        row: data,
        idColumn: column,
        error: null,
      };
    }

    if (error) {
      const missing =
        missingColumnName(
          error.message || ""
        );

      if (missing === column) {
        continue;
      }

      return {
        row: null,
        idColumn: column,
        error,
      };
    }
  }

  return {
    row: null,
    idColumn: "OrderId",
    error: null,
  };
}

async function updateOrderStatus(
  supabase: any,
  idColumn: string,
  orderId: string,
  existing: any,
  newStatus: string,
  subStatus: string | null,
  changedAt: string,
  orderPenalty: number,
  finalIGST: number | null
) {
  const statusColumn =
    pickStatusColumn(existing);

  const payload: Record<string, any> = {
    [statusColumn]: newStatus,
  };

  if (
    existing.SubStatus !== undefined
  ) {
    payload.SubStatus = subStatus;
  }

  if (
    existing.subStatus !== undefined
  ) {
    payload.subStatus = subStatus;
  }

  if (
    existing.OrderSubStatus !== undefined
  ) {
    payload.OrderSubStatus =
      subStatus;
  }

  if (
    existing.UpdatedAt !== undefined
  ) {
    payload.UpdatedAt = changedAt;
  }

  if (
    existing.updated_at !== undefined
  ) {
    payload.updated_at = changedAt;
  }

  if (
    existing.LastModified !== undefined
  ) {
    payload.LastModified =
      changedAt;
  }

  /*
   * Penalty ka exact Orders table column:
   * OrderPenalty
   */
  payload.OrderPenalty =
    orderPenalty;

  /*
   * IGST sirf final result mark hone par
   * calculate/update hoga.
   *
   * Intermediate stages me existing IGST
   * ko touch nahi kiya jayega.
   */
  if (finalIGST !== null) {
    payload.IGST = finalIGST;
  }

  return supabase
    .from("Orders")
    .update(payload)
    .eq(idColumn, orderId)
    .select("*");
}

async function insertHistoryBestEffort(
  supabase: any,
  payload: Record<string, any>
) {
  let attempt = { ...payload };

  for (
    let i = 0;
    i < 16;
    i += 1
  ) {
    const { data, error } =
      await supabase
        .from("OrderStatusHistory")
        .insert(attempt)
        .select("*")
        .maybeSingle();

    if (!error) {
      return {
        data,
        error: null,
      };
    }

    const missing =
      missingColumnName(
        error.message || ""
      );

    if (
      !missing ||
      !(missing in attempt)
    ) {
      return {
        data: null,
        error,
      };
    }

    const nextAttempt = {
      ...attempt,
    };

    delete nextAttempt[missing];
    attempt = nextAttempt;
  }

  return {
    data: null,
    error: {
      message:
        "Unable to insert status history with available columns",
    },
  };
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      orderId?: string;
      id?: string;
    };
  }
) {
  try {
    const orderId =
      decodeURIComponent(
        String(
          params.orderId ??
            params.id ??
            ""
        )
      ).trim();

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Order id is required",
        },
        { status: 400 }
      );
    }

    const body = await req
      .json()
      .catch(() => ({}));

    const newStatus =
      normalizeStatus(
        body.newStatus ??
          body.NewStatus ??
          body.status ??
          body.Status ??
          body.orderStatus ??
          body.OrderStatus
      );

    if (!newStatus) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "New status is required",
        },
        { status: 400 }
      );
    }

    const supabase =
      supabaseServer();

    const {
      row: existing,
      idColumn,
      error: findError,
    } = await findOrder(
      supabase,
      orderId
    );

    if (findError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            findError.message ||
            "Failed to load order",
        },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Order not found: ${orderId}`,
        },
        { status: 404 }
      );
    }

    const changedAt =
      new Date().toISOString();

    const statusColumn =
      pickStatusColumn(existing);

    const oldStatus =
      cleanText(
        existing[statusColumn]
      );

    const subStatus =
      cleanText(
        body.subStatus ??
          body.SubStatus
      );

    const remarks =
      cleanText(
        body.remarks ??
          body.Remarks
      );

    const note =
      cleanText(
        body.note ??
          body.Note ??
          remarks ??
          subStatus
      );

    const userType =
      cleanText(
        body.userType ??
          body.UserType
      ) || "Admin";

    const userName =
      cleanText(
        body.userName ??
          body.UserName ??
          body.changedBy ??
          body.ChangedBy
      ) || "Admin";

    const actionSource =
      cleanText(
        body.actionSource ??
          body.ActionSource
      ) || userType;

    /*
     * Frontend se penalty aaye to wahi use hogi.
     * Frontend penalty na bheje to existing
     * Orders.OrderPenalty preserve/use hogi.
     */
    const requestedPenalty =
      readOrderPenalty(body);

    const existingPenalty =
      normalizePenalty(
        existing.OrderPenalty
      );

    const orderPenalty =
      requestedPenalty !== null
        ? requestedPenalty
        : existingPenalty !== null
        ? existingPenalty
        : 0;

    /*
     * IGST rules:
     *
     * Delivered / Bad Delivery / Partial Delivery:
     * (Commission + OrderPenalty) × 18%
     *
     * Cancelled / Not Delivered:
     * OrderPenalty × 18%
     *
     * Other stages:
     * IGST update nahi hoga.
     */
    const finalIGST =
      calculateFinalIGST(
        existing,
        newStatus,
        subStatus,
        orderPenalty
      );

    const {
      data: updatedRows,
      error: updateError,
    } = await updateOrderStatus(
      supabase,
      idColumn,
      orderId,
      existing,
      newStatus,
      subStatus,
      changedAt,
      orderPenalty,
      finalIGST
    );

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            updateError.message ||
            "Failed to update order",
        },
        { status: 500 }
      );
    }

    if (
      !updatedRows ||
      updatedRows.length === 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No order row updated",
        },
        { status: 400 }
      );
    }

    const historyPayload: Record<
      string,
      any
    > = {
      OrderId: orderId,

      OldStatus: oldStatus,
      PreviousStatus: oldStatus,

      NewStatus: newStatus,
      Status: newStatus,

      SubStatus: subStatus,

      Remarks: remarks,
      Note: note,

      ChangedBy: userName,
      UserType: userType,
      UserName: userName,
      ActionSource: actionSource,

      OrderPenalty: orderPenalty,

      ChangedAt: changedAt,
      CreatedAt: changedAt,
    };

    /*
     * History table me IGST column ho to save hoga.
     * Column nahi hua to insertHistoryBestEffort
     * IGST field remove karke history save kar dega.
     */
    if (finalIGST !== null) {
      historyPayload.IGST =
        finalIGST;
    }

    const {
      data: historyRow,
      error: historyError,
    } =
      await insertHistoryBestEffort(
        supabase,
        historyPayload
      );

    return NextResponse.json({
      ok: true,

      row: updatedRows[0],

      orderPenalty,

      igst:
        finalIGST !== null
          ? finalIGST
          : updatedRows[0]?.IGST ??
            null,

      igstCalculated:
        finalIGST !== null,

      history: historyRow,

      historyWarning:
        historyError?.message ||
        null,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Internal server error",
      },
      { status: 500 }
    );
  }
}
