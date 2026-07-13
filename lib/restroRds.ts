import { serviceClient } from "./supabaseServer";

type AnyRow = Record<string, any>;

export type RestroRdsSyncResult = {
  ok: boolean;
  data?: any;
  error?: string;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : 0;
}

function intValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function pick(row: AnyRow, keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function compactObject(payload: AnyRow) {
  const output: AnyRow = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined) output[key] = value;
  });

  return output;
}

async function upsertRestroRds(fullPayload: AnyRow, fallbackPayload: AnyRow) {
  const full = await serviceClient
    .from("RestroRDS")
    .upsert(compactObject(fullPayload), { onConflict: "OrderId" })
    .select("*")
    .maybeSingle();

  if (!full.error) {
    return { ok: true, data: full.data };
  }

  console.error("RESTRO RDS FULL UPSERT ERROR:", full.error);

  const fallback = await serviceClient
    .from("RestroRDS")
    .upsert(compactObject(fallbackPayload), { onConflict: "OrderId" })
    .select("*")
    .maybeSingle();

  if (!fallback.error) {
    return { ok: true, data: fallback.data };
  }

  console.error("RESTRO RDS FALLBACK UPSERT ERROR:", fallback.error);

  const minimal = await serviceClient
    .from("RestroRDS")
    .upsert(
      compactObject({
        RestroCode: fallbackPayload.RestroCode,
        OrderId: fallbackPayload.OrderId,
        RestroName: fallbackPayload.RestroName,
        StationCode: fallbackPayload.StationCode,
        Status: fallbackPayload.Status,
        SubStatus: fallbackPayload.SubStatus,
        Remarks: fallbackPayload.Remarks,
      }),
      { onConflict: "OrderId" }
    )
    .select("*")
    .maybeSingle();

  if (!minimal.error) {
    return { ok: true, data: minimal.data };
  }

  console.error("RESTRO RDS MINIMAL UPSERT ERROR:", minimal.error);

  return {
    ok: false,
    error: `${full.error.message} | ${fallback.error.message} | ${minimal.error.message}`,
  };
}

export async function syncRestroRdsForOrder(
  orderId: string
): Promise<RestroRdsSyncResult> {
  try {
    const normalizedOrderId = cleanText(orderId);

    if (!normalizedOrderId) {
      return { ok: false, error: "Missing order id" };
    }

    const { data: order, error } = await serviceClient
      .from("Orders")
      .select("*")
      .eq("OrderId", normalizedOrderId)
      .maybeSingle();

    if (error) {
      console.error("RESTRO RDS ORDER FETCH ERROR:", error);
      return { ok: false, error: error.message };
    }

    if (!order) {
      return { ok: false, error: "Order not found" };
    }

    const restroCode = intValue(
      pick(order, ["RestroCode", "restro_code", "OutletId", "outlet_id"])
    );

    const orderPenalty = numberValue(
      pick(order, ["OrderPenalty", "order_penalty"])
    );

    const fullPayload = {
      RestroCode: restroCode,
      OrderId: normalizedOrderId,
      RestroName: pick(order, ["RestroName", "OutletName", "restro_name"]) || "",
      StationCode: pick(order, ["StationCode", "station_code"]) || "",
      StationName: pick(order, ["StationName", "station_name"]) || "",
      Status: pick(order, ["Status", "order_status"]) || "",
      SubStatus: pick(order, ["SubStatus", "sub_status"]) || "",
      Remarks: pick(order, ["Remarks", "remarks"]) || "",
      DeliveryDate: pick(order, ["DeliveryDate", "arrival_date"]) || null,
      DeliveryTime: pick(order, ["DeliveryTime", "arrival_time"]) || null,
      PaymentMode: pick(order, ["PaymentMode", "payment_mode"]) || "",
      PaymentStatus: pick(order, ["PaymentStatus", "payment_status"]) || "",
      CustomerName: pick(order, ["CustomerName", "customer_name"]) || "",
      CustomerMobile: pick(order, ["CustomerMobile", "customer_mobile"]) || "",
      TrainNumber: pick(order, ["TrainNumber", "train_number"]) || "",
      BasePrice: numberValue(pick(order, ["BasePrice", "base_price"])),
      RestroPrice: numberValue(pick(order, ["RestroPrice", "restro_price"])),
      CouponDiscount: numberValue(
        pick(order, ["CouponDiscount", "coupon_discount"])
      ),
      RestroDiscount: numberValue(
        pick(order, ["RestroDiscount", "restro_discount"])
      ),
      REDiscount: numberValue(pick(order, ["REDiscount", "re_discount"])),
      OrderPenalty: orderPenalty,
      TotalAmount: numberValue(
        pick(order, ["TotalAmount", "FinalTotal", "total_amount"])
      ),
      PreviousBal: 0,
      UpdatedAt: new Date().toISOString(),
    };

    const fallbackPayload = {
      RestroCode: restroCode,
      OrderId: normalizedOrderId,
      RestroName: fullPayload.RestroName,
      StationCode: fullPayload.StationCode,
      Status: fullPayload.Status,
      SubStatus: fullPayload.SubStatus,
      Remarks: fullPayload.Remarks,
      OrderPenalty: orderPenalty,
      UpdatedAt: new Date().toISOString(),
    };

    return await upsertRestroRds(fullPayload, fallbackPayload);
  } catch (error) {
    console.error("RESTRO RDS SYNC ERROR:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown RDS sync error",
    };
  }
}
