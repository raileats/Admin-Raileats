import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";

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

    // 1) RestroMaster lookup with literal double quotes wrapper
    const { data: restroData, error: restroErr } = await supa
      .from('"RestroMaster"')
      .select("RestroCode, RestroName, StationCode, StationName")
      .eq("RestroCode", restroCodeNum)
      .maybeSingle();

    const restro = (restroData || null) as RestroMasterRow | null;

    if (restroErr) {
      console.error("RestroMaster error", restroErr);
      return NextResponse.json({ error: "restro_lookup_failed", details: restroErr.message }, { status: 500 });
    }
    if (!restro) {
      return NextResponse.json({ error: "restro_not_found" }, { status: 400 });
    }

    // 2) Menu rows lookup with standard table identifier
    const itemIds = body.items.map((i) => i.item_id);
    const { data: menuRowsData, error: menuErr } = await supa
      .from('"RestroMenuItems"')
      .select(
        "id, restro_code, item_code, item_name, item_description, item_category, item_cuisine, menu_type, base_price, gst_percent, selling_price"
      )
      .in("id", itemIds);

    if (menuErr) {
      console.error("Menu lookup error", menuErr);
      return NextResponse.json({ error: "menu_lookup_failed", details: menuErr.message }, { status: 500 });
    }

    const menuRows = (menuRowsData || []) as MenuRow[];
    const menuById = new Map<number, MenuRow>();
    menuRows.forEach((row) => menuById.set(row.id, row));

    // 3) OrderId & time setup
    const orderId = generateOrderId();
    const nowIso = new Date().toISOString();

    const { customer, delivery, pricing } = body;
    const deliveryDate = delivery.delivery_date || todayYMD();
    const deliveryTime = delivery.delivery_time || timeHM();

    // 4) Orders table insert with exact Database format casing "Booked"
    const { error: orderInsertErr } = await supa.from('"Orders"').insert({
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
      Status: "Booked", 
      JourneyPayload: body.meta ?? null,
      CreatedAt: nowIso,
      UpdatedAt: nowIso,
    });

    if (orderInsertErr) {
      console.error("Orders insert error", orderInsertErr);
      return NextResponse.json({ error: "order_insert_failed", details: orderInsertErr.message }, { status: 500 });
    }

    // 5) OrderItems table insert with proper dynamic parameters
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

    const { error: itemsInsertErr } = await supa.from('"OrderItems"').insert(orderItemsPayload);

    if (itemsInsertErr) {
      console.error("OrderItems insert error", itemsInsertErr);
    }

    // 6) OrderStatusHistory setup for tracking initial creation
    try {
      await supa.from('"OrderStatusHistory"').insert({
        OrderId: orderId,
        OldStatus: null,
        NewStatus: "Booked",
        Note: "Order created from website",
        ChangedBy: "system",
        ChangedAt: nowIso,
      });
    } catch (hErr) {
      console.error("OrderStatusHistory bypass log:", hErr);
    }

    return NextResponse.json({ ok: true, order_id: orderId });
  } catch (err: any) {
    console.error("orders.POST error", err);
    return NextResponse.json({ error: "server_error", details: err?.message }, { status: 500 });
  }
}

/* ========= GET: fetch orders for Admin UI with Audit Tracking ========= */
export async function GET(req: Request) {
  try {
    const supa = serviceClient;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status"); 

    // Relational mapping queries with wrapped case-sensitive identifiers
    let query = supa
      .from('"Orders"')
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
        Status,
        history: "OrderStatusHistory" (
          OrderId,
          OldStatus,
          NewStatus,
          Note,
          ChangedBy,
          ChangedAt
        )
      `);

    if (statusFilter) {
      const statusMap: Record<string, string> = {
        booked: "Booked",
        verification: "In Verification",
        inverification: "In Verification",
        inkitchen: "In Kitchen",
        outfordelivery: "Out for Delivery",
        delivered: "Delivered",
        cancelled: "Cancelled",
        notdelivered: "Not Delivered",
        baddelivery: "Bad Delivery",
      };

      const normalizedFilter = statusMap[statusFilter.toLowerCase()] || statusFilter;
      query = query.eq("Status", normalizedFilter);
    }

    query = query.order("CreatedAt", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Orders GET failure log:", error);
      return NextResponse.json({ 
        error: "orders_fetch_failed", 
        details: error.message 
      }, { status: 500 });
    }

    // Explicit format restructuring so frontend receives perfect layout
    const formattedOrders = (data || []).map((row: any) => ({
      OrderId: row.OrderId,
      Status: row.Status || "Booked",
      RestroCode: row.RestroCode,
      RestroName: row.RestroName,
      StationCode: row.StationCode,
      StationName: row.StationName,
      DeliveryDate: row.DeliveryDate, 
      DeliveryTime: row.DeliveryTime, 
      TrainNumber: row.TrainNumber,
      Coach: row.Coach,
      Seat: row.Seat,
      CustomerName: row.CustomerName,
      CustomerMobile: row.CustomerMobile,
      TotalAmount: Number(row.TotalAmount ?? 0),
      history: Array.isArray(row.history) ? row.history : [],
    }));

    return NextResponse.json({ ok: true, orders: formattedOrders });
  } catch (err: any) {
    console.error("orders.GET execution runtime error", err);
    return NextResponse.json({ error: "server_error", details: err?.message }, { status: 500 });
  }
}
