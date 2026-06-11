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

async function fetchByOrderIds(tableName: string, orderIds: string[]) {
  const allRows: any[] = [];
  const chunkSize = 300;

  for (let i = 0; i < orderIds.length; i += chunkSize) {
    const chunk = orderIds.slice(i, i + chunkSize);

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .in("OrderId", chunk);

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

    for (const item of itemsRows) {
      const orderId = String(pick(item, "OrderId", "orderId")).trim();
      const itemName = String(pick(item, "ItemName", "itemName") || "Item").trim();
      const qty = String(pick(item, "Quantity", "quantity") || "1").trim();

      const text = `${itemName}*${qty}`;
      itemsMap[orderId] = itemsMap[orderId]
        ? `${itemsMap[orderId]}, ${text}`
        : text;
    }

    const historyMap: Record<string, string> = {};

    for (const log of historyRows) {
      const orderId = String(pick(log, "OrderId", "orderId")).trim();

      const oldStatus = String(pick(log, "OldStatus", "oldStatus")).trim();
      const newStatus = String(pick(log, "NewStatus", "newStatus")).trim();
      const subStatus = String(pick(log, "SubStatus", "subStatus")).trim();
      const remarks = String(pick(log, "Remarks", "remarks", "Note", "note")).trim();
      const changedBy = String(pick(log, "ChangedBy", "changedBy", "UserName", "userName")).trim();
      const changedAt = String(pick(log, "ChangedAt", "changedAt", "CreatedAt", "created_at")).trim();

      const parts = [
        oldStatus && newStatus ? `${oldStatus} → ${newStatus}` : newStatus,
        subStatus ? `Sub: ${subStatus}` : "",
        remarks ? `Remarks: ${remarks}` : "",
        changedBy ? `By: ${changedBy}` : "",
        changedAt ? `At: ${changedAt}` : "",
      ].filter(Boolean);

      const text = parts.join(" | ");

      historyMap[orderId] = historyMap[orderId]
        ? `${historyMap[orderId]} || ${text}`
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
      "Order Process History",
      "Order Status",
      "Sub Status",
      "Total Amount",
      "Booked At",
    ];

    const csvRows = orders.map((row: any) => {
      const orderId = String(pick(row, "OrderId", "id")).trim();

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
        historyMap[orderId] || "",
        pick(row, "Status", "status"),
        pick(row, "SubStatus", "subStatus"),
        pick(row, "TotalAmount", "totalAmount"),
        pick(row, "CreatedAt", "createdAt", "created_at"),
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
