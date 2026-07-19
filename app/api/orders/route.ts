// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

/**
 * Expected payload from raileats.in CheckoutClient (approx):
 *
 * {
 *   restro_code: number | string;              // RestroCode
 *   customer: {
 *     full_name: string;
 *     phone: string;
 *   };
 *   delivery: {
 *     train_no: string;
 *     coach: string;
 *     seat: string;
 *     delivery_date?: string;                 // "YYYY-MM-DD" (optional)
 *     delivery_time?: string;                 // "HH:MM" (optional)
 *     note?: string | null;
 *   };
 *   pricing: {
 *     subtotal: number;
 *     gst?: number;
 *     platform_charge?: number;
 *     total: number;
 *     payment_mode?: "COD" | "ONLINE";
 *   };
 *   items: {
 *     item_id: number;
 *     name: string;
 *     qty: number;
 *     base_price: number;
 *     line_total: number;
 *   }[];
 *   meta?: any;
 * }
 */

type Payload = {
  restro_code: string | number;
  customer: {
    full_name: string;
    phone: string;
  };
  delivery: {
    train_no: string;
    coach: string;
    seat: string;
    delivery_date?: string;
    delivery_time?: string;
    note?: string | null;
  };
  pricing: {
    subtotal: number;
    gst?: number;
    platform_charge?: number;
    total: number;
    payment_mode?: "COD" | "ONLINE";
  };
  items: {
    item_id: number;
    name: string;
    qty: number;
    base_price: number;
    line_total: number;
  }[];
  meta?: any;
};

type RestroMasterRow = {
  RestroCode: number;
  RestroName: string | null;
  StationCode: string | null;
  StationName: string | null;
};

type MenuRow = {
  id: number;
  restro_code: number;
  item_code: number | null;
  item_name: string;
  item_description?: string | null;
  item_category?: string | null;
  item_cuisine?: string | null;
  menu_type?: string | null;
  base_price?: number | null;
  gst_percent?: number | null;
  selling_price?: number | null;
};

function generateOrderId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const ms = String(now.getTime()).slice(-5);
  return `BOO-${y}${m}${d}-${ms}`;
}

