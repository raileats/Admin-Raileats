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
  | "cancellationrequest"
  | "neworder"
  | "inkitchen"
  | "outfordelivery"
  | "restromarkeddelivered"
  | "delivered"
  | "cancelled"
  | "notdelivered"
  | "baddelivery"
  | "partialdelivery"
  | "complaints"
  | "refund"
  | "all";

const ORDER_EXTRA_COLUMNS = [
  "SubTotal",
  "JourneyPayload",
  "BookingSource",
  "PNR",
  "BookedBy",
  "RestroPrice",
  "CouponCode",
  "CouponDiscount",
  "OrderPenalty",
  "CouponId",
  "Commission",
  "RestroDiscount",
  "REDiscount",
  "IGST",
  "CODAmount",
  "PPDAmount",
  "DiscountedBasePrice",
  "RestroMarkedDeliveredAt",
  "RestroMarkedStatus",
  "RestroMarkedSubStatus",
  "RestroMarkedRemarks",
  "RestroMarkedBy",
  "RestroMarkedAt",
  "RefundStatus",
  "RefundRequestedAmount",
  "RefundApprovedAmount",
  "RefundReference",
  "RefundReason",
  "RefundRemarks",
  "RefundRequestedAt",
  "RefundReviewedAt",
  "RefundApprovedAt",
  "RefundProcessingAt",
  "RefundCompletedAt",
  "RefundTransactionId",
  "RefundBy",
  "IsRefunded",
] as const;

const STAGE_COLUMN_GROUPS = [
  { key: "Booked", label: "Booked", prefix: "Booked" },
  {
    key: "In Verification",
    label: "In Verification",
    prefix: "InVerification",
  },
  {
    key: "Cancellation Request",
    label: "Cancellation Request",
    prefix: "CancellationRequest",
  },
  { key: "New Order", label: "New Order", prefix: "NewOrder" },
  { key: "In Kitchen", label: "In Kitchen", prefix: "InKitchen" },
  {
    key: "Out for Delivery",
    label: "Out for Delivery",
    prefix: "OutForDelivery",
  },
  {
    key: "Restro Marked Delivered",
    label: "Restro Marked Delivered",
    prefix: "RestroMarkedDelivered",
  },
  { key: "Complaints", label: "Complaints", prefix: "Complaints" },
  { key: "Delivered", label: "Delivered", prefix: "Delivered" },
  { key: "Cancelled", label: "Cancelled", prefix: "Cancelled" },
  {
    key: "Not Delivered",
    label: "Not Delivered",
    prefix: "NotDelivered",
  },
  { key: "Bad Delivery", label: "Bad Delivery", prefix: "BadDelivery" },
  {
    key: "Partial Delivery",
    label: "Partial Delivery",
    prefix: "PartialDelivery",
  },
  { key: "Refund", label: "Refund", prefix: "Refund" },
] as const;

const STATUS_COLUMNS = new Set<string>(STAGE_COLUMN_GROUPS.map((s) => s.key));

function csvEscape(value: any) {
  const text =
    value !== null && typeof value === "object"
      ? JSON.stringify(value)
      : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function pick(row: any, ...keys: string[]) {
  for (const key of keys) {
    const value = row?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
}

function formatDateOnly(value: any) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const clean = text.replace("T", " ").split("+")[0].split(".")[0];
  return clean.slice(0, 10);
}

function formatTimeOnly(value: any) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const clean = text.replace("T", " ").split("+")[0].split(".")[0];
  return clean.slice(11, 19);
}

