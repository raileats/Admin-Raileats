import { serviceClient } from "./supabaseServer";

type AnyRow = Record<string, any>;

function pick(row: AnyRow | null | undefined, keys: string[]) {
  if (!row) return null;

  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return null;
}

function toNumber(value: any, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function cleanText(value: any) {
  return String(value ?? "").trim();
}

function cleanSubStatus(value: any) {
  return cleanText(value).replace(/\s*\(Delivered\)\s*$/i, "").trim();
}

function normalizeStatus(value: any) {
  const raw = cleanText(value);
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");

  if (key === "notdelivered") return "Not Delivered";
  if (key === "baddelivery") return "Bad Delivery";
  if (key === "partialdelivery") return "Delivered";
  if (key === "delivered") return "Delivered";
  if (key === "cancelled" || key === "canceled") return "Cancelled";

  return raw;
}

function shouldCreateRds(order: AnyRow) {
  const status = normalizeStatus(pick(order, ["Status", "status"]));
  const subStatus = cleanSubStatus(pick(order, ["SubStatus", "sub_status"]));

  return (
    status === "Delivered" ||
    status === "Cancelled" ||
    status === "Not Delivered" ||
    status === "Bad Delivery" ||
    subStatus === "Bad Delivery" ||
    subStatus === "Partial Delivery"
  );
}

function computeSettlementAmount(order: AnyRow) {
  const status = normalizeStatus(pick(order, ["Status", "status"]));
  const subStatus = cleanSubStatus(pick(order, ["SubStatus", "sub_status"]));

  const restroPrice = toNumber(
    pick(order, ["RestroPrice", "restro_price", "OutletPrice", "RestaurantPrice"]),
    0
  );

  const restroDiscount = toNumber(
    pick(order, ["RestroDiscount", "restro_discount"]),
    0
  );

  const orderPenalty = toNumber(
    pick(order, ["OrderPenalty", "order_penalty", "VendorPenalty"]),
    0
  );

  if (
    status === "Delivered" ||
    subStatus === "Bad Delivery" ||
    subStatus === "Partial Delivery"
  ) {
    return round2(restroPrice - restroDiscount - orderPenalty);
  }

  if (status === "Cancelled" || status === "Not Delivered") {
    return round2(0 - orderPenalty);
  }

  return 0;
}

function buildRdsPayload(orderId: string, order: AnyRow) {
  const status = normalizeStatus(pick(order, ["Status", "status"]));
  const subStatus = cleanSubStatus(pick(order, ["SubStatus", "sub_status"]));
  const settlementAmount = computeSettlementAmount(order);

  return {
    RestroCode: pick(order, ["RestroCode", "restro_code", "OutletCode"]),
    OrderId: orderId,
    RestroName: pick(order, ["RestroName", "restro_name", "OutletName"]),
    StationCode: pick(order, ["StationCode", "station_code"]),
    Status: status,
    SubStatus: subStatus || null,
    Remarks: pick(order, ["Remarks", "remarks", "AdminRemarks"]),

    DeliveryDate: pick(order, ["DeliveryDate", "delivery_date", "ArrivalDate"]),
    DeliveryTime: pick(order, ["DeliveryTime", "delivery_time", "ArrivalTime"]),
    CustomerName: pick(order, ["CustomerName", "customer_name"]),
    CustomerMobile: pick(order, ["CustomerMobile", "customer_mobile"]),
    TrainNumber: pick(order, ["TrainNumber", "train_number"]),

    BasePrice: toNumber(pick(order, ["BasePrice", "base_price"]), 0),
    RestroPrice: toNumber(pick(order, ["RestroPrice", "restro_price"]), 0),
    TotalAmount: toNumber(pick(order, ["TotalAmount", "total_amount"]), 0),
    FinalTotal: toNumber(pick(order, ["FinalTotal", "final_total"]), 0),

    CouponCode: pick(order, ["CouponCode", "coupon_code"]),
    CouponDiscount: toNumber(pick(order, ["CouponDiscount", "coupon_discount"]), 0),
    RestroDiscount: toNumber(pick(order, ["RestroDiscount", "restro_discount"]), 0),
    REDiscount: toNumber(pick(order, ["REDiscount", "re_discount"]), 0),

    OrderPenalty: toNumber(pick(order, ["OrderPenalty", "order_penalty"]), 0),
    PaymentMode: pick(order, ["PaymentMode", "payment_mode"]),
    PaymentStatus: pick(order, ["PaymentStatus", "payment_status"]),

    PreviousBal: 0,
    SettlementAmount: settlementAmount,
    ClosingBal: settlementAmount,

    CreatedAt: pick(order, ["CreatedAt", "created_at"]) || new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };
}

async function tryUpsert(payload: AnyRow) {
  return serviceClient
    .from("RestroRDS")
    .upsert(payload, { onConflict: "OrderId" })
    .select("RDSId")
    .maybeSingle();
}

export async function syncRestroRDSForOrder(orderId: string, providedOrder?: AnyRow) {
  try {
    let order = providedOrder;

    if (!order) {
      const { data, error } = await serviceClient
        .from("Orders")
        .select("*")
        .eq("OrderId", orderId)
        .maybeSingle();

      if (error || !data) {
        return {
          ok: false,
          skipped: true,
          error: error?.message || "Order not found for RDS sync",
        };
      }

      order = data as AnyRow;
    }

    if (!shouldCreateRds(order)) {
      return { ok: true, skipped: true };
    }

    const fullPayload = buildRdsPayload(orderId, order);

    const attempts: AnyRow[] = [
      fullPayload,
      {
        ...fullPayload,
        ClosingBal: undefined,
      },
      {
        ...fullPayload,
        ClosingBal: undefined,
        SettlementAmount: undefined,
      },
      {
        RestroCode: fullPayload.RestroCode,
        OrderId: fullPayload.OrderId,
        RestroName: fullPayload.RestroName,
        StationCode: fullPayload.StationCode,
        Status: fullPayload.Status,
        SubStatus: fullPayload.SubStatus,
        Remarks: fullPayload.Remarks,
        OrderPenalty: fullPayload.OrderPenalty,
        UpdatedAt: fullPayload.UpdatedAt,
      },
    ];

    let lastError = "";

    for (let index = 0; index < attempts.length; index += 1) {
      const cleanPayload: AnyRow = {};

      Object.keys(attempts[index]).forEach((key) => {
        if (attempts[index][key] !== undefined) {
          cleanPayload[key] = attempts[index][key];
        }
      });

      const { data, error } = await tryUpsert(cleanPayload);

      if (!error) {
        return { ok: true, data };
      }

      lastError = error.message;
    }

    return { ok: false, error: lastError || "RDS upsert failed" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "RDS sync failed",
    };
  }
}
