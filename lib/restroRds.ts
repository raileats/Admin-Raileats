import { serviceClient } from "./supabaseServer";

type AnyOrder = Record<string, any>;

type RdsResult =
  | { ok: true; data: any }
  | { ok: false; error: string; details?: any };

function num(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function money(value: unknown, fallback = 0) {
  return Math.round(num(value, fallback) * 100) / 100;
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function upper(value: unknown) {
  return text(value).toUpperCase();
}

function normalizeDate(value: unknown) {
  const raw = text(value);
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

function normalizeTime(value: unknown) {
  const raw = text(value);
  if (!raw) return null;

  const match = raw.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;

  const hh = match[1].padStart(2, "0");
  const mm = match[2].padStart(2, "0");
  const ss = (match[3] || "00").padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

function isPrepaid(paymentMode: unknown) {
  const mode = upper(paymentMode);
  return (
    mode === "PPD" ||
    mode === "PREPAID" ||
    mode === "ONLINE" ||
    mode === "PAID" ||
    mode === "RAZORPAY" ||
    mode === "UPI"
  );
}

function isCancelledLike(status: unknown) {
  const value = upper(status).replace(/[_-]/g, " ");
  return value === "CANCELLED" || value === "CANCELED" || value === "NOT DELIVERED";
}

function getOrderId(order: AnyOrder) {
  return text(order.OrderId || order.order_id || order.id);
}

function getRestroCode(order: AnyOrder) {
  return num(order.RestroCode || order.restro_code || order.OutletId || order.outlet_id, 0);
}

async function getPreviousBalance(restroCode: number, orderId: string) {
  const query: any = serviceClient
    .from("RestroRDS")
    .select("CurrentBal")
    .eq("RestroCode", restroCode)
    .neq("OrderId", orderId)
    .order("UpdatedAt", { ascending: false })
    .order("RDSId", { ascending: false })
    .limit(1);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return money(data?.[0]?.CurrentBal || 0);
}

function buildAmounts(order: AnyOrder, previousBal: number) {
  const status = text(order.Status || order.order_status);
  const paymentMode = text(order.PaymentMode || order.payment_mode);

  const restroPrice = money(
    order.RestroPrice ?? order.restro_price ?? order.TotalAmount ?? order.total_amount
  );

  const basePrice = money(order.BasePrice ?? order.base_price ?? restroPrice);

  const restroDiscount = money(order.RestroDiscount ?? order.restro_discount);
  const reDiscount = money(order.REDiscount ?? order.re_discount);
  const orderPenalty = money(order.OrderPenalty ?? order.order_penalty);

  const discountedBasePrice = money(
    order.DiscountedBasePrice ??
      order.discounted_base_price ??
      Math.max(basePrice - restroDiscount, 0)
  );

  const reComm = money(order.REComm ?? order.re_comm);
  const gstAmount = money(order.GSTAmount ?? order.gst_amount);
  const platformCharge = money(order.PlatformCharge ?? order.platform_charge);
  const totalAmount = money(order.TotalAmount ?? order.total_amount ?? restroPrice);

  const igst = money(order.IGST ?? order.igst ?? reComm * 0.18);

  let orderCharges = 0;
  let settlementAmount = 0;

  if (isCancelledLike(status)) {
    orderCharges = orderPenalty;
    settlementAmount = -orderPenalty;
  } else if (isPrepaid(paymentMode)) {
    orderCharges = money(reComm + igst + platformCharge + reDiscount + orderPenalty);
    settlementAmount = money(restroPrice - restroDiscount - orderCharges);
  } else {
    orderCharges = money(reComm + igst + platformCharge + reDiscount + orderPenalty);
    settlementAmount = money(0 - orderCharges);
  }

  const currentBal = money(previousBal + settlementAmount);

  return {
    RestroPrice: restroPrice,
    BasePrice: basePrice,
    DiscountedBasePrice: discountedBasePrice,
    REComm: reComm,
    GSTAmount: gstAmount,
    PlatformCharge: platformCharge,
    RestroDiscount: restroDiscount,
    REDiscount: reDiscount,
    TotalAmount: totalAmount,
    OrderPenalty: orderPenalty,
    IGST: igst,
    OrderCharges: orderCharges,
    SettlementAmount: settlementAmount,
    PreviousBal: previousBal,
    CurrentBal: currentBal,
  };
}

export async function syncRestroRdsForOrder(order: AnyOrder): Promise<RdsResult> {
  try {
    const orderId = getOrderId(order);
    const restroCode = getRestroCode(order);

    if (!orderId) {
      return { ok: false, error: "OrderId missing for RestroRDS sync" };
    }

    if (!restroCode) {
      return { ok: false, error: "RestroCode missing for RestroRDS sync" };
    }

    const previousBal = await getPreviousBalance(restroCode, orderId);
    const amounts = buildAmounts(order, previousBal);

    const payload = {
      RestroCode: restroCode,
      OrderId: orderId,
      RestroName: text(order.RestroName || order.restro_name),
      StationCode: text(order.StationCode || order.station_code),
      Status: text(order.Status || order.order_status),
      SubStatus: text(order.SubStatus || order.sub_status),
      Remarks: text(order.Remarks || order.remarks),
      DeliveryDate: normalizeDate(order.DeliveryDate || order.arrival_date),
      DeliveryTime: normalizeTime(order.DeliveryTime || order.arrival_time),
      PaymentMode: text(order.PaymentMode || order.payment_mode),
      CouponCode: text(order.CouponCode || order.coupon_code) || null,
      ...amounts,
      UpdatedAt: new Date().toISOString(),
    };

    const { data, error } = await serviceClient
      .from("RestroRDS")
      .upsert(payload, { onConflict: "OrderId" })
      .select("*")
      .single();

    if (error) {
      return {
        ok: false,
        error: "RestroRDS save failed",
        details: error,
      };
    }

    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: "RestroRDS unexpected error",
      details: error instanceof Error ? error.message : error,
    };
  }
}