function getTabStatus(row: any): TabKey {
  const rawStatus = String(pick(row, "Status", "status") || "Booked")
    .toLowerCase()
    .trim();

  if (rawStatus === "booked") return "booked";
  if (rawStatus === "verification" || rawStatus === "in verification") {
    return "verification";
  }
  if (
    rawStatus === "cancellationrequest" ||
    rawStatus === "cancellation request"
  ) {
    return "cancellationrequest";
  }
  if (rawStatus === "neworder" || rawStatus === "new order") {
    return "neworder";
  }
  if (rawStatus === "inkitchen" || rawStatus === "in kitchen") {
    return "inkitchen";
  }
  if (rawStatus === "outfordelivery" || rawStatus === "out for delivery") {
    return "outfordelivery";
  }
  if (
    rawStatus === "restromarkeddelivered" ||
    rawStatus === "restro marked delivered"
  ) {
    return "restromarkeddelivered";
  }

  if (rawStatus === "delivered") {
    const sub = String(pick(row, "SubStatus", "subStatus"))
      .toLowerCase()
      .trim();

    if (sub === "bad delivery") return "baddelivery";
    if (sub === "partial delivery") return "partialdelivery";
    return "delivered";
  }

  if (rawStatus === "cancelled") return "cancelled";
  if (rawStatus === "notdelivered" || rawStatus === "not delivered") {
    return "notdelivered";
  }
  if (rawStatus === "baddelivery" || rawStatus === "bad delivery") {
    return "baddelivery";
  }
  if (rawStatus === "partialdelivery" || rawStatus === "partial delivery") {
    return "partialdelivery";
  }
  if (rawStatus === "complaints" || rawStatus === "complaint") {
    return "complaints";
  }
  if (rawStatus === "refund") return "refund";

  return "booked";
}

function normalizeStatusName(value: any) {
  const s = String(value ?? "").trim().toLowerCase();

  if (s === "booked") return "Booked";
  if (s === "verification" || s === "in verification") {
    return "In Verification";
  }
  if (s === "cancellationrequest" || s === "cancellation request") {
    return "Cancellation Request";
  }
  if (s === "neworder" || s === "new order") return "New Order";
  if (s === "inkitchen" || s === "in kitchen") return "In Kitchen";
  if (s === "outfordelivery" || s === "out for delivery") {
    return "Out for Delivery";
  }
  if (
    s === "restromarkeddelivered" ||
    s === "restro marked delivered"
  ) {
    return "Restro Marked Delivered";
  }
  if (s === "complaints" || s === "complaint") return "Complaints";
  if (s === "delivered") return "Delivered";
  if (s === "cancelled") return "Cancelled";
  if (s === "notdelivered" || s === "not delivered") return "Not Delivered";
  if (s === "baddelivery" || s === "bad delivery") return "Bad Delivery";
  if (s === "partialdelivery" || s === "partial delivery") {
    return "Partial Delivery";
  }
  if (s === "refund") return "Refund";

  return String(value ?? "").trim();
}

function buildStatusText(log: any) {
  const oldStatus = normalizeStatusName(pick(log, "OldStatus", "oldStatus"));
  const newStatus = normalizeStatusName(
    pick(log, "NewStatus", "newStatus", "Status", "status")
  );

  if (oldStatus && newStatus && oldStatus !== newStatus) {
    return `${oldStatus} → ${newStatus}`;
  }

  return newStatus || oldStatus;
}

function getLogBy(log: any) {
  return String(
    pick(
      log,
      "UserType",
      "userType",
      "ActorType",
      "actorType",
      "ChangedBy",
      "changedBy",
      "UserName",
      "userName",
      "Actor",
      "actor"
    )
  ).trim();
}

function getLogSource(log: any) {
  return String(
    pick(log, "ActionSource", "actionSource", "Source", "source")
  ).trim();
}

function getLogAt(log: any) {
  return String(
    pick(log, "ChangedAt", "changedAt", "CreatedAt", "created_at")
  ).trim();
}

