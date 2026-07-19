// app/api/orders/[orderId]/status/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  checkRestroRdsOrderLocked,
  syncRestroRdsForFinalOrder,
} from "@/lib/restroRds";

import {
  updateOrderJourneySafe,
} from "@/lib/orderJourney";

/* =========================================================
   SUPABASE SERVER CLIENT
   ========================================================= */

function supabaseServer() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

  return createClient(
    url,
    key,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

/* =========================================================
   BASIC HELPERS
   ========================================================= */

function cleanText(value: any) {
  const text =
    String(value ?? "").trim();

  return text || null;
}

function normalizeStatus(value: any) {
  const raw =
    cleanText(value);

  if (!raw) {
    return null;
  }

  const key = raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const aliases: Record<
    string,
    string
  > = {
    booked: "Booked",

    verification:
      "In Verification",

    inverification:
      "In Verification",

    cancellationrequest:
      "Cancellation Request",

    complaints:
      "Complaints",

    complaint:
      "Complaints",

    neworder:
      "New Order",

    inkitchen:
      "In Kitchen",

    outfordelivery:
      "Out for Delivery",

    restromarkeddelivered:
      "Restro Marked Delivered",

    delivered:
      "Delivered",

    cancelled:
      "Cancelled",

    canceled:
      "Cancelled",

    notdelivered:
      "Not Delivered",

    baddelivery:
      "Bad Delivery",

    partialdelivery:
      "Partial Delivery",
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

  const numericValue =
    Number(
      String(value)
        .replace(/[^\d.-]/g, "")
    );

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
    return fallback;
  }

  return numericValue;
}

function normalizePenalty(
  value: any
) {
  const numericValue =
    normalizeNumber(
      value,
      null
    );

  if (
    numericValue === null
  ) {
    return null;
  }

  if (
    numericValue < 0
  ) {
    return 0;
  }

  return numericValue;
}

function normalizeKey(
  value: any
) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}

function roundMoney(
  value: number
) {
  return (
    Math.round(
      value * 100
    ) / 100
  );
}

/* =========================================================
   PENALTY
   ========================================================= */

function readOrderPenalty(
  body: any
) {
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
    normalizePenalty(
      directValue
    );

  if (
    parsedDirectValue !== null
  ) {
    return parsedDirectValue;
  }

  const subStatus =
    cleanText(
      body.subStatus ??
      body.SubStatus
    ) || "";

  const key = subStatus
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );

  const penaltyBySubStatus:
    Record<string, number> = {
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
      restrorefusedwithoutreason:
        100,

      other: 0,
      loworder: 0,
      lowandorder: 0,
      naturalcalamity: 0,
    };

  if (
    key in penaltyBySubStatus
  ) {
    return (
      penaltyBySubStatus[key]
    );
  }

  return null;
}

/* =========================================================
   IGST CALCULATION
   ========================================================= */

function calculateFinalIGST(
  existing: any,
  newStatus: string,
  subStatus: string | null,
  orderPenalty: number
) {
  const statusKey =
    normalizeKey(
      newStatus
    );

  const subStatusKey =
    normalizeKey(
      subStatus
    );

  const commission =
    Math.max(
      0,
      normalizeNumber(
        existing?.Commission ??
        existing?.commission,
        0
      ) || 0
    );

  const penalty =
    Math.max(
      0,
      normalizeNumber(
        orderPenalty,
        0
      ) || 0
    );

  /*
   * Cancelled / Not Delivered:
   *
   * IGST =
   * OrderPenalty × 18%
   */
  const isCancelled =
    statusKey ===
      "cancelled" ||
    statusKey ===
      "canceled";

  const isNotDelivered =
    statusKey ===
      "notdelivered";

  if (
    isCancelled ||
    isNotDelivered
  ) {
    return roundMoney(
      penalty * 0.18
    );
  }

  /*
   * Delivered / Bad Delivery /
   * Partial Delivery:
   *
   * IGST =
   * (Commission + Penalty) × 18%
   */
  const isDelivered =
    statusKey ===
      "delivered";

  const isBadDelivery =
    statusKey ===
      "baddelivery" ||
    subStatusKey ===
      "baddelivery";

  const isPartialDelivery =
    statusKey ===
      "partialdelivery" ||
    subStatusKey ===
      "partialdelivery";

  if (
    isDelivered ||
    isBadDelivery ||
    isPartialDelivery
  ) {
    return roundMoney(
      (
        commission +
        penalty
      ) * 0.18
    );
  }

  /*
   * Intermediate status:
   * IGST update nahi hoga.
   */
  return null;
}

