// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

/**
 * Expected payload from raileats.in CheckoutClient:
 *
 * {
 *   restro_code: "1005",
 *   customer: { full_name, phone, pnr },
 *   delivery: { train_no, coach, seat, note },
 *   pricing: { subtotal, delivery_fee, total, currency },
 *   items: [
 *     { item_id, name, qty, base_price, line_total }
 *   ],
 *   meta: { ... }
 * }
 */

type Payload = {
  restro_code: string | number;
  customer: {
    full_name: string;
    phone: string;
    pnr?: string | null;
  };
  delivery: {
    train_no: string;
    coach: string;
    seat: string;
    note?: string | null;
  };
  pricing: {
    subtotal: number;
    delivery_fee?: number | null;
    total: number;
    currency?: string;
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
  item_code: string | null;
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

    // 1) Restro master se details lao
    const { data: restro, error: restroErr } = await supa
      .from<RestroMasterRow>("RestroMaster")
      .select("RestroCode, RestroName, StationCode, StationName")
      .eq("RestroCode", restroCodeNum)
      .maybeSingle();

    if (restroErr) {
      console.error("RestroMaster error", restroErr);
      return NextResponse.json({ error: "restro_lookup_failed" }, { status: 500 });
    }
    if (!restro) {
      return NextResponse.json({ error: "restro_not_found" }, { status: 400 });
    }

    // 2) Menu se item details lao (so that OrderItems me full info save ho)
    const itemIds = body.items.map((i) => i.item_id);
    const { data: menuRows, error: menuErr } = await supa
      .from<MenuRow>("RestroMenuItems")
      .select(
        "id, restro_code, item_code, item_name, item_description, item_category, item_cuisine, menu_type, base_price, gst_percent, selling_price"
      )
      .in("id", itemIds);

    if (menuErr) {
      console.error("Menu lookup error", menuErr);
      return NextResponse.json({ error: "menu_lookup_failed" }, { status: 500 });
    }

    const menuById = new Map<number, MenuRow>();
    (menuRows || []).forEach((row) => menuById.set(row.id, row));

    // 3) OrderId generate karo
    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const deliveryDate = todayYMD(); // abhi ke liye aaj ki date
    const deliveryTime = timeHM();   // abhi ke liye current time

    const { customer, delivery, pricing } = body;

    // 4) Orders table insert
    const { error: orderInsertErr } = await supa.from("Orders").insert({
      // ⚠️ yahan column naam bilkul Supabase table jaise rakho
      OrderId: orderId,
      RestroCode: restro.RestroCode,
      RestroName: restro.RestroName,
      StationCode: restro.StationCode,
      StationName: restro.StationName,
      DeliveryDate: deliveryDate,
      DeliveryTime: deliveryTime,
      TrainNo: delivery.train_no,
      Coach: delivery.coach,
      Seat: delivery.seat,
      CustomerName: customer.full_name,
      CustomerMobile: customer.phone,
      PNR: customer.pnr || null,
      SubTotal: pricing.subtotal,
      DeliveryFee: pricing.delivery_fee ?? 0,
      TotalAmount: pricing.total,
      PaymentMode: "COD", // abhi ke liye saare COD
      CurrentStatus: "booked",
      CreatedAt: now,
      UpdatedAt: now,
    });

    if (orderInsertErr) {
      console.error("Orders insert error", orderInsertErr);
      return NextResponse.json({ error: "order_insert_failed" }, { status: 500 });
    }

    // 5) OrderItems table insert
    const orderItemsPayload = body.items.map((it) => {
      const row = menuById.get(it.item_id);
      return {
        // ⚠️ columns ko apne OrderItems table ke according check kar lena
        OrderId: orderId,
        RestroCode: restro.RestroCode,
        ItemCode: row?.item_code ?? String(it.item_id),
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

    // 6) Status history me initial row "booked"
    const { error: histErr } = await supa.from("OrderStatusHistory").insert({
      OrderId: orderId,
      OldStatus: null,
      NewStatus: "booked",
      Note: "Order created",
      ChangedBy: "system",
      ChangedAt: now,
    });

    if (histErr) {
      console.error("OrderStatusHistory insert error", histErr);
      // yahan error aayega to bhi order ko fail nahi kar rahe
    }

    // final response jo CheckoutClient expect kar raha hai
    return NextResponse.json({ ok: true, order_id: orderId });
  } catch (err) {
    console.error("orders.POST error", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
