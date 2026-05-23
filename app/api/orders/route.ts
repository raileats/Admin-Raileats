import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

type Payload = {
  restro_code: string | number;
  customer: { full_name: string; phone: string };
  delivery: { train_no: string; coach: string; seat: string; delivery_date?: string; delivery_time?: string; note?: string | null };
  pricing: { subtotal: number; gst?: number; platform_charge?: number; total: number; payment_mode?: "COD" | "ONLINE" };
  items: { item_id: number; name: string; qty: number; base_price: number; line_total: number }[];
  meta?: any;
};

type RestroMasterRow = { RestroCode: number; RestroName: string | null; StationCode: string | null; StationName: string | null };
type MenuRow = { id: number; restro_code: number; item_code: number | null; item_name: string; item_description?: string | null; item_category?: string | null; item_cuisine?: string | null; menu_type?: string | null; base_price?: number | null; gst_percent?: number | null; selling_price?: number | null };

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
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function timeHM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    if (!body?.restro_code || !body?.customer?.full_name || !body?.customer?.phone || !body?.delivery?.train_no || !body?.delivery?.coach || !body?.delivery?.seat || !Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
    }

    const supa = serviceClient;
    const { data: restro, error: restroErr } = await supa.from('"RestroMaster"').select("RestroCode, RestroName, StationCode, StationName").eq("RestroCode", Number(body.restro_code)).maybeSingle();
    if (restroErr || !restro) return NextResponse.json({ error: "restro_not_found" }, { status: 400 });

    const itemIds = body.items.map((i) => i.item_id);
    const { data: menuRows } = await supa.from('"RestroMenuItems"').select("id, item_code, item_name, item_description, item_category, item_cuisine, menu_type, base_price, gst_percent, selling_price").in("id", itemIds);
    const menuById = new Map<number, any>();
    (menuRows || []).forEach((r) => menuById.set(r.id, r));

    const orderId = generateOrderId();
    const nowIso = new Date().toISOString();
    const { customer, delivery, pricing } = body;

    const { error: orderInsertErr } = await supa.from('"Orders"').insert({
      OrderId: orderId, RestroCode: restro.RestroCode, RestroName: restro.RestroName, StationCode: restro.StationCode, StationName: restro.StationName,
      DeliveryDate: delivery.delivery_date || todayYMD(), DeliveryTime: delivery.delivery_time || timeHM(), TrainNumber: delivery.train_no, Coach: delivery.coach, Seat: delivery.seat,
      CustomerName: customer.full_name, CustomerMobile: customer.phone, SubTotal: pricing.subtotal, GSTAmount: pricing.gst ?? 0, PlatformCharge: pricing.platform_charge ?? 0,
      TotalAmount: pricing.total, PaymentMode: pricing.payment_mode ?? "COD", Status: "Booked", JourneyPayload: body.meta ?? null, CreatedAt: nowIso, UpdatedAt: nowIso
    });
    if (orderInsertErr) return NextResponse.json({ error: "order_insert_failed", details: orderInsertErr.message }, { status: 500 });

    const orderItemsPayload = body.items.map((it) => {
      const row = menuById.get(it.item_id);
      return {
        OrderId: orderId, RestroCode: restro.RestroCode, ItemCode: row?.item_code ?? it.item_id, ItemName: row?.item_name ?? it.name,
        ItemDescription: row?.item_description ?? null, ItemCategory: row?.item_category ?? null, Cuisine: row?.item_cuisine ?? null, MenuType: row?.menu_type ?? null,
        BasePrice: row?.base_price ?? it.base_price, GSTPercent: row?.gst_percent ?? null, SellingPrice: row?.selling_price ?? it.base_price, Quantity: it.qty, LineTotal: it.line_total
      };
    });
    await supa.from('"OrderItems"').insert(orderItemsPayload);

    try {
      await supa.from('"OrderStatusHistory"').insert({ OrderId: orderId, OldStatus: null, NewStatus: "Booked", Note: "Order created from website", ChangedBy: "system", ChangedAt: nowIso });
    } catch (_) {}

    return NextResponse.json({ ok: true, order_id: orderId });
  } catch (err: any) {
    return NextResponse.json({ error: "server_error", details: err?.message }, { status: 500 });
  }
}