/* =========================================================
   ORDER COLUMN HELPERS
   ========================================================= */

function pickStatusColumn(
  row: any
) {
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

  for (
    const pattern of patterns
  ) {
    const match =
      message.match(
        pattern
      );

    if (
      match?.[1]
    ) {
      return match[1];
    }
  }

  return null;
}

/* =========================================================
   FIND ORDER
   ========================================================= */

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

  for (
    const column of idColumns
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from("Orders")
        .select("*")
        .eq(
          column,
          orderId
        )
        .maybeSingle();

    if (data) {
      return {
        row: data,
        idColumn:
          column,
        error: null,
      };
    }

    if (error) {
      const missing =
        missingColumnName(
          error.message || ""
        );

      if (
        missing === column
      ) {
        continue;
      }

      return {
        row: null,
        idColumn:
          column,
        error,
      };
    }
  }

  return {
    row: null,
    idColumn:
      "OrderId",
    error: null,
  };
}

/* =========================================================
   UPDATE ORDER STATUS
   ========================================================= */

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
    pickStatusColumn(
      existing
    );

  const payload:
    Record<string, any> = {
      [statusColumn]:
        newStatus,
    };

  if (
    existing.SubStatus !==
    undefined
  ) {
    payload.SubStatus =
      subStatus;
  }

  if (
    existing.subStatus !==
    undefined
  ) {
    payload.subStatus =
      subStatus;
  }

  if (
    existing.OrderSubStatus !==
    undefined
  ) {
    payload.OrderSubStatus =
      subStatus;
  }

  if (
    existing.UpdatedAt !==
    undefined
  ) {
    payload.UpdatedAt =
      changedAt;
  }

  if (
    existing.updated_at !==
    undefined
  ) {
    payload.updated_at =
      changedAt;
  }

  if (
    existing.LastModified !==
    undefined
  ) {
    payload.LastModified =
      changedAt;
  }

  /*
   * Exact Orders penalty column.
   */
  payload.OrderPenalty =
    orderPenalty;

  /*
   * Final marking par hi
   * IGST update hoga.
   */
  if (
    finalIGST !== null
  ) {
    payload.IGST =
      finalIGST;
  }

  return supabase
    .from("Orders")
    .update(payload)
    .eq(
      idColumn,
      orderId
    )
    .select("*");
}

/* =========================================================
   PREPAID REFUND HELPERS
   ========================================================= */

function isPrepaidOrder(
  row: any
) {
  const paymentModeKey =
    normalizeKey(
      row?.PaymentMode ??
      row?.paymentMode ??
      row?.payment_mode
    );

  return [
    "ppd",
    "prepaid",
    "online",
    "paidonline",
  ].includes(paymentModeKey);
}

function isRefundEligibleStatus(
  status: any
) {
  const key =
    normalizeKey(status);

  return (
    key === "cancelled" ||
    key === "canceled" ||
    key === "notdelivered"
  );
}

