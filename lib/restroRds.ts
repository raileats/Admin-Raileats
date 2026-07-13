// lib/restroRds.ts

import { serviceClient } from "./supabaseServer";

type AnyRecord = Record<string, any>;

type RestroRdsInput = {
  order: AnyRecord;
  status: string;
  subStatus?: string | null;
  remarks?: string | null;
};

function toNumber(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  return toText(value).toLowerCase().replace(/[\s_-]+/g, "");
}

function pickValue(row: AnyRecord, keys: string[], fallback: any = null) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return fallback;
}

function getOrderId(order: AnyRecord) {
  return toText(
    pickValue(order, [
      "OrderId",
      "order_id",
      "id",
      "order_number",
      "OrderNumber",
    ])
  );
}

function getRestroCode(order: AnyRecord) {
  return toText(
    pickValue(order, [
      "RestroCode",
      "restro_code",
      "OutletId",
      "outlet_id",
      "restroCode",
    ])
  );
}

function getOrderAmount(order: AnyRecord) {
  return toNumber(
    pickValue(order, [
      "TotalAmount",
      "total_amount",
      "FinalAmount",
      "final_amount",
      "GrandTotal",
      "grand_total",
      "OrderAmount",
    ])
  );
}

function getRestroPrice(order: AnyRecord) {
  return toNumber(
    pickValue(order, [
      "RestroPrice",
      "restro_price",
      "RestaurantPrice",
      "restaurant_price",
    ])
  );
}

function getBasePrice(order: AnyRecord) {
  return toNumber(
    pickValue(order, [
      "BasePrice",
      "base_price",
      "SubTotal",
      "subtotal",
      "ItemTotal",
      "item_total",
    ])
  );
}

function getDeliveryDate(order: AnyRecord) {
  return toText(
    pickValue(order, [
      "DeliveryDate",
      "delivery_date",
      "ArrivalDate",
      "arrival_date",
      "Delivery_Date",
    ])
  );
}

function getDeliveryTime(order: AnyRecord) {
  return toText(
    pickValue(order, [
      "DeliveryTime",
      "delivery_time",
      "ArrivalTime",
      "arrival_time",
      "Delivery_Time",
    ])
  );
}

function getPreviousBalance(_order: AnyRecord) {
  return 0;
}

function calculateRestroRds(input: RestroRdsInput) {
  const { order, status, subStatus, remarks } = input;

  const orderAmount = getOrderAmount(order);
  const restroPrice = getRestroPrice(order);
  const basePrice = getBasePrice(order);
  const orderPenalty = toNumber(
    pickValue(order, ["OrderPenalty", "order_penalty"], 0)
  );
  const restroDiscount = toNumber(
    pickValue(order, ["RestroDiscount", "restro_discount"], 0)
  );

  const previousBal = getPreviousBalance(order);

  const normalizedStatus = normalizeStatus(status);
  const normalizedSubStatus = normalizeStatus(subStatus);

  const isDelivered =
    normalizedStatus === "delivered" ||
    normalizedSubStatus === "partialdelivery" ||
    normalizedSubStatus === "baddelivery";

  const isCancelled = normalizedStatus === "cancelled";
  const isNotDelivered =
    normalizedStatus === "notdelivered" || normalizedStatus === "baddelivery";

  const grossRestroAmount =
    restroPrice > 0 ? restroPrice : basePrice > 0 ? basePrice : orderAmount;

  const payableBase = isDelivered ? grossRestroAmount : 0;
  const penalty = isCancelled ? 0 : orderPenalty;
  const discountDebit = isDelivered ? restroDiscount : 0;

  const settlementAmount = Math.max(
    0,
    Number((payableBase - penalty - discountDebit).toFixed(2))
  );

  const closingBal = Number((previousBal + settlementAmount).toFixed(2));

  return {
    RDSId: undefined,

    RestroCode: getRestroCode(order),
    OrderId: getOrderId(order),
    RestroName: toText(
      pickValue(order, ["RestroName", "restro_name", "OutletName", "outlet_name"])
    ),
    StationCode: toText(pickValue(order, ["StationCode", "station_code"])),
    StationName: toText(pickValue(order, ["StationName", "station_name"])),

    Status: status,
    SubStatus: subStatus || null,
    Remarks: remarks || null,

    DeliveryDate: getDeliveryDate(order) || null,
    DeliveryTime: getDeliveryTime(order) || null,

    OrderAmount: orderAmount,
    BasePrice: basePrice,
    RestroPrice: restroPrice,

    RestroDiscount: restroDiscount,
    OrderPenalty: penalty,

    PreviousBal: previousBal,
    SettlementAmount: settlementAmount,
    ClosingBal: closingBal,

    IsDelivered: isDelivered,
    IsCancelled: isCancelled,
    IsNotDelivered: isNotDelivered,

    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };
}

function getMissingColumnName(error: any) {
  const message = String(error?.message || error?.details || "");

  const missingColumnMatch =
    message.match(/Could not find the '([^']+)' column/i) ||
    message.match(/column "([^"]+)" of relation/i) ||
    message.match(/column "([^"]+)" does not exist/i);

  return missingColumnMatch?.[1] || "";
}

async function safeUpsertRestroRds(payload: AnyRecord) {
  let cleanPayload: AnyRecord = { ...payload };

  delete cleanPayload.RDSId;

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const { data, error } = await serviceClient
      .from("RestroRDS")
      .upsert(cleanPayload, { onConflict: "OrderId" })
      .select("*")
      .maybeSingle();

    if (!error) {
      return { data, error: null };
    }

    const missingColumn = getMissingColumnName(error);

    if (missingColumn && cleanPayload[missingColumn] !== undefined) {
      delete cleanPayload[missingColumn];
      continue;
    }

    return { data: null, error };
  }

  return {
    data: null,
    error: new Error("RestroRDS upsert failed after column fallback"),
  };
}

export async function syncRestroRds(input: RestroRdsInput) {
  const statusKey = normalizeStatus(input.status);
  const subStatusKey = normalizeStatus(input.subStatus);

  const shouldCreateRds =
    statusKey === "delivered" ||
    statusKey === "cancelled" ||
    statusKey === "notdelivered" ||
    statusKey === "baddelivery" ||
    subStatusKey === "partialdelivery" ||
    subStatusKey === "baddelivery";

  if (!shouldCreateRds) {
    return {
      ok: true,
      skipped: true,
      data: null,
      error: null,
    };
  }

  const payload = calculateRestroRds(input);

  if (!payload.OrderId || !payload.RestroCode) {
    return {
      ok: false,
      skipped: true,
      data: null,
      error: "OrderId or RestroCode missing for RestroRDS",
    };
  }

  const { data, error } = await safeUpsertRestroRds(payload);

  if (error) {
    console.error("RESTRO RDS UPSERT ERROR:", error);

    return {
      ok: false,
      skipped: false,
      data: null,
      error,
    };
  }

  return {
    ok: true,
    skipped: false,
    data,
    error: null,
  };
}