/* ========= GET: Fetch Orders supporting Multi-Format status matching ========= */
export async function GET(req: Request) {
  try {
    const supa = serviceClient;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); 

    let query = supa.from('"Orders"').select(`
      OrderId, RestroCode, RestroName, StationCode, StationName, DeliveryDate, DeliveryTime,
      TrainNumber, Coach, Seat, CustomerName, CustomerMobile, TotalAmount, Status, CreatedAt,
      history: "OrderStatusHistory" ( OrderId, OldStatus, NewStatus, Note, ChangedBy, ChangedAt )
    `);

    if (statusFilter) {
      // 🔹 CSV DATA MATCHING FIX: Database ke saare ajeeb-o-gareeb matching variations ko array me lapeta
      const statusGroups: Record<string, string[]> = {
        booked: ["Booked", "booked", "BOOKED"],
        verification: ["In Verification", "In verification", "verification", "UNDER_VERIFICATION", "under_verification", "Under Verification"],
        inkitchen: ["In Kitchen", "In kitchen", "inkitchen", "IN_KITCHEN", "in_kitchen"],
        outfordelivery: ["Out for Delivery", "Out for delivery", "outfordelivery", "OUT_FOR_DELIVERY", "out_for_delivery"],
        delivered: ["Delivered", "delivered", "DELIVERED"],
        cancelled: ["Cancelled", "cancelled", "CANCELLED"],
        notdelivered: ["Not Delivered", "notdelivered", "NOT_DELIVERED", "not_delivered"],
        baddelivery: ["Bad Delivery", "baddelivery", "BAD_DELIVERY", "bad_delivery"]
      };

      const filterKey = statusFilter.toLowerCase().trim();
      const allowedStatuses = statusGroups[filterKey] || [statusFilter];
      query = query.in("Status", allowedStatuses);
    }

    // New orders upar lane ke liye descending order
    query = query.order("CreatedAt", { ascending: false });
    const { data, error } = await query;

    if (error) {
      console.error("Orders query failed", error);
      return NextResponse.json({ error: "orders_fetch_failed", details: error.message }, { status: 500 });
    }

    // 🔹 NORMALIZATION MAP: Frontend ko ek clean standard standard formats bhejna
    const normalizedOrders = (data || []).map((row: any) => {
      const currentRaw = String(row.Status ?? "Booked").toLowerCase().replace(/[^a-z]/g, "");
      let finalStatus = "Booked"; // Safe Fallback

      if (currentRaw === "booked") finalStatus = "Booked";
      else if (currentRaw.includes("verification") || currentRaw.includes("under")) finalStatus = "In Verification";
      else if (currentRaw.includes("kitchen")) finalStatus = "In Kitchen";
      else if (currentRaw.includes("delivery") && currentRaw.includes("out")) finalStatus = "Out for Delivery";
      else if (currentRaw === "delivered") finalStatus = "Delivered";
      else if (currentRaw === "cancelled") finalStatus = "Cancelled";
      else if (currentRaw.includes("not")) finalStatus = "Not Delivered";
      else if (currentRaw.includes("bad")) finalStatus = "Bad Delivery";

      return {
        OrderId: row.OrderId, Status: finalStatus, RestroCode: row.RestroCode, RestroName: row.RestroName,
        StationCode: row.StationCode, StationName: row.StationName, DeliveryDate: row.DeliveryDate,
        DeliveryTime: row.DeliveryTime, TrainNumber: row.TrainNumber, Coach: row.Coach, Seat: row.Seat,
        CustomerName: row.CustomerName, CustomerMobile: row.CustomerMobile, TotalAmount: Number(row.TotalAmount ?? 0),
        history: Array.isArray(row.history) ? row.history : []
      };
    });

    return NextResponse.json({ ok: true, orders: normalizedOrders });
  } catch (err: any) {
    return NextResponse.json({ error: "server_error", details: err?.message }, { status: 500 });
  }
}
