export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type AnyRow = Record<string, any>;

function supabaseServer() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Supabase configuration missing");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeKey(value: unknown) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function normalizeStatus(value: unknown) {
  const key = normalizeKey(value);

  const map: Record<string, string> = {
    booked: "Booked",
    verification: "In Verification",
    inverification: "In Verification",
    neworder: "New Order",
    inkitchen: "In Kitchen",
    outfordelivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    notdelivered: "Not Delivered",
    baddelivery: "Bad Delivery",
    cancellationrequest: "Cancellation Request",
  };

  return map[key] || cleanText(value);
}

const ORDER_PENALTY_RULES: Record<string, number> = {
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

function readOrderPenalty(body: AnyRow, status: string, subStatus: string) {
  const explicit =
    body.OrderPenalty ??
    body.orderPenalty ??
    body.penalty ??
    body.vendorPenalty ??
    body.VendorPenalty;

  if (explicit !== undefined && explicit !== null && explicit !== "") {
    return roundMoney(normalizeNumber(explicit));
  }

  const statusKey = normalizeKey(status);
  const subStatusKey = normalizeKey(subStatus);

  if (
    statusKey === "inkitchen" ||
    statusKey === "outfordelivery" ||
    statusKey === "delivered" ||
    statusKey === "notdelivered" ||
    statusKey === "baddelivery"
  ) {
    return roundMoney(ORDER_PENALTY_RULES[subStatusKey] ?? 0);
  }

  return 0;
}

function pickValue(row: AnyRow, keys: string[], fallback: any = "") {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return fallback;
}

function pickMoney(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];

    if (value !== undefined && value !== null && value !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return roundMoney(parsed);
    }
  }

  return 0;
}

function missingColumnName(error: any) {
  const message = String(error?.message || error?.details || "");

  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column "([^"]+)" does not exist/i,
    /record "new" has no field "([^"]+)"/i,
    /schema cache.*'([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

async function safeUpdate(
  supabase: SupabaseClient,
  tableName: string,
  matchColumn: string,
  matchValue: any,
  payload: AnyRow,
) {
  let currentPayload: AnyRow = { ...payload };

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabase
      .from(tableName)
      .update(currentPayload)
      .eq(matchColumn, matchValue)
      .select("*")
      .maybeSingle();

    if (!error) {
      return { data, error: null };
    }

    const column = missingColumnName(error);

    if (column && Object.prototype.hasOwnProperty.call(currentPayload, column)) {
      const nextPayload: AnyRow = {};

      Object.keys(currentPayload).forEach((key) => {
        if (key !== column) nextPayload[key] = currentPayload[key];
      });

      currentPayload = nextPayload;
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: new Error("Unable to update order after removing unsupported columns"),
  };
}

async function safeInsert(
  supabase: SupabaseClient,
  tableName: string,
  payload: AnyRow,
) {
  let currentPayload: AnyRow = { ...payload };

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabase
      .from(tableName)
      .insert(currentPayload)
      .select("*")
      .maybeSingle();

    if (!error) {
      return { data, error: null };
    }

    const column = missingColumnName(error);

    if (column && Object.prototype.hasOwnProperty.call(currentPayload, column)) {
      const nextPayload: AnyRow = {};

      Object.keys(currentPayload).forEach((key) => {
        if (key !== column) nextPayload[key] = currentPayload[key];
      });

      currentPayload = nextPayload;
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: new Error("Unable to insert after removing unsupported columns"),
  };
}

