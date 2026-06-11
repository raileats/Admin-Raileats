export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type TabKey =
  | "booked"
  | "verification"
  | "neworder"
  | "inkitchen"
  | "outfordelivery"
  | "delivered"
  | "cancelled"
  | "notdelivered"
  | "baddelivery";

const STATUS_COLUMNS = [
  "Booked",
  "In Verification",
  "New Order",
  "In Kitchen",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Not Delivered",
  "Bad Delivery",
];

function csvEscape(value: any) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function pick(row: any, ...keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function getTabStatus(row: any): TabKey {
  const rawStatus = String(pick(row, "Status", "status") || "Booked")
    .toLowerCase()
    .trim();

  if (rawStatus === "booked") return "booked";
  if (rawStatus === "verification" || rawStatus === "in verification") return "verification";
  if (rawStatus === "neworder" || rawStatus === "new order") return "neworder";
  if (rawStatus === "inkitchen" || rawStatus === "in kitchen") return "inkitchen";
  if (rawStatus === "outfordelivery" || rawStatus === "out for delivery") return "outfordelivery";

  if (rawStatus === "delivered") {
    const sub = String(pick(row, "SubStatus", "subStatus")).toLowerCase().trim();
    return sub === "bad delivery" ? "baddelivery" : "delivered";
  }

  if (rawStatus === "cancelled") return "cancelled";
  if (rawStatus === "notdelivered" || rawStatus === "not delivered") return "notdelivered";
  if (rawStatus === "baddelivery" || rawStatus === "bad delivery") return "baddelivery";

  return "booked";
}

function normalizeStatusName(value: any) {
  const s = String(value ?? "").trim().toLowerCase();

  if (s === "booked") return "Booked";
  if (s === "verification" || s === "in verification") return "In Verification";
  if (s === "neworder" || s === "new order") return "New Order";
  if (s === "inkitchen" || s === "in kitchen") return "In Kitchen";
  if (s === "outfordelivery" || s === "out for delivery") return "Out for Delivery";
  if (s === "delivered") return "Delivered";
  if (s === "cancelled") return "Cancelled";
  if (s === "notdelivered" || s === "not delivered") return "Not Delivered";
  if (s === "baddelivery" || s === "bad delivery") return "Bad Delivery";

  return String(value ?? "").trim();
}

function formatLogCell(log: any) {
  const oldStatus = normalizeStatusName(pick(log, "OldStatus", "oldStatus"));
  const newStatus = normalizeStatusName(pick(log, "NewStatus", "newStatus", "Status", "status"));
  const note = String(pick(log, "Note", "note")).trim();
  const remarks = String(pick(log, "Remarks", "remarks")).trim();
  const by = String(pick(log, "ChangedBy", "changedBy", "Actor", "actor")).trim();
  const at = String(pick(log, "ChangedAt", "changedAt", "CreatedAt", "created_at")).trim();

  const statusText =
    oldStatus && newStatus
      ? `${oldStatus} → ${newStatus}`
      : newStatus || oldStatus;

  return [
    statusText,
    remarks ? `Remarks: ${remarks}` : note ? `Remarks: ${note}` : "",
    by ? `By: ${by}` : "",
    at ? `At: ${at}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

async function fetchByOrderIds(tableName: string, orderIds: string[], orderColumn = "OrderId") {
  const allRows: any[] = [];
  const chunkSize = 300;

  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .in(orderColumn, chunk);

    if (error) throw error;
    allRows.push(...(data || []));
  }

  return allRows;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const status = String(url.searchParams.get("status") || "booked") as TabKey;
    const searchType = String(url.searchParams.get("searchType") || "orderId");
    const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const deliveryDate = String(url.searchParams.get("deliveryDate") || "").trim();
    const outlet = String(url.searchParams.get("outlet") || "").trim().toLowerCase();

    const { data: ordersData, error: ordersError } = await supabase
      .from("Orders")
      .select("*")
      .range(0, 4999);

    if (ordersError) throw ordersError;

    let orders = (ordersData || []).filter((row: any) => getTabStatus(row) === status);

    if (q) {
      orders = orders.filter((row: any) => {
        const orderId = String(pick(row, "OrderId", "id")).toLowerCase();
        const customerMobile = String(pick(row, "CustomerMobile", "customerMobile")).toLowerCase();
        const outletId = String(pick(row, "RestroCode", "restroCode")).toLowerCase();
        const outletName = String(pick(row, "RestroName", "restroName")).toLowerCase();
        const stationCode = String(pick(row, "StationCode", "stationCode")).toLowerCase();
        const stationName = String(pick(row, "StationName", "stationName")).toLowerCase();
        const trainNo = String(pick(row, "TrainNumber", "trainNumber")).toLowerCase();

        if (searchType === "customerMobile") return customerMobile.includes(q);
        if (searchType === "orderId") return orderId.includes(q);
        if (searchType === "outletId") return outletId.includes(q) || outletName.includes(q);
        if (searchType === "stationCode") return stationCode.includes(q) || stationName.includes(q);
        if (searchType === "trainNo") return trainNo.includes(q);

        return orderId.includes(q);
      });
    }

    if (deliveryDate) {
      orders = orders.filter(
        (row: any) => String(pick(row, "DeliveryDate", "deliveryDate")) === deliveryDate
      );
    }

    if (outlet) {
      orders = orders.filter((row: any) => {
        const outletId = String(pick(row, "RestroCode", "restroCode")).toLowerCase();
        const outletName = String(pick(row, "RestroName", "restroName")).toLowerCase();
        return outletId.includes(outlet) || outletName.includes(outlet);
      });
    }

    orders.sort((a: any, b: any) => {
      const aDate = String(pick(a, "DeliveryDate", "deliveryDate"));
      const aTime = String(pick(a, "DeliveryTime", "deliveryTime") || "00:00:00");
      const bDate = String(pick(b, "DeliveryDate", "deliveryDate"));
      const bTime = String(pick(b, "DeliveryTime", "deliveryTime") || "00:00:00");

      return (
        new Date(`${aDate}T${aTime}`).getTime() -
        new Date(`${bDate}T${bTime}`).getTime()
      );
    });

    const orderIds = orders
      .map((row: any) => String(pick(row, "OrderId", "id")).trim())
      .filter(Boolean);

    const [itemsRows, historyRows] = orderIds.length
      ? await Promise.all([
          fetchByOrderIds("OrderItems", orderIds),
          fetchByOrderIds("OrderStatusHistory", orderIds),
        ])
      : [[], []];

    const itemsMap: Record<string, string> = {};
    const itemPricingMap: Record<string, string> = {};

    for (const item of itemsRows) {
      const orderId = String(pick(item, "OrderId", "orderId")).trim();
      const itemName = String(pick(item, "ItemName", "itemName") || "Item").trim();
      const qty = String(pick(item, "Quantity", "quantity") || "1").trim();

      const sellingPrice = pick(item, "SellingPrice", "sellingPrice");
      const lineTotal = pick(item, "LineTotal", "lineTotal");

      const text = `${itemName}*${qty}`;
      const pricingText = `${itemName}*${qty} @ ${sellingPrice || "-"} = ${lineTotal || "-"}`;

      itemsMap[orderId] = itemsMap[orderId]
        ? `${itemsMap[orderId]}, ${text}`
        : text;

      itemPricingMap[orderId] = itemPricingMap[orderId]
        ? `${itemPricingMap[orderId]}, ${pricingText}`
        : pricingText;
    }

    const historyStageMap: Record<string, Record<string, string>> = {};

    for (const log of historyRows) {
      const orderId = String(pick(log, "OrderId", "orderId")).trim();
      const newStatus = normalizeStatusName(pick(log, "NewStatus", "newStatus", "Status", "status"));
      const stage = STATUS_COLUMNS.includes(newStatus) ? newStatus : "Booked";
      const text = formatLogCell(log);

      if (!historyStageMap[orderId]) historyStageMap[orderId] = {};

      historyStageMap[orderId][stage] = historyStageMap[orderId][stage]
        ? `${historyStageMap[orderId][stage]} || ${text}`
        : text;
    }

    const headers = [
      "Order ID",
      "Outlet ID",
      "Outlet Name",
      "Station Code",
      "Station Name",
      "Delivery Date",
      "Delivery Time",
      "Train No.",
      "Coach",
      "Seat",
      "Customer Name",
      "Customer Mobile",
      "Items",
      "Item Pricing",
      "Sub Total",
      "GST Amount",
      "Platform Charge",
      "Total Amount",
      "Payment Mode",
      "Order Status",
      "Sub Status",
      "Booked Status Log",
      "In Verification Status Log",
      "New Order Status Log",
      "In Kitchen Status Log",
      "Out for Delivery Status Log",
      "Delivered Status Log",
      "Cancelled Status Log",
      "Not Delivered Status Log",
      "Bad Delivery Status Log",
      "Order Remarks",
      "Booked At",
      "Updated At",
    ];

    const csvRows = orders.map((row: any) => {
      const orderId = String(pick(row, "OrderId", "id")).trim();
      const stageLogs = historyStageMap[orderId] || {};

      const orderRemarks = [
        pick(row, "SubStatus", "subStatus") ? `SubStatus: ${pick(row, "SubStatus", "subStatus")}` : "",
        stageLogs["Cancelled"] || "",
        stageLogs["Not Delivered"] || "",
        stageLogs["Bad Delivery"] || "",
      ]
        .filter(Boolean)
        .join(" || ");

      return [
        orderId,
        pick(row, "RestroCode", "restroCode"),
        pick(row, "RestroName", "restroName"),
        pick(row, "StationCode", "stationCode"),
        pick(row, "StationName", "stationName"),
        pick(row, "DeliveryDate", "deliveryDate"),
        pick(row, "DeliveryTime", "deliveryTime"),
        pick(row, "TrainNumber", "trainNumber"),
        pick(row, "Coach", "coach"),
        pick(row, "Seat", "seat"),
        pick(row, "CustomerName", "customerName"),
        pick(row, "CustomerMobile", "customerMobile"),
        itemsMap[orderId] || "",
        itemPricingMap[orderId] || "",
        pick(row, "SubTotal", "subTotal"),
        pick(row, "GSTAmount", "gstAmount"),
        pick(row, "PlatformCharge", "platformCharge"),
        pick(row, "TotalAmount", "totalAmount"),
        pick(row, "PaymentMode", "paymentMode"),
        pick(row, "Status", "status"),
        pick(row, "SubStatus", "subStatus"),
        stageLogs["Booked"] || "",
        stageLogs["In Verification"] || "",
        stageLogs["New Order"] || "",
        stageLogs["In Kitchen"] || "",
        stageLogs["Out for Delivery"] || "",
        stageLogs["Delivered"] || "",
        stageLogs["Cancelled"] || "",
        stageLogs["Not Delivered"] || "",
        stageLogs["Bad Delivery"] || "",
        orderRemarks,
        pick(row, "CreatedAt", "createdAt", "created_at"),
        pick(row, "UpdatedAt", "updatedAt", "updated_at"),
      ];
    });

    const csv = [
      headers.map(csvEscape).join(","),
      ...csvRows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");

    const today = new Date().toISOString().slice(0, 10);
    const fileName = `Orders_Report_${status}_${today}.csv`;

    return new NextResponse("\ufeff" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Orders report failed" },
      { status: 500 }
    );
  }
}