function todayYMD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timeHM() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/* ========= POST: create new order from raileats.in ========= */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    // basic validations
    if (!body?.restro_code) {
      return NextResponse.json({ error: "missing_restroc_code" }, { status: 400 });
    }
    if (!body?.customer?.full_name || !body?.customer?.phone) {
      return NextResponse.json({ error: "missing_customer" }, { status: 400 });
    }
    if (!body?.delivery?.train_no || !body?.delivery?.coach || !body?.delivery?.seat) {
      return NextResponse.json({ error: "missing_delivery" }, { status: 400 });
    }
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ error: "empty_items" }, { status: 400 });
    }

    const supa = serviceClient;
    const restroCodeNum = Number(body.restro_code);

    // 1) RestroMaster se outlet + station details lao
    const { data: restroData, error: restroErr } = await supa
      .from("RestroMaster")
      .select("RestroCode, RestroName, StationCode, StationName")
      .eq("RestroCode", restroCodeNum)
      .maybeSingle();

    const restro = (restroData || null) as RestroMasterRow | null;

    if (restroErr) {
      console.error("RestroMaster error", restroErr);
      return NextResponse.json({ error: "restro_lookup_failed" }, { status: 500 });
    }
    if (!restro) {
      return NextResponse.json({ error: "restro_not_found" }, { status: 400 });
    }

    // 2) Menu rows lao, taaki OrderItems me full info aa sake
    const itemIds = body.items.map((i) => i.item_id);
    const { data: menuRowsData, error: menuErr } = await supa
      .from("RestroMenuItems")
      .select(
        "id, restro_code, item_code, item_name, item_description, item_category, item_cuisine, menu_type, base_price, gst_percent, selling_price"
      )
      .in("id", itemIds);

    if (menuErr) {
      console.error("Menu lookup error", menuErr);
      return NextResponse.json({ error: "menu_lookup_failed" }, { status: 500 });
    }

    const menuRows = (menuRowsData || []) as MenuRow[];
    const menuById = new Map<number, MenuRow>();
    menuRows.forEach((row) => menuById.set(row.id, row));

    // 3) OrderId + time generate
    const orderId = generateOrderId();
    const nowIso = new Date().toISOString();

    const { customer, delivery, pricing } = body;

    const deliveryDate = delivery.delivery_date || todayYMD();
    const deliveryTime = delivery.delivery_time || timeHM();

    // 4) Orders table insert (Supabase "Orders" with PascalCase columns)
    const { error: orderInsertErr } = await supa.from("Orders").insert({
      OrderId: orderId,
      RestroCode: restro.RestroCode,
      RestroName: restro.RestroName,
      StationCode: restro.StationCode,
      StationName: restro.StationName,
      DeliveryDate: deliveryDate,
      DeliveryTime: deliveryTime,
      TrainNumber: delivery.train_no,
      Coach: delivery.coach,
      Seat: delivery.seat,
      CustomerName: customer.full_name,
      CustomerMobile: customer.phone,
      SubTotal: pricing.subtotal,
      GSTAmount: pricing.gst ?? 0,
      PlatformCharge: pricing.platform_charge ?? 0,
      TotalAmount: pricing.total,
      PaymentMode: pricing.payment_mode ?? "COD",
      Status: "booked", // 🔹 TabKey ke hisaab se lowercase
      JourneyPayload: body.meta ?? null,
      CreatedAt: nowIso,
      UpdatedAt: nowIso,
    });

    if (orderInsertErr) {
      console.error("Orders insert error", orderInsertErr);
      return NextResponse.json({ error: "order_insert_failed" }, { status: 500 });
    }

    // 5) OrderItems table insert
    const orderItemsPayload = body.items.map((it) => {
      const row = menuById.get(it.item_id);
      return {
        OrderId: orderId,
        RestroCode: restro.RestroCode,
        ItemCode: row?.item_code ?? it.item_id,
        ItemName: row?.item_name ?? it.name,
        ItemDescription: row?.item_description ?? null,
        ItemCategory: row?.item_category ?? null,
        Cuisine: row?.item_cuisine ?? null,
        MenuType: row?.menu_type ?? null,
        BasePrice: row?.base_price ?? it.base_price,
        GSTPercent: row?.gst_percent ?? null,
        SellingPrice: row?.selling_price ?? it.base_price,
        Quantity: it.qty,
        LineTotal: it.line_total,
      };
    });

    const { error: itemsInsertErr } = await supa.from("OrderItems").insert(orderItemsPayload);

    if (itemsInsertErr) {
      console.error("OrderItems insert error", itemsInsertErr);
      return NextResponse.json({ error: "order_items_insert_failed" }, { status: 500 });
    }

    // 6) OrderStatusHistory me initial "booked" row
    const { error: histErr } = await supa.from("OrderStatusHistory").insert({
      OrderId: orderId,
      OldStatus: null,
      NewStatus: "booked",
      Note: "Order created",
      ChangedBy: "system",
      ChangedAt: nowIso,
    });

    if (histErr) {
      console.error("OrderStatusHistory insert error", histErr);
      // history fail ho jaye to bhi order ko fail nahi kar rahe
    }

    return NextResponse.json({ ok: true, order_id: orderId });
  } catch (err) {
    console.error("orders.POST error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/* ========= GET: fetch orders for Admin UI ========= */

export async function GET(req: Request) {
  try {
    const supa = serviceClient;
    const { searchParams } = new URL(req.url);
    const rawStatusFilter = String(
  searchParams.get("status") || ""
).trim();

const normalizedStatusFilter = rawStatusFilter
  .toLowerCase()
  .replace(/[^a-z0-9]/g, "");

const statusMap: Record<string, string> = {
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
  complaints: "Complaints",
  complaint: "Complaints",
  refund: "Refund",
};

const dbStatus = normalizedStatusFilter
  ? statusMap[normalizedStatusFilter] || rawStatusFilter
  : null;

const orderId = String(searchParams.get("orderId") || "").trim();
const customerMobile = String(searchParams.get("customerMobile") || "")
  .replace(/\D/g, "")
  .slice(0, 15);
const outlet = String(searchParams.get("outlet") || "").trim();
const station = String(searchParams.get("station") || "").trim();
const trainNo = String(searchParams.get("trainNo") || "").trim();
const dateType = String(searchParams.get("dateType") || "delivery").trim();
const dateFrom = String(searchParams.get("dateFrom") || "").trim();
const dateTo = String(searchParams.get("dateTo") || "").trim();

const safeLike = (value: string) => value.replace(/[%_,]/g, "").slice(0, 100);

    // Refund is a workflow tab, not an Orders.Status. Load OrderRefunds first and
    // merge the matching Orders rows into the same shape used by the Admin UI.
    if (normalizedStatusFilter === "refund") {
      let refundQuery = supa.from("OrderRefunds").select("*").order("CreatedAt", { ascending: false });
      if (orderId) refundQuery = refundQuery.ilike("OrderId", `%${safeLike(orderId)}%`);
      const { data: refundRows, error: refundError } = await refundQuery;
      if (refundError) return NextResponse.json({ error: refundError.message || "refunds_fetch_failed" }, { status: 500 });
      const ids = (refundRows || []).map((r: any) => String(r.OrderId || "")).filter(Boolean);
      let orderRows: any[] = [];
      if (ids.length) {
        const { data, error } = await supa.from("Orders").select("*").in("OrderId", ids);
        if (error) return NextResponse.json({ error: error.message || "refund_orders_fetch_failed" }, { status: 500 });
        orderRows = data || [];
      }
      const byId = new Map(orderRows.map((r: any) => [String(r.OrderId), r]));
      const orders = (refundRows || []).map((refund: any) => {
        const row: any = byId.get(String(refund.OrderId)) || {};
        return { id: String(refund.OrderId || ""), status: "Refund", restroCode: row.RestroCode, restroName: row.RestroName, stationCode: row.StationCode, stationName: row.StationName, deliveryDate: row.DeliveryDate, deliveryTime: row.DeliveryTime, trainNumber: row.TrainNumber, coach: row.Coach, seat: row.Seat, customerName: row.CustomerName, customerMobile: row.CustomerMobile, totalAmount: Number(row.TotalAmount ?? refund.PaidAmount ?? refund.RefundAmount ?? 0), paymentMode: row.PaymentMode ?? "PPD", CreatedAt: refund.CreatedAt ?? row.CreatedAt ?? null, history: [], ...refund };
      });
      return NextResponse.json({ ok: true, orders });
    }

   let query = supa
  .from("Orders")
  .select(`
    OrderId,
    RestroCode,
    RestroName,
    StationCode,
    StationName,
    DeliveryDate,
    DeliveryTime,
    TrainNumber,
    Coach,
    Seat,
    CustomerName,
    CustomerMobile,
    TotalAmount,
    PaymentMode,
    Status,
    SubStatus,
    CreatedAt
  `)
  .order("CreatedAt", { ascending: false });
    if (
  normalizedStatusFilter &&
  normalizedStatusFilter !== "all"
) {
  if (normalizedStatusFilter === "baddelivery") {
    query = query
      .eq("Status", "Delivered")
      .eq("SubStatus", "Bad Delivery");
  } else if (dbStatus) {
    query = query.eq("Status", dbStatus);
  }
}

    if (orderId) {
      query = query.ilike("OrderId", `%${safeLike(orderId)}%`);
    }

    if (customerMobile) {
      query = query.ilike("CustomerMobile", `%${customerMobile}%`);
    }

    if (outlet) {
      const safeOutlet = safeLike(outlet);
      const outletFilters = [
        `RestroName.ilike.%${safeOutlet}%`,
      ];
      const outletDigits = safeOutlet.replace(/\D/g, "");
      if (outletDigits) {
        outletFilters.push(`RestroCode.eq.${Number(outletDigits)}`);
      }
      query = query.or(outletFilters.join(","));
    }

    if (station) {
      const safeStation = safeLike(station);
      query = query.or(
        `StationCode.ilike.%${safeStation}%,StationName.ilike.%${safeStation}%`,
      );
    }

    if (trainNo) {
      query = query.ilike("TrainNumber", `%${safeLike(trainNo)}%`);
    }

    if (dateFrom || dateTo) {
      if (dateType === "booking") {
        if (dateFrom) query = query.gte("CreatedAt", dateFrom);
        if (dateTo) query = query.lte("CreatedAt", dateTo);
      } else {
        const fromDate = dateFrom.slice(0, 10);
        const toDate = dateTo.slice(0, 10);
        if (fromDate) query = query.gte("DeliveryDate", fromDate);
        if (toDate) query = query.lte("DeliveryDate", toDate);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Orders GET error", error);
      return NextResponse.json({ error: "orders_fetch_failed" }, { status: 500 });
    }

   const orders = (data || []).map((row: any) => ({
  id: row.OrderId as string,
  status: (row.Status || "booked") as string,
  restroCode: row.RestroCode,
  restroName: row.RestroName,
  stationCode: row.StationCode,
  stationName: row.StationName,
  deliveryDate: row.DeliveryDate,
  deliveryTime: row.DeliveryTime,
  trainNumber: row.TrainNumber,
  coach: row.Coach,
  seat: row.Seat,
  customerName: row.CustomerName,
  customerMobile: row.CustomerMobile,
  totalAmount: Number(row.TotalAmount ?? 0),
  paymentMode: row.PaymentMode ?? "COD",
  CreatedAt: row.CreatedAt ?? null,
  history: [] as any[],
}));

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    console.error("orders.GET error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
    let complaintByOrder = new Map<string, any>();
    if (normalizedStatusFilter === "complaints") {
      const ids = (data || []).map((row: any) => String(row.OrderId || "")).filter(Boolean);
      if (ids.length) {
        const { data: complaintRows } = await supa.from("OrderComplaints").select("*").in("OrderId", ids).eq("ComplaintStatus", "Pending").order("CreatedAt", { ascending: false });
        (complaintRows || []).forEach((row: any) => { if (!complaintByOrder.has(String(row.OrderId))) complaintByOrder.set(String(row.OrderId), row); });
      }
    }

    const orders = (data || []).map((row: any) => ({
  id: row.OrderId as string,
  status: (row.Status || "booked") as string,
  restroCode: row.RestroCode,
  restroName: row.RestroName,
  stationCode: row.StationCode,
  stationName: row.StationName,
  deliveryDate: row.DeliveryDate,
  deliveryTime: row.DeliveryTime,
  trainNumber: row.TrainNumber,
  coach: row.Coach,
  seat: row.Seat,
  customerName: row.CustomerName,
  customerMobile: row.CustomerMobile,
  totalAmount: Number(row.TotalAmount ?? 0),
  paymentMode: row.PaymentMode ?? "COD",
  CreatedAt: row.CreatedAt ?? null,
  history: [] as any[],
  ...(complaintByOrder.get(String(row.OrderId)) || {}),
}));

}