async function safeUpsertRestroRDS(
  supabase: SupabaseClient,
  payload: AnyRow,
) {
  let currentPayload: AnyRow = { ...payload };

  for (let attempt = 0; attempt < 35; attempt += 1) {
    const { data, error } = await supabase
      .from("RestroRDS")
      .upsert(currentPayload, { onConflict: "OrderId" })
      .select("*")
      .maybeSingle();

    if (!error) {
      return { data, error: null };
    }

    const column = missingColumnName(error);

    if (column && Object.prototype.hasOwnProperty.call(currentPayload, column)) {
      const nextPayload: AnyRow = {};

      Object.keys(currentPayload).forEach((key) => {
        if (key !== column) nextPayload[key] = currentPayload[key];
      });

      currentPayload = nextPayload;
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: new Error("Unable to sync RestroRDS after removing unsupported columns"),
  };
}

async function findOrder(supabase: SupabaseClient, orderId: string) {
  const decodedOrderId = decodeURIComponent(orderId);
  const tableNames = ["Orders", "orders"];
  const searchColumns = ["OrderId", "order_id", "order_number", "id"];

  for (const tableName of tableNames) {
    for (const column of searchColumns) {
      if (column === "id" && Number.isNaN(Number(decodedOrderId))) continue;

      const matchValue = column === "id" ? Number(decodedOrderId) : decodedOrderId;

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq(column, matchValue)
        .maybeSingle();

      if (data && !error) {
        return {
          tableName,
          matchColumn: column,
          matchValue,
          order: data as AnyRow,
        };
      }
    }
  }

  return null;
}

function shouldSyncRestroRDS(status: string, subStatus: string) {
  const statusKey = normalizeKey(status);
  const subStatusKey = normalizeKey(subStatus);

  return (
    statusKey === "delivered" ||
    statusKey === "cancelled" ||
    statusKey === "canceled" ||
    statusKey === "notdelivered" ||
    statusKey === "baddelivery" ||
    subStatusKey === "baddelivery" ||
    subStatusKey === "partialdelivery"
  );
}

async function getPreviousRestroBalance(
  supabase: SupabaseClient,
  restroCode: string,
  orderId: string,
) {
  if (!restroCode) return 0;

  const { data, error } = await supabase
    .from("RestroRDS")
    .select("ClosingBal")
    .eq("RestroCode", restroCode)
    .neq("OrderId", orderId)
    .order("RDSId", { ascending: false })
    .limit(1);

  if (error || !Array.isArray(data) || data.length === 0) {
    return 0;
  }

  return roundMoney(normalizeNumber(data[0]?.ClosingBal));
}

function calculateSettlement(
  row: AnyRow,
  status: string,
  subStatus: string,
  orderPenalty: number,
  previousBal: number,
) {
  const statusKey = normalizeKey(status);
  const subStatusKey = normalizeKey(subStatus);

  const basePrice = pickMoney(row, [
    "BasePrice",
    "base_price",
    "Subtotal",
    "subtotal",
    "SubTotal",
    "ItemTotal",
    "item_total",
  ]);

  const restroPrice =
    pickMoney(row, ["RestroPrice", "restro_price"]) ||
    basePrice ||
    pickMoney(row, ["TotalAmount", "total_amount", "FinalTotal", "final_total"]);

  const couponDiscount = pickMoney(row, [
    "CouponDiscount",
    "coupon_discount",
    "DiscountAmount",
    "discount_amount",
  ]);

  const restroDiscount = pickMoney(row, [
    "RestroDiscount",
    "restro_discount",
  ]);

  const reDiscount = pickMoney(row, [
    "REDiscount",
    "re_discount",
  ]);

  const gstAmount = pickMoney(row, [
    "GST",
    "GstAmount",
    "gst_amount",
    "TaxAmount",
    "tax_amount",
  ]);

  const convenienceFee = pickMoney(row, [
    "ConvenienceFee",
    "convenience_fee",
    "PlatformFee",
    "platform_fee",
  ]);

  let settlementAmount = 0;

  if (
    statusKey === "delivered" ||
    subStatusKey === "baddelivery" ||
    subStatusKey === "partialdelivery"
  ) {
    settlementAmount = restroPrice - restroDiscount - orderPenalty;
  } else if (
    statusKey === "cancelled" ||
    statusKey === "canceled" ||
    statusKey === "notdelivered" ||
    statusKey === "baddelivery"
  ) {
    settlementAmount = 0 - orderPenalty;
  }

  settlementAmount = roundMoney(settlementAmount);
  const closingBal = roundMoney(previousBal + settlementAmount);

  return {
    basePrice: roundMoney(basePrice),
    restroPrice: roundMoney(restroPrice),
    couponDiscount: roundMoney(couponDiscount),
    restroDiscount: roundMoney(restroDiscount),
    reDiscount: roundMoney(reDiscount),
    gstAmount: roundMoney(gstAmount),
    convenienceFee: roundMoney(convenienceFee),
    settlementAmount,
    closingBal,
  };
}

async function syncRestroRDS(
  supabase: SupabaseClient,
  order: AnyRow,
  status: string,
  subStatus: string,
  remarks: string,
  orderPenalty: number,
) {
  if (!shouldSyncRestroRDS(status, subStatus)) {
    return { ok: true, skipped: true, reason: "status_not_settlement_stage" };
  }

  const orderId = cleanText(
    pickValue(order, ["OrderId", "order_id", "order_number", "id"]),
  );

  const restroCode = cleanText(
    pickValue(order, ["RestroCode", "restro_code", "OutletId", "outlet_id"]),
  );

  if (!orderId || !restroCode) {
    return { ok: true, skipped: true, reason: "missing_order_or_restro_code" };
  }

  const previousBal = await getPreviousRestroBalance(
    supabase,
    restroCode,
    orderId,
  );

  const financials = calculateSettlement(
    order,
    status,
    subStatus,
    orderPenalty,
    previousBal,
  );

  const now = new Date().toISOString();

  const payload: AnyRow = {
    RestroCode: restroCode,
    OrderId: orderId,
    RestroName: cleanText(
      pickValue(order, ["RestroName", "restro_name", "OutletName", "outlet_name"]),
    ),
    StationCode: cleanText(pickValue(order, ["StationCode", "station_code"])),
    StationName: cleanText(pickValue(order, ["StationName", "station_name"])),
    Status: normalizeStatus(status),
    SubStatus: cleanText(subStatus),
    Remarks: cleanText(remarks),
    DeliveryDate: pickValue(order, [
      "DeliveryDate",
      "delivery_date",
      "ArrivalDate",
      "arrival_date",
    ]),
    DeliveryTime: pickValue(order, [
      "DeliveryTime",
      "delivery_time",
      "ArrivalTime",
      "arrival_time",
    ]),
    PaymentMode: cleanText(pickValue(order, ["PaymentMode", "payment_mode"])),
    PaymentStatus: cleanText(pickValue(order, ["PaymentStatus", "payment_status"])),
    OrderAmount: roundMoney(
      pickMoney(order, [
        "FinalTotal",
        "final_total",
        "TotalAmount",
        "total_amount",
        "OrderAmount",
        "order_amount",
      ]),
    ),
    BasePrice: financials.basePrice,
    RestroPrice: financials.restroPrice,
    CouponDiscount: financials.couponDiscount,
    RestroDiscount: financials.restroDiscount,
    REDiscount: financials.reDiscount,
    GstAmount: financials.gstAmount,
    ConvenienceFee: financials.convenienceFee,
    OrderPenalty: roundMoney(orderPenalty),
    PreviousBal: previousBal,
    SettlementAmount: financials.settlementAmount,
    ClosingBal: financials.closingBal,
    CreatedAt: pickValue(order, ["CreatedAt", "created_at"], now),
    UpdatedAt: now,
  };

  const result = await safeUpsertRestroRDS(supabase, payload);

  if (result.error) {
    console.error("RESTRO RDS SYNC ERROR:", result.error);
    return {
      ok: false,
      skipped: false,
      error: result.error instanceof Error ? result.error.message : String(result.error),
    };
  }

  return {
    ok: true,
    skipped: false,
    data: result.data,
  };
}

async function insertStatusHistory(
  supabase: SupabaseClient,
  orderId: string,
  body: AnyRow,
  status: string,
  subStatus: string,
  remarks: string,
  orderPenalty: number,
) {
  const actionBy =
    cleanText(body.actionBy) ||
    cleanText(body.ActionBy) ||
    cleanText(body.userName) ||
    cleanText(body.UserName) ||
    "System";

  const actionType =
    cleanText(body.actionType) ||
    cleanText(body.ActionType) ||
    cleanText(body.userType) ||
    cleanText(body.UserType) ||
    "Manual";

  const payload: AnyRow = {
    OrderId: orderId,
    Status: normalizeStatus(status),
    SubStatus: cleanText(subStatus),
    Remarks: cleanText(remarks),
    ActionBy: actionBy,
    ActionType: actionType,
    OrderPenalty: roundMoney(orderPenalty),
    CreatedAt: new Date().toISOString(),
  };

  const result = await safeInsert(supabase, "OrderStatusHistory", payload);

  if (result.error) {
    console.error("ORDER STATUS HISTORY INSERT ERROR:", result.error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { orderId: string } },
) {
  try {
    const supabase = supabaseServer();
    const orderId = decodeURIComponent(context.params.orderId || "");
    const body = (await req.json().catch(() => ({}))) as AnyRow;

    if (!orderId) {
      return NextResponse.json(
        { ok: false, success: false, error: "missing_order_id" },
        { status: 400 },
      );
    }

    const found = await findOrder(supabase, orderId);

    if (!found?.order) {
      return NextResponse.json(
        { ok: false, success: false, error: "order_not_found" },
        { status: 404 },
      );
    }

    const requestedStatus =
      cleanText(body.status) ||
      cleanText(body.Status) ||
      cleanText(body.order_status) ||
      cleanText(body.OrderStatus) ||
      cleanText(body.nextStatus) ||
      cleanText(body.NextStatus);

    if (!requestedStatus) {
      return NextResponse.json(
        { ok: false, success: false, error: "missing_status" },
        { status: 400 },
      );
    }

    const status = normalizeStatus(requestedStatus);

    const subStatus =
      cleanText(body.subStatus) ||
      cleanText(body.SubStatus) ||
      cleanText(body.sub_status) ||
      cleanText(body.reason) ||
      cleanText(body.Reason) ||
      cleanText(body.outcomeStatus) ||
      cleanText(body.OutcomeStatus);

    const remarks =
      cleanText(body.remarks) ||
      cleanText(body.Remarks) ||
      cleanText(body.comment) ||
      cleanText(body.Comment) ||
      cleanText(body.notes) ||
      cleanText(body.Notes);

    const orderPenalty = readOrderPenalty(body, status, subStatus);

    const previousOrder = found.order;
    const now = new Date().toISOString();

    const statusColumn =
      ["Status", "OrderStatus", "order_status", "status"].find(
        (key) => previousOrder[key] !== undefined,
      ) || "Status";

    const updatePayload: AnyRow = {
      [statusColumn]: status,
      Status: status,
      OrderStatus: status,
      SubStatus: subStatus,
      sub_status: subStatus,
      Remarks: remarks,
      remarks,
      OrderPenalty: orderPenalty,
      UpdatedAt: now,
      updated_at: now,
    };

    const updateResult = await safeUpdate(
      supabase,
      found.tableName,
      found.matchColumn,
      found.matchValue,
      updatePayload,
    );

    if (updateResult.error) {
      console.error("ORDER STATUS UPDATE ERROR:", updateResult.error);

      return NextResponse.json(
        {
          ok: false,
          success: false,
          error: "db_update_failed",
          details:
            updateResult.error instanceof Error
              ? updateResult.error.message
              : String(updateResult.error),
        },
        { status: 500 },
      );
    }

    const updatedOrder: AnyRow = {
      ...previousOrder,
      ...(updateResult.data || {}),
      [statusColumn]: status,
      Status: status,
      OrderStatus: status,
      SubStatus: subStatus,
      Remarks: remarks,
      OrderPenalty: orderPenalty,
      UpdatedAt: now,
    };

    await insertStatusHistory(
      supabase,
      cleanText(pickValue(updatedOrder, ["OrderId", "order_id", "order_number", "id"], orderId)),
      body,
      status,
      subStatus,
      remarks,
      orderPenalty,
    );

    const restroRDS = await syncRestroRDS(
      supabase,
      updatedOrder,
      status,
      subStatus,
      remarks,
      orderPenalty,
    );

    return NextResponse.json({
      ok: true,
      success: true,
      order: updatedOrder,
      data: updatedOrder,
      restroRDS,
    });
  } catch (error) {
    console.error("ORDER STATUS API ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: "server_error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