async function fetchByOrderIds(
  tableName: string,
  orderIds: string[],
  orderColumn = "OrderId"
) {
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
    const requestedOrderIds = String(url.searchParams.get("orderIds") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const requestedOrderIdSet = new Set(requestedOrderIds);
    const sortBy =
      url.searchParams.get("sortBy") === "booking" ? "booking" : "delivery";
    const searchType = String(url.searchParams.get("searchType") || "orderId");
    const q = String(url.searchParams.get("q") || "").trim().toLowerCase();
    const deliveryDate = String(
      url.searchParams.get("deliveryDate") || ""
    ).trim();
    const outlet = String(url.searchParams.get("outlet") || "")
      .trim()
      .toLowerCase();

    const { data: ordersData, error: ordersError } = await supabase
      .from("Orders")
      .select("*")
      .range(0, 4999);

    if (ordersError) throw ordersError;

    let orders = requestedOrderIds.length
      ? (ordersData || []).filter((row: any) =>
          requestedOrderIdSet.has(
            String(pick(row, "OrderId", "id")).trim()
          )
        )
      : status === "all"
        ? ordersData || []
        : (ordersData || []).filter((row: any) => getTabStatus(row) === status);

    if (q) {
      orders = orders.filter((row: any) => {
        const orderId = String(pick(row, "OrderId", "id")).toLowerCase();
        const customerMobile = String(
          pick(row, "CustomerMobile", "customerMobile")
        ).toLowerCase();
        const outletId = String(
          pick(row, "RestroCode", "restroCode")
        ).toLowerCase();
        const outletName = String(
          pick(row, "RestroName", "restroName")
        ).toLowerCase();
        const stationCode = String(
          pick(row, "StationCode", "stationCode")
        ).toLowerCase();
        const stationName = String(
          pick(row, "StationName", "stationName")
        ).toLowerCase();
        const trainNo = String(
          pick(row, "TrainNumber", "trainNumber")
        ).toLowerCase();

        if (searchType === "customerMobile") return customerMobile.includes(q);
        if (searchType === "orderId") return orderId.includes(q);
        if (searchType === "outletId") {
          return outletId.includes(q) || outletName.includes(q);
        }
        if (searchType === "stationCode") {
          return stationCode.includes(q) || stationName.includes(q);
        }
        if (searchType === "trainNo") return trainNo.includes(q);

        return orderId.includes(q);
      });
    }

    if (deliveryDate) {
      orders = orders.filter(
        (row: any) =>
          String(pick(row, "DeliveryDate", "deliveryDate")) === deliveryDate
      );
    }

    if (outlet) {
      orders = orders.filter((row: any) => {
        const outletId = String(
          pick(row, "RestroCode", "restroCode")
        ).toLowerCase();
        const outletName = String(
          pick(row, "RestroName", "restroName")
        ).toLowerCase();

        return outletId.includes(outlet) || outletName.includes(outlet);
      });
    }

    orders.sort((a: any, b: any) => {
      if (sortBy === "booking") {
        return (
          new Date(pick(b, "CreatedAt", "createdAt", "created_at") || 0).getTime() -
          new Date(pick(a, "CreatedAt", "createdAt", "created_at") || 0).getTime()
        );
      }

      const aDate = String(pick(a, "DeliveryDate", "deliveryDate"));
      const aTime = String(
        pick(a, "DeliveryTime", "deliveryTime") || "00:00:00"
      );
      const bDate = String(pick(b, "DeliveryDate", "deliveryDate"));
      const bTime = String(
        pick(b, "DeliveryTime", "deliveryTime") || "00:00:00"
      );

      return (
        new Date(`${bDate}T${bTime}`).getTime() -
        new Date(`${aDate}T${aTime}`).getTime()
      );
    });

    const orderIds = orders
      .map((row: any) => String(pick(row, "OrderId", "id")).trim())
      .filter(Boolean);

    const [itemsRows, historyRows, journeyRows] = orderIds.length
      ? await Promise.all([
          fetchByOrderIds("OrderItems", orderIds),
          fetchByOrderIds("OrderStatusHistory", orderIds),
          fetchByOrderIds("OrderJourney", orderIds),
        ])
      : [[], [], []];

    const itemsMap: Record<string, string> = {};
    const vendorPriceMap: Record<string, number> = {};

    for (const item of itemsRows) {
      const orderId = String(pick(item, "OrderId", "orderId")).trim();
      const itemName = String(
        pick(item, "ItemName", "itemName") || "Item"
      ).trim();
      const qty = String(pick(item, "Quantity", "quantity") || "1").trim();

const vendorPrice = Number(
  pick(
    item,
    "VendorPrice",
    "vendorPrice",
    "RestroPrice",
    "restroPrice",
    "BasePrice",
    "basePrice"
  ) || 0
);

const quantity = Number(qty || 1);

vendorPriceMap[orderId] =
  (vendorPriceMap[orderId] || 0) + vendorPrice * quantity;

const text = `${itemName}*${qty}`;
      itemsMap[orderId] = itemsMap[orderId]
        ? `${itemsMap[orderId]}, ${text}`
        : text;
    }

    const historyStageMap: Record<
      string,
      Record<
        string,
        {
          status: string;
          by: string;
          source: string;
          date: string;
          time: string;
          rawAt: string;
        }
      >
    > = {};

    for (const log of historyRows) {
      const orderId = String(pick(log, "OrderId", "orderId")).trim();

      const newStatus = normalizeStatusName(
        pick(log, "NewStatus", "newStatus", "Status", "status")
      );

      const stage = STATUS_COLUMNS.has(newStatus) ? newStatus : "Booked";
      const statusText = buildStatusText(log);
      const by = getLogBy(log);
      const source = getLogSource(log);
      const at = getLogAt(log);

      if (!historyStageMap[orderId]) {
        historyStageMap[orderId] = {};
      }

      const existing = historyStageMap[orderId][stage];

      if (
        !existing ||
        new Date(at || 0).getTime() >= new Date(existing.rawAt || 0).getTime()
      ) {
        historyStageMap[orderId][stage] = {
          status: statusText,
          by,
          source,
          date: formatDateOnly(at),
          time: formatTimeOnly(at),
          rawAt: at,
        };
      }
    }

    for (const journey of journeyRows) {
      const orderId = String(pick(journey, "OrderId", "orderId")).trim();
      if (!orderId) continue;

      if (!historyStageMap[orderId]) {
        historyStageMap[orderId] = {};
      }

      for (const stage of STAGE_COLUMN_GROUPS) {
        const update = pick(journey, `${stage.prefix}Update`);
        const userType = pick(journey, `${stage.prefix}UserType`);
        const userName = pick(journey, `${stage.prefix}UserName`);
        const source = pick(journey, `${stage.prefix}Source`);
        const date = String(
          pick(journey, `${stage.prefix}ActionAtDate`)
        ).trim();
        const time = String(
          pick(journey, `${stage.prefix}ActionAtTime`)
        ).trim();
        const hasJourneyStage = [
          update,
          userType,
          userName,
          source,
          date,
          time,
        ].some((value) => String(value ?? "").trim() !== "");

        if (!hasJourneyStage) continue;

        const existing = historyStageMap[orderId][stage.key];
        historyStageMap[orderId][stage.key] = {
          status:
            existing?.status || normalizeStatusName(update) || stage.label,
          by: String(userType || existing?.by || userName || "").trim(),
          source: String(source || existing?.source || "").trim(),
          date: date || existing?.date || "",
          time: time || existing?.time || "",
          rawAt:
            date
              ? `${date}T${time || "00:00:00"}+05:30`
              : existing?.rawAt || "",
        };
      }
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

      "Vendor Price",
      "Base Price",
      "GST",
      "Delivery Charge",
      "Final Selling",

      "Payment Mode",
      "Order Status",
      "Sub Status",

      ...ORDER_EXTRA_COLUMNS,

      ...STAGE_COLUMN_GROUPS.flatMap((stage) => [
        `${stage.label} Status`,
        `${stage.label} By`,
        `${stage.label} Source`,
        `${stage.label} Date`,
        `${stage.label} Time`,
      ]),

      "Order Remarks",
      "Booked Date",
      "Booked Time",
      "Updated Date",
      "Updated Time",
    ];

    const csvRows = orders.map((row: any) => {
      const orderId = String(pick(row, "OrderId", "id")).trim();
      const stageLogs = historyStageMap[orderId] || {};

      const createdAt = pick(row, "CreatedAt", "createdAt", "created_at");
      const updatedAt = pick(row, "UpdatedAt", "updatedAt", "updated_at");

      const orderRemarks = [
        pick(row, "Remarks", "remarks", "OrderRemarks", "orderRemarks")
          ? `Remarks: ${pick(
              row,
              "Remarks",
              "remarks",
              "OrderRemarks",
              "orderRemarks"
            )}`
          : "",
        pick(row, "SubStatus", "subStatus")
          ? `SubStatus: ${pick(row, "SubStatus", "subStatus")}`
          : "",
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

        vendorPriceMap[orderId] || "",

pick(row, "BasePrice", "basePrice", "SubTotal", "subTotal"),
        pick(
          row,
          "GST",
          "gst",
          "GSTAmount",
          "gstAmount",
          "TotalGST",
          "totalGST"
        ),
        pick(
          row,
          "DeliveryCharge",
          "deliveryCharge",
          "RaileatsCustomerDeliveryCharge",
          "CustomerDeliveryCharge",
          "PlatformCharge",
          "platformCharge"
        ),
        pick(
          row,
          "FinalSelling",
          "finalSelling",
          "FinalAmount",
          "finalAmount",
          "TotalAmount",
          "totalAmount"
        ),

        pick(row, "PaymentMode", "paymentMode", "PaymentMethod", "paymentMethod"),
        pick(row, "Status", "status"),
        pick(row, "SubStatus", "subStatus"),

        ...ORDER_EXTRA_COLUMNS.map((column) => row?.[column] ?? ""),

        ...STAGE_COLUMN_GROUPS.flatMap((stage) => [
          stageLogs[stage.key]?.status || "",
          stageLogs[stage.key]?.by || "",
          stageLogs[stage.key]?.source || "",
          stageLogs[stage.key]?.date || "",
          stageLogs[stage.key]?.time || "",
        ]),

        orderRemarks,
        formatDateOnly(createdAt),
        formatTimeOnly(createdAt),
        formatDateOnly(updatedAt),
        formatTimeOnly(updatedAt),
      ];
    });

    const csv = [
      headers.map(csvEscape).join(","),
      ...csvRows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");

    const now = new Date();

const downloadDateTime = now
  .toLocaleString("sv-SE", {
    timeZone: "Asia/Kolkata",
    hour12: false,
  })
  .replace(" ", "_")
  .replace(/:/g, "_");

const statusLabel =
  status === "all"
    ? "All"
    : status === "booked"
    ? "Booked"
    : status === "verification"
    ? "In_Verification"
    : status === "cancellationrequest"
    ? "Cancellation_Request"
    : status === "neworder"
    ? "New_Order"
    : status === "inkitchen"
    ? "In_Kitchen"
    : status === "outfordelivery"
    ? "Out_for_Delivery"
    : status === "restromarkeddelivered"
    ? "Restro_Mark_Delivered"
    : status === "delivered"
    ? "Delivered"
    : status === "cancelled"
    ? "Cancelled"
    : status === "notdelivered"
    ? "Not_Delivered"
    : status === "baddelivery"
    ? "Bad_Delivery"
    : status === "partialdelivery"
    ? "Partial_Delivery"
    : status === "complaints"
    ? "Complaints"
    : status === "refund"
    ? "Refund"
    : status;

const fileName = `Order Report ${statusLabel}_${downloadDateTime}.csv`;

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