async function upsertRefundBestEffort({
  supabase,
  order,
  newStatus,
  subStatus,
}: {
  supabase: any;
  order: any;
  newStatus: string;
  subStatus: string | null;
}) {
  if (
    !isPrepaidOrder(order) ||
    !isRefundEligibleStatus(newStatus)
  ) {
    return {
      data: null,
      skipped: true,
      warning: null,
    };
  }

  const paidAmount =
    Math.max(
      0,
      normalizeNumber(
        order?.PPDAmount,
        0
      ) ||
      normalizeNumber(
        order?.TotalAmount,
        0
      ) ||
      0
    );

  const normalizedStatus =
    normalizeKey(newStatus) ===
      "notdelivered"
      ? "Not Delivered"
      : "Cancelled";

  const payload = {
    OrderId:
      String(order?.OrderId ?? "")
        .trim(),

    RestroCode:
      normalizeNumber(
        order?.RestroCode,
        0
      ) || 0,

    RestroName:
      cleanText(
        order?.RestroName
      ),

    StationCode:
      cleanText(
        order?.StationCode
      ),

    StationName:
      cleanText(
        order?.StationName
      ),

    CustomerName:
      cleanText(
        order?.CustomerName
      ),

    CustomerMobile:
      cleanText(
        order?.CustomerMobile
      ),

    PaymentMode:
      cleanText(
        order?.PaymentMode
      ) || "PPD",

    PaidAmount:
      paidAmount,

    RefundAmount:
      paidAmount,

    OrderStatus:
      normalizedStatus,

    OrderSubStatus:
      subStatus,

    RefundReason:
      subStatus ||
      (
        normalizedStatus ===
          "Cancelled"
          ? "Order Cancelled"
          : "Order Not Delivered"
      ),
  };

  const {
    data: existingRefund,
    error: findError,
  } =
    await supabase
      .from("OrderRefunds")
      .select("*")
      .eq(
        "OrderId",
        payload.OrderId
      )
      .maybeSingle();

  if (findError) {
    return {
      data: null,
      skipped: false,
      warning:
        findError.message ||
        "Unable to check refund record",
    };
  }

  if (existingRefund) {
    const refundStatus =
      cleanText(
        existingRefund.RefundStatus
      ) || "Pending";

    const updatePayload:
      Record<string, any> = {
        RestroCode:
          payload.RestroCode,

        RestroName:
          payload.RestroName,

        StationCode:
          payload.StationCode,

        StationName:
          payload.StationName,

        CustomerName:
          payload.CustomerName,

        CustomerMobile:
          payload.CustomerMobile,

        PaymentMode:
          payload.PaymentMode,

        PaidAmount:
          payload.PaidAmount,

        OrderStatus:
          payload.OrderStatus,

        OrderSubStatus:
          payload.OrderSubStatus,

        RefundReason:
          payload.RefundReason,
      };

    /*
     * Successful refund amount ko overwrite nahi karenge.
     */
    if (
      normalizeKey(refundStatus) !==
      "success"
    ) {
      updatePayload.RefundAmount =
        payload.RefundAmount;
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("OrderRefunds")
        .update(updatePayload)
        .eq(
          "RefundId",
          existingRefund.RefundId
        )
        .select("*")
        .maybeSingle();

    return {
      data: data || existingRefund,
      skipped: false,
      warning:
        error?.message || null,
    };
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("OrderRefunds")
      .insert({
        ...payload,
        RefundStatus:
          "Pending",
      })
      .select("*")
      .maybeSingle();

  return {
    data,
    skipped: false,
    warning:
      error?.message || null,
  };
}

/* =========================================================
   PATCH
   ========================================================= */

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
    /* =====================================================
       ORDER ID
       ===================================================== */

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
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       REQUEST BODY
       ===================================================== */

    const body =
      await req
        .json()
        .catch(
          () => ({})
        );

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
        {
          status: 400,
        }
      );
    }

    const supabase =
      supabaseServer();

    /* =====================================================
       LOAD ORDER
       ===================================================== */

    const {
      row: existing,
      idColumn,
      error: findError,
    } =
      await findOrder(
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
        {
          status: 500,
        }
      );
    }

    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          error:
            `Order not found: ${orderId}`,
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       RESTRO RDS HARD LOCK CHECK
       ===================================================== */

    /*
     * Bahut important:
     *
     * Ye check Orders table update hone se
     * pehle ho raha hai.
     *
     * Agar RestroRDS me same OrderId mil gaya:
     *
     * - Status update nahi hoga
     * - SubStatus update nahi hoga
     * - Penalty update nahi hogi
     * - IGST update nahi hoga
     * - OrderJourney update nahi hoga
     * - RDS update nahi hogi
     */
    const rdsLock =
      await checkRestroRdsOrderLocked({
        orderId,
      });

    if (
      rdsLock.error
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Unable to verify RestroRDS lock",

          details:
            rdsLock.error,
        },
        {
          status: 500,
        }
      );
    }

    if (
      rdsLock.locked
    ) {
      return NextResponse.json(
        {
          ok: false,
          locked: true,

          error:
            "Unable to mark order. Order already marked.",

          message:
            "Unable to mark order. Order already marked.",

          rds: {
            rdsId:
              rdsLock.row
                ?.RDSId ??
              null,

            orderId:
              rdsLock.row
                ?.OrderId ??
              orderId,

            restroCode:
              rdsLock.row
                ?.RestroCode ??
              null,

            status:
              rdsLock.row
                ?.Status ??
              null,

            subStatus:
              rdsLock.row
                ?.SubStatus ??
              null,

            settlementAmount:
              rdsLock.row
                ?.SettlementAmount ??
              null,

            markedAt:
              rdsLock.row
                ?.CreatedAt ??
              null,
          },
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       STATUS DATA
       ===================================================== */

    const changedAt =
      new Date()
        .toISOString();

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

    /* =====================================================
       PENALTY
       ===================================================== */

    const requestedPenalty =
      readOrderPenalty(
        body
      );

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

    /* =====================================================
       IGST
       ===================================================== */

    const finalIGST =
      calculateFinalIGST(
        existing,
        newStatus,
        subStatus,
        orderPenalty
      );

    /* =====================================================
       UPDATE ORDERS
       ===================================================== */

    const {
      data: updatedRows,
      error: updateError,
    } =
      await updateOrderStatus(
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
        {
          status: 500,
        }
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
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       UPDATE ORDER JOURNEY
       ===================================================== */

    const journeyResult =
      await updateOrderJourneySafe({
        supabase,
        orderId,
        stage: newStatus,
        status: newStatus,
        subStatus,
        remarks,
        userType,
        userName,
        source: actionSource,
        actionAt: changedAt,
        order: {
          restroCode:
            updatedRows[0]
              ?.RestroCode,

          restroName:
            updatedRows[0]
              ?.RestroName,

          stationCode:
            updatedRows[0]
              ?.StationCode,

          stationName:
            updatedRows[0]
              ?.StationName,

          deliveryDate:
            updatedRows[0]
              ?.DeliveryDate,

          deliveryTime:
            updatedRows[0]
              ?.DeliveryTime,
        },
      });

    /* =====================================================
       CREATE RESTRO RDS
       ===================================================== */

    const restroRdsResult =
      await syncRestroRdsForFinalOrder({
        supabase,
        orderId,

        remarks:
          remarks ??
          note ??
          subStatus,
      });

    /*
     * Database hard-lock ne same OrderId reject kiya
     * to response me locked status return hoga.
     *
     * Normal situation me pre-check pehle hi
     * duplicate order ko rok dega.
     */
    if (
      restroRdsResult.locked
    ) {
      return NextResponse.json(
        {
          ok: false,
          locked: true,

          error:
            "Unable to mark order. Order already marked.",

          message:
            "Unable to mark order. Order already marked.",

          restroRds:
            restroRdsResult.data ??
            null,
        },
        {
          status: 409,
        }
      );
    }

    /* =====================================================
       CREATE / UPDATE PREPAID REFUND
       ===================================================== */

    const refundResult =
      await upsertRefundBestEffort({
        supabase,
        order:
          updatedRows[0],
        newStatus,
        subStatus,
      });

    /* =====================================================
       SUCCESS RESPONSE
       ===================================================== */

    return NextResponse.json({
      ok: true,

      row:
        updatedRows[0],

      orderPenalty,

      igst:
        finalIGST !== null
          ? finalIGST
          : updatedRows[0]
              ?.IGST ??
            null,

      igstCalculated:
        finalIGST !== null,

      journey:
        journeyResult,

      journeyWarning:
        journeyResult
          ? null
          : "OrderJourney update failed. Check server logs.",

      restroRds:
        restroRdsResult
          .data ??
        null,

      restroRdsSkipped:
        restroRdsResult
          .skipped ??
        false,

      restroRdsLocked:
        restroRdsResult
          .locked ??
        false,

      restroRdsWarning:
        restroRdsResult
          .warning ??
        null,

      refund:
        refundResult.data ??
        null,

      refundSkipped:
        refundResult.skipped ??
        false,

      refundWarning:
        refundResult.warning ??
        null,
    });
  } catch (
    error: any
  ) {
    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ||
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
