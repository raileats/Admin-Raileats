"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Bell,
  Clock,
  Copy,
  Eye,
  MapPin,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type TabKey =
  | "booked"
  | "verification"
  | "cancellationrequest"
  | "neworder"
  | "inkitchen"
  | "outfordelivery"
  | "delivered"
  | "cancelled"
  | "notdelivered"
  | "baddelivery"
  | "complaints"
  | "refund"
  | "all";

type OrderHistoryItem = {
  at: string;
  by: string;
  note?: string;
  status: TabKey;
};
type Order = {
  id: string;
  status: TabKey;
  dbStatus: string;
  outletId: string;
  outletName: string;
  stationCode: string;
  stationName: string;
  deliveryDate: string;
  deliveryTime: string;
  trainNo?: string;
  coach?: string;
  seat?: string;
  customerName: string;
  customerMobile: string;
  paymentMode?: string;
  total?: string;
  history: OrderHistoryItem[];
  rawCreatedAt?: string; // Correct fallback sorting key for booking chronology
  raw?: any;
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "booked", label: "Booked" },
  { key: "verification", label: "In Verification" },
  {
    key: "cancellationrequest",
    label: "Cancellation Request",
  },
  { key: "neworder", label: "New Order" },
  { key: "inkitchen", label: "In Kitchen" },
  { key: "outfordelivery", label: "Out for Delivery" },
  { key: "complaints", label: "Complaints" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "notdelivered", label: "Not Delivered" },
  { key: "refund", label: "Refund" },
  { key: "baddelivery", label: "Bad Delivery" },
  { key: "all", label: "All" },
];
const CANCEL_REASONS = [
  "Customer Plan Change",
  "Customer Call Not Connect",
  "Delivery Boy Missed",
  "Restro Closed",
  "Train Late",
  "Train Divert",
  "Item Issue",
  "Restro Refused without Reason",
  "Other",
  "Low & Order",
  "Natural Calamity",
];

const NOT_DELIVERED_REASONS = [
  "Restro Missed",
  "Late Processing",
  "Technical Issue",
];

const DELIVERED_REASONS = ["Delivered", "Bad Delivery"];

const ORDER_PENALTY_BY_SUB_STATUS: Record<string, number> = {
  "Customer Plan Change": 0,
  "Customer Call Not Connect": 0,
  "Customer Not on Seat": 0,
  "Customer Refused Delivery": 0,
  "Delivery Boy Missed": 100,
  "Restro Closed": 100,
  "Train Late": 0,
  "Train Divert": 0,
  "Item Issue": 100,
  "Restro Refused without Reason": 100,
  Other: 0,
  "Low & Order": 0,
  "Natural Calamity": 0,
  "Bad Delivery": 50,
};

type OutcomeOption = {
  key: string;
  label: string;
  dbValue: string;
  targetTab: TabKey;
  vendorPenalty: number;
  manualPenalty?: boolean;
};

const OUT_FOR_DELIVERY_OUTCOME_OPTIONS: OutcomeOption[] = [
  {
    key: "Partial Delivery",
    label: "Partial Delivery",
    dbValue: "Delivered",
    targetTab: "delivered",
    vendorPenalty: 0,
    manualPenalty: true,
  },
  {
    key: "Bad Delivery",
    label: "Bad Delivery",
    dbValue: "Delivered",
    targetTab: "baddelivery",
    vendorPenalty: 50,
  },
  {
    key: "Customer Plan Change",
    label: "Customer Plan Change",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Customer Call Not Connect",
    label: "Customer Call Not Connect",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Customer Not on Seat",
    label: "Customer Not on Seat",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Customer Refused Delivery",
    label: "Customer Refused Delivery",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Delivery Boy Missed",
    label: "Delivery Boy Missed",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 100,
  },
  {
    key: "Restro Closed",
    label: "Restro Closed",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 100,
  },
  {
    key: "Train Late",
    label: "Train Late",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Train Divert",
    label: "Train Divert",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Item Issue",
    label: "Item Issue",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 100,
  },
  {
    key: "Restro Refused without Reason",
    label: "Restro Refused without Reason",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 100,
  },
  {
    key: "Other",
    label: "Other",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Low & Order",
    label: "Low & Order",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
  {
    key: "Natural Calamity",
    label: "Natural Calamity",
    dbValue: "Not Delivered",
    targetTab: "notdelivered",
    vendorPenalty: 0,
  },
];

const OUT_FOR_DELIVERY_NOT_DELIVERED_REASONS =
  OUT_FOR_DELIVERY_OUTCOME_OPTIONS.filter(
    (option) => option.dbValue === "Not Delivered",
  ).map((option) => option.label);

const NEXT_MAP: Record<
  TabKey,
  {
    next: TabKey | null;
    actionLabel: string;
    dbValue: string;
  }
> = {
  booked: {
    next: "verification",
    actionLabel: "Move to In Verification",
    dbValue: "In Verification",
  },

  verification: {
    next: "neworder",
    actionLabel: "Send to Restaurant",
    dbValue: "New Order",
  },

  cancellationrequest: {
    next: null,
    actionLabel: "",
    dbValue: "Cancellation Request",
  },

  neworder: {
    next: "inkitchen",
    actionLabel: "Move to In Kitchen",
    dbValue: "In Kitchen",
  },

  inkitchen: {
    next: "outfordelivery",
    actionLabel: "Move to Out for Delivery 🛵",
    dbValue: "Out for Delivery",
  },

  outfordelivery: {
    next: "delivered",
    actionLabel: "Mark as Delivered ✅",
    dbValue: "Delivered",
  },

  delivered: {
    next: null,
    actionLabel: "",
    dbValue: "Delivered",
  },

  cancelled: {
    next: null,
    actionLabel: "",
    dbValue: "Cancelled",
  },

  notdelivered: {
    next: null,
    actionLabel: "",
    dbValue: "Not Delivered",
  },

  baddelivery: {
    next: null,
    actionLabel: "",
    dbValue: "Bad Delivery",
  },

  complaints: { next: null, actionLabel: "", dbValue: "Complaints" },
  refund: { next: null, actionLabel: "", dbValue: "Refund" },

  all: {
    next: null,
    actionLabel: "",
    dbValue: "All",
  },
};
const FINAL_MARK_OPTIONS = [
  { key: "delivered", label: "Delivered", dbValue: "Delivered" },
  { key: "cancelled", label: "Cancelled", dbValue: "Cancelled" },
  { key: "notdelivered", label: "Not Delivered", dbValue: "Not Delivered" },
  { key: "baddelivery", label: "Bad Delivery", dbValue: "Bad Delivery" },
] as const;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type SearchType =
  | "customerMobile"
  | "orderId"
  | "outletId"
  | "stationCode"
  | "deliveryDate"
  | "trainNo";

type TrainRouteRow = Record<string, any> & {
  trainNumber?: number | string;
  trainNumber_text?: string;
  trainName?: string;
  StnNumber?: number | string;
  StationCode?: string;
  StationName?: string;
  Arrives?: string;
  Departs?: string;
  Platform?: string;
  Day?: number | string;
};

const normalizeRouteValue = (value: unknown) => String(value ?? "").trim();

const getRouteField = (row: TrainRouteRow, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "")
      return value;
  }
  return "";
};

const rowMatchesTrain = (row: TrainRouteRow, trainNo: string) => {
  const candidates = [
    getRouteField(row, "trainNumber", "TrainNumber", "trainnumber"),
    getRouteField(
      row,
      "trainNumber_text",
      "TrainNumber_text",
      "trainnumber_text",
    ),
    getRouteField(row, "TrainNo", "trainNo", "train_no"),
  ];

  return candidates.some((value) => normalizeRouteValue(value) === trainNo);
};

const AUTO_VERIFICATION_BEFORE_MINUTES = 90;
const AUTO_OUT_FOR_DELIVERY_BEFORE_MINUTES = 5;
const SYSTEM_AUTO_ACTOR = { userType: "Auto", userName: "System" };
const AUTO_SYNC_TABS: TabKey[] = [
  "booked",
  "verification",
  "cancellationrequest",
  "inkitchen",
];

const parseOrderDeliveryDateTime = (
  deliveryDate?: string,
  deliveryTime?: string,
) => {
  const rawDate = String(deliveryDate || "").trim();
  const rawTime = String(deliveryTime || "00:00").trim();

  if (!rawDate) return null;

  let year = "";
  let month = "";
  let day = "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    [year, month, day] = rawDate.split("-");
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
    [day, month, year] = rawDate.split("-");
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
    [day, month, year] = rawDate.split("/");
  }

  if (!year || !month || !day) {
    const fallback = new Date(`${rawDate} ${rawTime}`);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [hour = "00", minute = "00"] = rawTime.split(":");
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const shouldAutoMoveBookedToVerification = (order: Order) => {
  if (order.status !== "booked") return false;

  const deliveryDateTime = parseOrderDeliveryDateTime(
    order.deliveryDate,
    order.deliveryTime,
  );

  if (!deliveryDateTime) return false;

  const now = new Date();
  const minutesUntilDelivery =
    (deliveryDateTime.getTime() - now.getTime()) / (1000 * 60);

  return (
    minutesUntilDelivery > 0 &&
    minutesUntilDelivery <= AUTO_VERIFICATION_BEFORE_MINUTES
  );
};

const isPrepaidOrder = (order: Order) => {
  const mode = String(order.paymentMode || "")
    .trim()
    .toLowerCase();

  if (!mode) return false;

  return ["prepaid", "ppd", "online", "paid", "paytm", "upi"].some((token) =>
    mode.includes(token),
  );
};

const shouldAutoMoveVerificationToNewOrder = (order: Order) => {
  if (order.status !== "verification") return false;
  if (!isPrepaidOrder(order)) return false;

  const deliveryDateTime = parseOrderDeliveryDateTime(
    order.deliveryDate,
    order.deliveryTime,
  );

  if (!deliveryDateTime) return false;

  const now = new Date();
  const minutesUntilDelivery =
    (deliveryDateTime.getTime() - now.getTime()) / (1000 * 60);

  return (
    minutesUntilDelivery > 0 &&
    minutesUntilDelivery <= AUTO_VERIFICATION_BEFORE_MINUTES
  );
};

const shouldAutoMoveKitchenToOutForDelivery = (order: Order) => {
  if (order.status !== "inkitchen") return false;

  const deliveryDateTime = parseOrderDeliveryDateTime(
    order.deliveryDate,
    order.deliveryTime,
  );

  if (!deliveryDateTime) return false;

  const now = new Date();
  const minutesUntilDelivery =
    (deliveryDateTime.getTime() - now.getTime()) / (1000 * 60);

  return (
    minutesUntilDelivery > 0 &&
    minutesUntilDelivery <= AUTO_OUT_FOR_DELIVERY_BEFORE_MINUTES
  );
};

const shouldAutoMoveToCancellationRequest = (order: Order) => {
  if (order.status !== "booked" && order.status !== "verification") {
    return false;
  }

  const deliveryDateTime = parseOrderDeliveryDateTime(
    order.deliveryDate,
    order.deliveryTime,
  );

  if (!deliveryDateTime) return false;

  return deliveryDateTime.getTime() <= Date.now();
};

const mapOrderRowToOrder = (row: any): Order => {
  const rawStatus = String(row.status ?? row.Status ?? "Booked");

  let tabStatus: TabKey = "booked";

  const lowerRaw = rawStatus.toLowerCase().trim();

  if (lowerRaw === "booked") {
    tabStatus = "booked";
  } else if (lowerRaw === "verification" || lowerRaw === "in verification") {
    tabStatus = "verification";
  } else if (
    lowerRaw === "cancellationrequest" ||
    lowerRaw === "cancellation request"
  ) {
    tabStatus = "cancellationrequest";
  } else if (lowerRaw === "neworder" || lowerRaw === "new order") {
    tabStatus = "neworder";
  } else if (lowerRaw === "inkitchen" || lowerRaw === "in kitchen") {
    tabStatus = "inkitchen";
  } else if (lowerRaw === "outfordelivery" || lowerRaw === "out for delivery") {
    tabStatus = "outfordelivery";
  } else if (lowerRaw === "delivered") {
    const subStatus = String(row.subStatus ?? row.SubStatus ?? "")
      .toLowerCase()
      .trim();

    tabStatus = subStatus === "bad delivery" ? "baddelivery" : "delivered";
  } else if (lowerRaw === "cancelled") {
    tabStatus = "cancelled";
  } else if (lowerRaw === "notdelivered" || lowerRaw === "not delivered") {
    tabStatus = "notdelivered";
  } else if (lowerRaw === "baddelivery" || lowerRaw === "bad delivery") {
    tabStatus = "baddelivery";
  } else if (lowerRaw === "complaints" || lowerRaw === "complaint") {
    tabStatus = "complaints";
  } else if (lowerRaw === "refund") {
    tabStatus = "refund";
  }

  return {
    id: String(row.id ?? row.OrderId ?? ""),
    status: tabStatus,
    dbStatus: rawStatus,

    outletId: String(row.restroCode ?? row.RestroCode ?? ""),

    outletName: String(row.restroName ?? row.RestroName ?? ""),

    stationCode: String(row.stationCode ?? row.StationCode ?? ""),

    stationName: String(row.stationName ?? row.StationName ?? ""),

    deliveryDate: String(row.deliveryDate ?? row.DeliveryDate ?? ""),

    deliveryTime: String(row.deliveryTime ?? row.DeliveryTime ?? ""),

    trainNo: row.trainNumber ?? row.TrainNumber ?? "",

    coach: row.coach ?? row.Coach ?? "",

    seat: row.seat ?? row.Seat ?? "",

    customerName: String(row.customerName ?? row.CustomerName ?? ""),

    customerMobile: String(row.customerMobile ?? row.CustomerMobile ?? ""),

    total:
      row.totalAmount != null
        ? String(row.totalAmount)
        : row.TotalAmount != null
          ? String(row.TotalAmount)
          : undefined,

    paymentMode: row.paymentMode ?? row.PaymentMode ?? "COD",

    history: Array.isArray(row.history) ? row.history : [],

    rawCreatedAt: row.CreatedAt ?? row.createdAt ?? row.created_at ?? "",

    raw: row,
  };
};

const valueFrom = (source: any, ...keys: string[]) => {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};

const moneyNumber = (value: any) => {
  const numberValue = Number(value ?? 0);
  if (!Number.isFinite(numberValue)) return "0";
  return numberValue.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(numberValue) ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

const moneyFrom = (source: any, ...keys: string[]) => {
  const value = valueFrom(source, ...keys);
  if (value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const formatAdminDateTime = (value: any) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatWhatsAppDate = (value: any) => {
  const text = String(value ?? "").trim();
  if (!text) return "N/A";

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;

  return parsed
    .toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    .replace(/\//g, "-");
};

const formatWhatsAppTime = (value: any) => {
  const text = String(value ?? "").trim();
  if (!text) return "N/A";

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})/);
  if (!timeMatch) return text;

  const hours = Number(timeMatch[1]);
  const minutes = timeMatch[2];
  if (!Number.isFinite(hours)) return text;

  const suffix = hours >= 12 ? "PM" : "AM";
  const shownHour = hours % 12 || 12;
  return `${String(shownHour).padStart(2, "0")}:${minutes} ${suffix}`;
};

function OrderDetailField({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: any;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "order-field-highlight" : "order-field"}>
      <span className="order-field-label">{label}</span>
      <span className="order-field-value">{String(value ?? "N/A")}</span>
    </div>
  );
}

function PaymentLine({
  label,
  value,
  textValue,
  negative = false,
}: {
  label: string;
  value?: number | null;
  textValue?: any;
  negative?: boolean;
}) {
  const shown =
    textValue !== undefined
      ? String(textValue)
      : value === null || value === undefined
        ? "N/A"
        : `${negative && value > 0 ? "- " : ""}₹${moneyNumber(value)}`;

  return (
    <div className="payment-line">
      <span>{label}</span>
      <strong style={{ color: negative && value ? "#dc2626" : "#0f172a" }}>
        {shown}
      </strong>
    </div>
  );
}

const buildVendorWhatsAppMessage = (order: Order, items: any[]) => {
  const prepaid = isPrepaidOrder(order);
  const paymentMode = prepaid ? "PREPAID" : "COD";

  const totalAmount =
    moneyFrom(order.raw, "TotalAmount", "totalAmount") ??
    Number(order.total || 0);

  const customerToPay = prepaid
    ? "₹0 (Paid Online)"
    : `₹${moneyNumber(totalAmount)}`;

  const fallbackJourneyPayload = valueFrom(
    order.raw,
    "JourneyPayload",
    "journeyPayload",
  );

  let payloadItems: any[] = [];
  if (fallbackJourneyPayload) {
    try {
      const parsedPayload =
        typeof fallbackJourneyPayload === "string"
          ? JSON.parse(fallbackJourneyPayload)
          : fallbackJourneyPayload;
      payloadItems = Array.isArray(parsedPayload?.Items)
        ? parsedPayload.Items
        : Array.isArray(parsedPayload?.items)
          ? parsedPayload.items
          : [];
    } catch {
      payloadItems = [];
    }
  }

  const sourceItems = items.length > 0 ? items : payloadItems;

  const itemText =
    sourceItems.length > 0
      ? sourceItems
          .map((item: any, index: number) => {
            const itemName =
              valueFrom(
                item,
                "ItemName",
                "itemName",
                "item_name",
                "Name",
                "name",
              ) || `Item ${index + 1}`;

            const quantity = Number(
              valueFrom(item, "Quantity", "quantity", "Qty", "qty") || 1,
            );

            return `${quantity} × ${itemName}`;
          })
          .join(", ")
      : "Items not available";

  const stationName =
    order.stationName ||
    valueFrom(order.raw, "StationName", "stationName") ||
    "N/A";

  const restroName =
    order.outletName ||
    valueFrom(order.raw, "RestroName", "restroName") ||
    "N/A";

  return `*Please Deliver Order* (RailEats 🚊)
Order ID: *${order.id || "N/A"}*
Train: *${order.trainNo || "N/A"}*
Delivery Time: *${formatWhatsAppTime(order.deliveryTime)}*
Delivery Date: *${formatWhatsAppDate(order.deliveryDate)}*
Coach, Seat: *${order.coach || "-"}, ${order.seat || "-"}*
Station: *${stationName} - ${restroName}*
Name: *${order.customerName || "Guest"}*
Mobile: *${order.customerMobile || "N/A"}*
Payment Mode: *${paymentMode}*
Order Total: *₹${moneyNumber(totalAmount)}*
Customer to Pay: *${customerToPay}*
Items:
*${itemText}*`;
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();

  const requestedOrderId = String(searchParams?.get("orderId") || "").trim();

  const autoOpenedOrderRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("raileats_admin_tab") as TabKey) || "booked";
    }
    return "booked";
  });

  const [allOrders, setAllOrders] = useState<Record<TabKey, Order[]>>(
    {} as Record<TabKey, Order[]>,
  );

  const [loading, setLoading] = useState(false);

  const [refreshTick, setRefreshTick] = useState(0);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [workflowModal, setWorkflowModal] = useState<{
    open: boolean;
    kind: "complaint-approve" | "complaint-reject" | "refund" | null;
    order: Order | null;
  }>({ open: false, kind: null, order: null });
  const [workflowStatus, setWorkflowStatus] = useState("");
  const [workflowSubStatus, setWorkflowSubStatus] = useState("");
  const [workflowPenalty, setWorkflowPenalty] = useState("");
  const [workflowRemarks, setWorkflowRemarks] = useState("");
  const [workflowAmount, setWorkflowAmount] = useState("");
  const [workflowSaving, setWorkflowSaving] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [actionType, setActionType] = useState("");

  const [subStatus, setSubStatus] = useState("");

  const [remarks, setRemarks] = useState("");

  const [vendorPenaltyAmount, setVendorPenaltyAmount] = useState("");

  const [marking, setMarking] = useState<
    Record<string, { status: string; remarks: string }>
  >({});

  const [searchOrderId, setSearchOrderId] = useState("");
  const [searchCustomerMobile, setSearchCustomerMobile] = useState("");
  const [searchOutlet, setSearchOutlet] = useState("");
  const [searchStation, setSearchStation] = useState("");
  const [searchTrainNo, setSearchTrainNo] = useState("");
  const nowIndia = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );

  const todayDate =
    nowIndia.getFullYear() +
    "-" +
    String(nowIndia.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(nowIndia.getDate()).padStart(2, "0");

  const [searchDeliveryFrom, setSearchDeliveryFrom] = useState("");
  const [searchDeliveryTo, setSearchDeliveryTo] = useState("");

  const [draftDeliveryFrom, setDraftDeliveryFrom] = useState(
    `${todayDate}T00:00`,
  );
  const [draftDeliveryTo, setDraftDeliveryTo] = useState(`${todayDate}T23:59`);

  const [draftOrderId, setDraftOrderId] = useState("");
  const [draftCustomerMobile, setDraftCustomerMobile] = useState("");
  const [draftOutlet, setDraftOutlet] = useState("");
  const [draftStation, setDraftStation] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftTrainNo, setDraftTrainNo] = useState("");
  const [dateSearchType, setDateSearchType] = useState<"delivery" | "booking">(
    "delivery",
  );
  const [draftDateSearchType, setDraftDateSearchType] = useState<
    "delivery" | "booking"
  >("delivery");

  const [searchBookingFrom, setSearchBookingFrom] = useState("");
  const [searchBookingTo, setSearchBookingTo] = useState("");
  const [bookingDateFilterOn, setBookingDateFilterOn] = useState(false);

  const [draftBookingFrom, setDraftBookingFrom] = useState(
    `${todayDate}T00:00`,
  );
  const [draftBookingTo, setDraftBookingTo] = useState(`${todayDate}T23:59`);

  const [newOrderCount, setNewOrderCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("raileats_new_orders") || 0);
    }
    return 0;
  });

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [activeDrawerSection, setActiveDrawerSection] = useState<
    "details" | "logs" | "whatsapp"
  >("details");

  const [fetchedItems, setFetchedItems] = useState<any[]>([]);
  const [fetchedRestro, setFetchedRestro] = useState<any>(null);
  const [orderLogs, setOrderLogs] = useState<any[]>([]);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [messageCopied, setMessageCopied] = useState(false);

  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingRestro, setLoadingRestro] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [routeModal, setRouteModal] = useState({
    open: false,
    trainNo: "",
    stationCode: "",
    data: [] as TrainRouteRow[],
    message: "",
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasLoadedTabRef = useRef<Partial<Record<TabKey, boolean>>>({});

  const autoVerificationInFlightRef = useRef<Record<string, boolean>>({});

  const autoNewOrderInFlightRef = useRef<Record<string, boolean>>({});

  const autoOutForDeliveryInFlightRef = useRef<Record<string, boolean>>({});

  const autoCancellationRequestInFlightRef = useRef<Record<string, boolean>>(
    {},
  );

  const getAdminActor = () => {
    if (typeof window === "undefined") {
      return { userType: "Admin", userName: "Admin" };
    }

    const userName =
      localStorage.getItem("raileats_admin_name") ||
      localStorage.getItem("adminName") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("name") ||
      "Admin";

    return {
      userType: "Admin",
      userName,
    };
  };

  /* ================= SOUND HELPERS ================= */
  const playNewOrderSound = async () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/new-order.mp3");
        audioRef.current.preload = "auto";
        audioRef.current.volume = 1;
      }

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (err) {
      console.log("New order sound blocked:", err);
    }
  };

  /* ================= INIT SOUND ================= */
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.preload = "auto";
    audioRef.current.volume = 1;

    const unlockAudio = async () => {
      try {
        if (!audioRef.current) return;

        audioRef.current.muted = true;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;

        console.log("Audio unlocked successfully");
      } catch (e) {
        console.log("Audio unlock failed", e);
      }
    };

    window.addEventListener("click", unlockAudio, { once: true });
    window.addEventListener("touchstart", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  /* ================= SMART AUTO REFRESH ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((prev) => prev + 1);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  /* ================= URL ORDER OPEN ================= */
  useEffect(() => {
    if (!requestedOrderId) {
      return;
    }

    setActiveTab("all");
    localStorage.setItem("raileats_admin_tab", "all");

    setDraftOrderId(requestedOrderId);
    setSearchOrderId(requestedOrderId);

    setSearchDeliveryFrom("");
    setSearchDeliveryTo("");
    setSearchBookingFrom("");
    setSearchBookingTo("");
    setBookingDateFilterOn(false);
  }, [requestedOrderId]);

  /* ================= LOAD ORDERS ================= */
  useEffect(() => {
    const load = async () => {
      const shouldShowLoader = !hasLoadedTabRef.current[activeTab];

      try {
        if (shouldShowLoader) {
          setLoading(true);
        }

        const params = new URLSearchParams();

        if (activeTab !== "all") {
          params.set("status", activeTab);
        }

        if (searchOrderId.trim()) params.set("orderId", searchOrderId.trim());
        if (searchCustomerMobile.trim()) {
          params.set("customerMobile", searchCustomerMobile.trim());
        }
        if (searchOutlet.trim()) params.set("outlet", searchOutlet.trim());
        if (searchStation.trim()) params.set("station", searchStation.trim());
        if (searchTrainNo.trim()) params.set("trainNo", searchTrainNo.trim());

        if (dateSearchType === "delivery") {
          if (searchDeliveryFrom) params.set("dateFrom", searchDeliveryFrom);
          if (searchDeliveryTo) params.set("dateTo", searchDeliveryTo);
          if (searchDeliveryFrom || searchDeliveryTo) {
            params.set("dateType", "delivery");
          }
        } else if (bookingDateFilterOn) {
          if (searchBookingFrom) params.set("dateFrom", searchBookingFrom);
          if (searchBookingTo) params.set("dateTo", searchBookingTo);
          if (searchBookingFrom || searchBookingTo) {
            params.set("dateType", "booking");
          }
        }

        const res = await fetch(
          activeTab === "all"
            ? "/api/orders"
            : `/api/orders?${params.toString()}`,
          {
            cache: "no-store",
          },
        );

        const json = await res.json().catch(() => ({}) as any);

        if (!res.ok || !json?.ok) {
          console.error("orders fetch failed", json);

          setAllOrders((prev) => ({
            ...prev,
            [activeTab]: [],
          }));

          return;
        }

        const mapped: Order[] = (json.orders || []).map(mapOrderRowToOrder);

        setAllOrders((prev) => ({
          ...prev,
          [activeTab]: mapped,
        }));
      } catch (error) {
        console.error("orders fetch error", error);

        setAllOrders((prev) => ({
          ...prev,
          [activeTab]: [],
        }));
      } finally {
        hasLoadedTabRef.current[activeTab] = true;

        if (shouldShowLoader) {
          setLoading(false);
        }
      }
    };

    load();
  }, [
    activeTab,
    refreshTick,
    searchOrderId,
    searchCustomerMobile,
    searchOutlet,
    searchStation,
    searchTrainNo,
    searchDeliveryFrom,
    searchDeliveryTo,
    searchBookingFrom,
    searchBookingTo,
    bookingDateFilterOn,
    dateSearchType,
  ]);

  /* ================= AUTO STATUS TABS SYNC ================= */
  useEffect(() => {
    let cancelled = false;

    const syncAutoMoveTabs = async () => {
      try {
        const results = await Promise.all(
          AUTO_SYNC_TABS.map(async (tab) => {
            const params = new URLSearchParams();

            params.set("status", tab);

            const res = await fetch(`/api/orders?${params.toString()}`, {
              cache: "no-store",
            });

            const json = await res.json().catch(() => ({}) as any);

            if (!res.ok || !json?.ok) {
              console.error("auto orders sync failed", tab, json);

              return [tab, null] as const;
            }

            const mapped: Order[] = (json.orders || []).map(mapOrderRowToOrder);

            return [tab, mapped] as const;
          }),
        );

        if (cancelled) return;

        setAllOrders((prev) => {
          const copy = { ...prev };

          results.forEach(([tab, mapped]) => {
            if (mapped) {
              copy[tab] = mapped;
            }
          });

          return copy;
        });
      } catch (error) {
        console.error("auto orders sync network error", error);
      }
    };

    syncAutoMoveTabs();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const orders = useMemo(
    () => allOrders[activeTab] ?? [],
    [allOrders, activeTab],
  );

  /* ================= AUTO BOOKED TO VERIFICATION ================= */
  useEffect(() => {
    const bookedOrders = allOrders.booked ?? [];

    const dueForVerification = bookedOrders.filter((order) => {
      if (autoVerificationInFlightRef.current[order.id]) {
        return false;
      }

      return shouldAutoMoveBookedToVerification(order);
    });

    if (dueForVerification.length === 0) {
      return;
    }

    const actor = SYSTEM_AUTO_ACTOR;

    dueForVerification.forEach((order) => {
      autoVerificationInFlightRef.current[order.id] = true;

      (async () => {
        const nextStatus: TabKey = "verification";

        const targetDbValue = "In Verification";

        const actionNote =
          `Auto moved to In Verification before ` +
          `${AUTO_VERIFICATION_BEFORE_MINUTES} minutes of delivery time`;

        try {
          const res = await fetch(
            `/api/orders/${encodeURIComponent(order.id)}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                newStatus: targetDbValue,
                subStatus: null,
                remarks: actionNote,
                note: actionNote,
                changedBy: actor.userName,
                userType: actor.userType,
                userName: actor.userName,
                actionSource: "Auto",
              }),
            },
          );

          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json?.ok) {
            autoVerificationInFlightRef.current[order.id] = false;

            console.error("Auto verification move failed", order.id, json);

            return;
          }

          const updated: Order = {
            ...order,
            status: nextStatus,
            dbStatus: targetDbValue,
            history: [
              ...order.history,
              {
                at: new Date().toISOString(),
                by: actor.userName,
                note: actionNote,
                status: nextStatus,
              },
            ],
          };

          setAllOrders((prev) => {
            const copy = { ...prev };

            copy.booked = (copy.booked ?? []).filter(
              (existingOrder) => existingOrder.id !== order.id,
            );

            copy.verification = [updated, ...(copy.verification ?? [])];

            return copy;
          });
        } catch (error) {
          autoVerificationInFlightRef.current[order.id] = false;

          console.error("Auto verification move network error", error);
        }
      })();
    });
  }, [allOrders.booked]);

  /* ================= AUTO VERIFICATION TO NEW ORDER ================= */
  useEffect(() => {
    const verificationOrders = allOrders.verification ?? [];

    const dueForNewOrder = verificationOrders.filter((order) => {
      if (autoNewOrderInFlightRef.current[order.id]) {
        return false;
      }

      return shouldAutoMoveVerificationToNewOrder(order);
    });

    if (dueForNewOrder.length === 0) {
      return;
    }

    const actor = SYSTEM_AUTO_ACTOR;

    dueForNewOrder.forEach((order) => {
      autoNewOrderInFlightRef.current[order.id] = true;

      (async () => {
        const nextStatus: TabKey = "neworder";

        const targetDbValue = "New Order";

        const actionNote =
          `Auto moved prepaid order to New Order before ` +
          `${AUTO_VERIFICATION_BEFORE_MINUTES} minutes of delivery time`;

        try {
          const res = await fetch(
            `/api/orders/${encodeURIComponent(order.id)}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                newStatus: targetDbValue,
                subStatus: null,
                remarks: actionNote,
                note: actionNote,
                changedBy: actor.userName,
                userType: actor.userType,
                userName: actor.userName,
                actionSource: "Auto",
              }),
            },
          );

          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json?.ok) {
            autoNewOrderInFlightRef.current[order.id] = false;

            console.error("Auto new order move failed", order.id, json);

            return;
          }

          const updated: Order = {
            ...order,
            status: nextStatus,
            dbStatus: targetDbValue,
            history: [
              ...order.history,
              {
                at: new Date().toISOString(),
                by: actor.userName,
                note: actionNote,
                status: nextStatus,
              },
            ],
          };

          setAllOrders((prev) => {
            const copy = { ...prev };

            copy.verification = (copy.verification ?? []).filter(
              (existingOrder) => existingOrder.id !== order.id,
            );

            copy.neworder = [updated, ...(copy.neworder ?? [])];

            return copy;
          });
        } catch (error) {
          autoNewOrderInFlightRef.current[order.id] = false;

          console.error("Auto new order move network error", error);
        }
      })();
    });
  }, [allOrders.verification]);

  /* ================= AUTO KITCHEN TO OUT FOR DELIVERY ================= */
  useEffect(() => {
    const kitchenOrders = allOrders.inkitchen ?? [];

    const dueForOutForDelivery = kitchenOrders.filter((order) => {
      if (autoOutForDeliveryInFlightRef.current[order.id]) {
        return false;
      }

      return shouldAutoMoveKitchenToOutForDelivery(order);
    });

    if (dueForOutForDelivery.length === 0) {
      return;
    }

    const actor = SYSTEM_AUTO_ACTOR;

    dueForOutForDelivery.forEach((order) => {
      autoOutForDeliveryInFlightRef.current[order.id] = true;

      (async () => {
        const nextStatus: TabKey = "outfordelivery";

        const targetDbValue = "Out for Delivery";

        const actionNote =
          `Auto moved to Out for Delivery before ` +
          `${AUTO_OUT_FOR_DELIVERY_BEFORE_MINUTES} minutes of delivery time`;

        try {
          const res = await fetch(
            `/api/orders/${encodeURIComponent(order.id)}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                newStatus: targetDbValue,
                subStatus: null,
                remarks: actionNote,
                note: actionNote,
                changedBy: actor.userName,
                userType: actor.userType,
                userName: actor.userName,
                actionSource: "Auto",
              }),
            },
          );

          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json?.ok) {
            autoOutForDeliveryInFlightRef.current[order.id] = false;

            console.error("Auto out for delivery move failed", order.id, json);

            return;
          }

          const updated: Order = {
            ...order,
            status: nextStatus,
            dbStatus: targetDbValue,
            history: [
              ...order.history,
              {
                at: new Date().toISOString(),
                by: actor.userName,
                note: actionNote,
                status: nextStatus,
              },
            ],
          };

          setAllOrders((prev) => {
            const copy = { ...prev };

            copy.inkitchen = (copy.inkitchen ?? []).filter(
              (existingOrder) => existingOrder.id !== order.id,
            );

            copy.outfordelivery = [updated, ...(copy.outfordelivery ?? [])];

            return copy;
          });
        } catch (error) {
          autoOutForDeliveryInFlightRef.current[order.id] = false;

          console.error("Auto out for delivery move network error", error);
        }
      })();
    });
  }, [allOrders.inkitchen]);

  /* ================= AUTO EXPIRED ORDERS TO CANCELLATION REQUEST ================= */
  useEffect(() => {
    const bookedOrders = allOrders.booked ?? [];

    const verificationOrders = allOrders.verification ?? [];

    const expiredOrders = [...bookedOrders, ...verificationOrders].filter(
      (order) => {
        if (autoCancellationRequestInFlightRef.current[order.id]) {
          return false;
        }

        return shouldAutoMoveToCancellationRequest(order);
      },
    );

    if (expiredOrders.length === 0) {
      return;
    }

    const actor = SYSTEM_AUTO_ACTOR;

    expiredOrders.forEach((order) => {
      autoCancellationRequestInFlightRef.current[order.id] = true;

      (async () => {
        const nextStatus: TabKey = "cancellationrequest";

        const targetDbValue = "Cancellation Request";

        const previousStage =
          order.status === "verification" ? "In Verification" : "Booked";

        const actionNote =
          `Delivery date and time passed while order was in ${previousStage}. ` +
          `Automatically moved to Cancellation Request.`;

        try {
          const res = await fetch(
            `/api/orders/${encodeURIComponent(order.id)}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                newStatus: targetDbValue,

                // Purana Status SubStatus me preserve hoga
                subStatus: previousStage,

                remarks: actionNote,
                note: actionNote,
                changedBy: actor.userName,
                userType: actor.userType,
                userName: actor.userName,
                actionSource: "Auto",
              }),
            },
          );

          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json?.ok) {
            autoCancellationRequestInFlightRef.current[order.id] = false;

            console.error("Auto Cancellation Request failed", order.id, json);

            return;
          }

          const updated: Order = {
            ...order,
            status: nextStatus,
            dbStatus: targetDbValue,
            history: [
              ...order.history,
              {
                at: new Date().toISOString(),
                by: actor.userName,
                note: actionNote,
                status: nextStatus,
              },
            ],
          };

          setAllOrders((prev) => {
            const copy = { ...prev };

            copy.booked = (copy.booked ?? []).filter(
              (existingOrder) => existingOrder.id !== order.id,
            );

            copy.verification = (copy.verification ?? []).filter(
              (existingOrder) => existingOrder.id !== order.id,
            );

            copy.cancellationrequest = [
              updated,
              ...(copy.cancellationrequest ?? []),
            ];

            return copy;
          });
        } catch (error) {
          autoCancellationRequestInFlightRef.current[order.id] = false;

          console.error(
            "Auto Cancellation Request network error",
            order.id,
            error,
          );
        }
      })();
    });
  }, [allOrders.booked, allOrders.verification]);

  /* ================= KEEP DRAWER ORDER UPDATED ================= */
  useEffect(() => {
    if (!detailedOrder) return;

    const liveFlatArray = Object.values(allOrders).flat();

    const matchUpdate = liveFlatArray.find(
      (order) => order.id === detailedOrder.id,
    );

    if (
      matchUpdate &&
      (matchUpdate.status !== detailedOrder.status ||
        matchUpdate.dbStatus !== detailedOrder.dbStatus)
    ) {
      setDetailedOrder(matchUpdate);
    }
  }, [allOrders]);

  useEffect(() => {
    if (!detailedOrder) {
      setWhatsappMessage("");
      return;
    }

    setWhatsappMessage(buildVendorWhatsAppMessage(detailedOrder, fetchedItems));
  }, [detailedOrder, fetchedItems]);

  /* ================= TRAIN ROUTE MODAL ================= */
  const openRouteModal = async (trainNo?: string, stationCode?: string) => {
    const normalizedTrainNo = normalizeRouteValue(trainNo);
    const normalizedStationCode =
      normalizeRouteValue(stationCode).toUpperCase();

    if (!normalizedTrainNo) {
      alert("Train number not available for this order");
      return;
    }

    const routeSelect = `
      trainId,
      trainNumber,
      trainName,
      stationFrom,
      stationTo,
      runningDays,
      StnNumber,
      StationCode,
      StationName,
      Arrives,
      Departs,
      Stoptime,
      Distance,
      Platform,
      Route,
      Day,
      status,
      trainNumber_text
    `;

    const numericTrainNo = Number(normalizedTrainNo);
    const filters = [`trainNumber_text.eq.${normalizedTrainNo}`];
    if (Number.isFinite(numericTrainNo))
      filters.push(`trainNumber.eq.${numericTrainNo}`);

    const { data, error } = await supabase
      .from("TrainRoute")
      .select(routeSelect)
      .or(filters.join(","))
      .order("StnNumber", { ascending: true });

    if (error) {
      console.error("TrainRoute query failed", error);
      setRouteModal({
        open: true,
        trainNo: normalizedTrainNo,
        stationCode: normalizedStationCode,
        data: [],
        message: `TrainRoute query failed: ${error.message}`,
      });
      return;
    }

    const routeRows = data || [];
    const message =
      routeRows.length === 0
        ? `Supabase returned 0 TrainRoute rows for train ${normalizedTrainNo}. If rows exist in table editor, enable SELECT policy/RLS access for anon/authenticated users.`
        : "";

    console.log("TrainRoute query result", {
      trainNo: normalizedTrainNo,
      stationCode: normalizedStationCode,
      count: routeRows.length,
      sample: routeRows[0] || null,
    });

    setRouteModal({
      open: true,
      trainNo: normalizedTrainNo,
      stationCode: normalizedStationCode,
      data: routeRows,
      message,
    });

    setTimeout(() => {
      const el = document.getElementById(`stn-${normalizedStationCode}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  };

  /* ================= DIAGNOSTICS LAUNCH PANEL ================= */
  const handleOpenDiagnosticsDrawer = async (
    order: Order,
    preferredSection: "details" | "logs" = "details",
  ) => {
    setDetailedOrder(order);
    setActiveDrawerSection(preferredSection);
    setViewDrawerOpen(true);
    setWhatsappMessage("");
    setMessageCopied(false);

    const targetOrderId = order.id;
    const targetRestroCode = order.outletId;

    // Fetch the complete Orders row so every payment and booking field comes
    // directly from Supabase instead of depending only on the compact list API.
    if (targetOrderId) {
      try {
        const { data: fullOrderRow, error: fullOrderError } = await supabase
          .from("Orders")
          .select("*")
          .eq("OrderId", targetOrderId)
          .maybeSingle();

        if (!fullOrderError && fullOrderRow) {
          const completeOrder = mapOrderRowToOrder(fullOrderRow);
          setDetailedOrder({
            ...order,
            ...completeOrder,
            status: order.status,
            dbStatus: completeOrder.dbStatus || order.dbStatus,
            raw: { ...(order.raw || {}), ...fullOrderRow },
          });
        } else if (fullOrderError) {
          console.error("Complete Orders row fetch failed:", fullOrderError);
        }
      } catch (e) {
        console.error("Error loading complete Orders row:", e);
      }
    }

    if (targetOrderId) {
      setLoadingItems(true);
      setFetchedItems([]);
      try {
        const { data, error } = await supabase
          .from("OrderItems")
          .select("*")
          .eq("OrderId", targetOrderId);
        if (!error && data) setFetchedItems(data);
      } catch (e) {
        console.error("Error connecting OrderItems database links:", e);
      } finally {
        setLoadingItems(false);
      }
    }

    if (targetRestroCode) {
      setLoadingRestro(true);
      setFetchedRestro(null);
      try {
        const { data, error } = await supabase
          .from("RestroMaster")
          .select("*")
          .eq("RestroCode", targetRestroCode)
          .maybeSingle();
        if (!error && data) setFetchedRestro(data);
      } catch (e) {
        console.error("Error connecting RestroMaster database links:", e);
      } finally {
        setLoadingRestro(false);
      }
    }

    if (targetOrderId) {
      setLoadingLogs(true);
      setOrderLogs([]);
      try {
        const { data, error } = await supabase
          .from("OrderStatusHistory")
          .select("*")
          .eq("OrderId", targetOrderId)
          .order("ChangedAt", { ascending: true });
        if (!error && data) setOrderLogs(data);
      } catch (e) {
        console.error("Error connecting OrderStatusHistory database links:", e);
      } finally {
        setLoadingLogs(false);
      }
    }
  };

  /* ================= AUTO OPEN ORDER DRAWER ================= */
  useEffect(() => {
    if (!requestedOrderId) {
      return;
    }

    if (autoOpenedOrderRef.current === requestedOrderId) {
      return;
    }

    const allTabOrders = allOrders.all ?? [];

    const match = allTabOrders.find(
      (order) => order.id.toLowerCase() === requestedOrderId.toLowerCase(),
    );

    if (!match) {
      return;
    }

    autoOpenedOrderRef.current = requestedOrderId;

    handleOpenDiagnosticsDrawer(match, "details");
  }, [requestedOrderId, allOrders.all]);

  function moveOrderToNext(orderId: string) {
    const current = allOrders[activeTab] ?? [];
    const idx = current.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = current[idx];
    const mapping = NEXT_MAP[order.status];
    if (!mapping || !mapping.next) {
      alert("Cannot move further");
      return;
    }

    const nextStatus = mapping.next;
    const targetDbValue = mapping.dbValue;

    (async () => {
      try {
        const actor = getAdminActor();
        const actionNote = mapping.actionLabel;
        const res = await fetch(
          `/api/orders/${encodeURIComponent(order.id)}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              newStatus: targetDbValue,
              subStatus: null,
              remarks: actionNote,
              note: actionNote,
              changedBy: actor.userName,
              userType: actor.userType,
              userName: actor.userName,
              actionSource: actor.userType || "Admin",
            }),
          },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          alert("Failed to change status");
          return;
        }

        const updated: Order = {
          ...order,
          status: nextStatus,
          dbStatus: targetDbValue,
          history: [
            ...order.history,
            {
              at: new Date().toISOString(),
              by: actor.userName,
              note: actionNote,
              status: nextStatus,
            },
          ],
        };

        setAllOrders((prev) => {
          const copy = { ...prev };
          copy[activeTab] = (copy[activeTab] ?? []).filter(
            (o) => o.id !== orderId,
          );
          copy[nextStatus] = [updated, ...(copy[nextStatus] ?? [])];
          return copy;
        });

        if (viewDrawerOpen && detailedOrder && detailedOrder.id === orderId) {
          try {
            const { data: logReload } = await supabase
              .from("OrderStatusHistory")
              .select("*")
              .eq("OrderId", orderId)
              .order("ChangedAt", { ascending: true });
            if (logReload) setOrderLogs(logReload);
          } catch (err) {
            console.error(err);
          }
        }
      } catch (e) {
        alert("Failed to change status (network error)");
      }
    })();
  }

  async function submitStatusAction() {
    if (!selectedOrder) return;
    if (!subStatus) {
      alert("Please select reason/status");
      return;
    }

    try {
      const outForDeliveryOption =
        selectedOrder.status === "inkitchen" ||
        selectedOrder.status === "outfordelivery"
          ? OUT_FOR_DELIVERY_OUTCOME_OPTIONS.find(
              (option) => option.key === subStatus,
            )
          : null;
      const shouldApplyOrderPenalty =
        actionType === "mark" &&
        (selectedOrder.status === "inkitchen" ||
          selectedOrder.status === "outfordelivery");
      const selectedVendorPenalty = !shouldApplyOrderPenalty
        ? 0
        : outForDeliveryOption?.manualPenalty
          ? Number(vendorPenaltyAmount || 0)
          : (outForDeliveryOption?.vendorPenalty ??
            ORDER_PENALTY_BY_SUB_STATUS[subStatus] ??
            0);

      if (
        shouldApplyOrderPenalty &&
        outForDeliveryOption?.manualPenalty &&
        (!Number.isFinite(selectedVendorPenalty) || selectedVendorPenalty < 0)
      ) {
        alert("Please enter valid vendor penalty amount");
        return;
      }

      let computedMainStatus = "";
      if (actionType === "cancel") {
        computedMainStatus = "Cancelled";
      } else if (outForDeliveryOption) {
        computedMainStatus = outForDeliveryOption.dbValue;
      } else {
        if (subStatus === "Delivered" || subStatus === "Bad Delivery") {
          computedMainStatus = subStatus;
        } else if (
          subStatus === "Not Delivered" ||
          NOT_DELIVERED_REASONS.includes(subStatus) ||
          OUT_FOR_DELIVERY_NOT_DELIVERED_REASONS.includes(subStatus)
        ) {
          computedMainStatus = "Not Delivered";
        } else if (subStatus === "Cancelled") {
          computedMainStatus = "Cancelled";
        }
      }

      if (!computedMainStatus) {
        alert("Unable to map selected sub status to main order status");
        return;
      }

      const actor = getAdminActor();
      const cleanRemarks = remarks.trim();

      const res = await fetch(
        `/api/orders/${encodeURIComponent(selectedOrder.id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStatus: computedMainStatus,
            subStatus,
            remarks: cleanRemarks,
            note: cleanRemarks,
            changedBy: actor.userName,
            userType: actor.userType,
            userName: actor.userName,
            actionSource: actor.userType || "Admin",
            OrderPenalty: selectedVendorPenalty,
            vendorPenalty: selectedVendorPenalty,
            vendorPenaltyAmount: selectedVendorPenalty,
            VendorPenalty: selectedVendorPenalty,
          }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        alert("Failed to update order");
        return;
      }

      const targetKey: TabKey = outForDeliveryOption
        ? outForDeliveryOption.targetTab
        : subStatus === "Bad Delivery"
          ? "baddelivery"
          : (computedMainStatus.toLowerCase().replace(/\s/g, "") as TabKey);

      const updatedOrder = {
        ...selectedOrder,
        status: targetKey,
        dbStatus: computedMainStatus,
        history: [
          ...selectedOrder.history,
          {
            at: new Date().toISOString(),
            by: actor.userName,
            note: `${subStatus}${selectedVendorPenalty > 0 || outForDeliveryOption?.manualPenalty ? ` • Vendor Penalty Rs ${selectedVendorPenalty}` : ""}${cleanRemarks ? ` • ${cleanRemarks}` : ""}`,
            status: targetKey,
          },
        ],
      };

      setAllOrders((prev) => {
        const copy = { ...prev };
        (Object.keys(copy) as TabKey[]).forEach((k) => {
          copy[k] = (copy[k] || []).filter((o) => o.id !== selectedOrder.id);
        });
        copy[targetKey] = [updatedOrder, ...(copy[targetKey] || [])];
        return copy;
      });

      if (
        viewDrawerOpen &&
        detailedOrder &&
        detailedOrder.id === selectedOrder.id
      ) {
        try {
          const { data: logReload } = await supabase
            .from("OrderStatusHistory")
            .select("*")
            .eq("OrderId", selectedOrder.id)
            .order("ChangedAt", { ascending: true });
          if (logReload) setOrderLogs(logReload);
        } catch (err) {
          console.error(err);
        }
      }

      setStatusModalOpen(false);
      setSelectedOrder(null);
      setSubStatus("");
      setRemarks("");
      setVendorPenaltyAmount("");
      setActiveTab(targetKey);
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  }

  async function submitMark(order: Order) {
    const selection = marking[order.id];
    if (!selection || !selection.status) {
      alert("Select status first");
      return;
    }
    const targetKey = selection.status as TabKey;
    const matchedOption = FINAL_MARK_OPTIONS.find((o) => o.key === targetKey);
    const targetDbValue = matchedOption ? matchedOption.dbValue : targetKey;
    const currentRemarks = selection.remarks || `Marked ${targetKey}`;

    try {
      const actor = getAdminActor();
      const res = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStatus: targetDbValue,
            subStatus: matchedOption?.label || targetDbValue,
            remarks: currentRemarks,
            note: currentRemarks,
            changedBy: actor.userName,
            userType: actor.userType,
            userName: actor.userName,
            actionSource: actor.userType || "Admin",
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        alert("Failed to change status");
        return;
      }

      const updated: Order = {
        ...order,
        status: targetKey,
        dbStatus: targetDbValue,
        history: [
          ...order.history,
          {
            at: new Date().toISOString(),
            by: actor.userName,
            note: currentRemarks,
            status: targetKey,
          },
        ],
      };

      setAllOrders((prev) => {
        const copy: Record<TabKey, Order[]> = { ...prev } as any;
        (Object.keys(copy) as TabKey[]).forEach((k) => {
          copy[k] = (copy[k] ?? []).filter((o) => o.id !== order.id);
        });
        copy[targetKey] = [updated, ...(copy[targetKey] ?? [])];
        return copy;
      });

      setMarking((prev) => {
        const cp = { ...prev };
        delete cp[order.id];
        return cp;
      });

      if (viewDrawerOpen && detailedOrder && detailedOrder.id === order.id) {
        try {
          const { data: logReload } = await supabase
            .from("OrderStatusHistory")
            .select("*")
            .eq("OrderId", order.id)
            .order("ChangedAt", { ascending: true });
          if (logReload) setOrderLogs(logReload);
        } catch (err) {
          console.error(err);
        }
      }

      setActiveTab(targetKey);
    } catch (e) {
      alert("Failed to change status (network error)");
    }
  }

  // 1. Applying Search Filters
  const applyFiltersAndSorting = (list: Order[]) => {
    let filtered = list.slice();

    if (searchOrderId.trim()) {
      const q = searchOrderId.trim().toLowerCase();
      filtered = filtered.filter((o) => o.id.toLowerCase().includes(q));
    }

    if (searchCustomerMobile.trim()) {
      const q = searchCustomerMobile.trim().toLowerCase();
      filtered = filtered.filter((o) =>
        o.customerMobile.toLowerCase().includes(q),
      );
    }

    if (searchOutlet.trim()) {
      const q = searchOutlet.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.outletId.toLowerCase().includes(q) ||
          o.outletName.toLowerCase().includes(q),
      );
    }

    if (searchStation.trim()) {
      const q = searchStation.trim().toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.stationCode.toLowerCase().includes(q) ||
          o.stationName.toLowerCase().includes(q),
      );
    }

    if (searchTrainNo.trim()) {
      const q = searchTrainNo.trim().toLowerCase();
      filtered = filtered.filter((o) =>
        (o.trainNo || "").toLowerCase().includes(q),
      );
    }

    if (
      dateSearchType === "delivery" &&
      (searchDeliveryFrom || searchDeliveryTo)
    ) {
      const fromTime = searchDeliveryFrom
        ? new Date(searchDeliveryFrom).getTime()
        : 0;
      const toTime = searchDeliveryTo
        ? new Date(searchDeliveryTo).getTime()
        : Number.MAX_SAFE_INTEGER;

      filtered = filtered.filter((o) => {
        if (!o.deliveryDate) return false;

        const deliveryDateTime = `${o.deliveryDate}T${o.deliveryTime || "00:00:00"}`;
        const deliveryTime = new Date(deliveryDateTime).getTime();

        return deliveryTime >= fromTime && deliveryTime <= toTime;
      });
    }

    if (
      dateSearchType === "booking" &&
      bookingDateFilterOn &&
      (searchBookingFrom || searchBookingTo)
    ) {
      const fromTime = searchBookingFrom
        ? new Date(searchBookingFrom).getTime()
        : 0;

      const toTime = searchBookingTo
        ? new Date(searchBookingTo).getTime()
        : Number.MAX_SAFE_INTEGER;

      filtered = filtered.filter((o) => {
        if (!o.rawCreatedAt) return false;
        const bookedTime = new Date(o.rawCreatedAt).getTime();
        return bookedTime >= fromTime && bookedTime <= toTime;
      });
    }

    filtered.sort((a, b) => {
      const dateTimeA = new Date(
        `${a.deliveryDate}T${a.deliveryTime || "00:00:00"}`,
      ).getTime();

      const dateTimeB = new Date(
        `${b.deliveryDate}T${b.deliveryTime || "00:00:00"}`,
      ).getTime();

      if (dateTimeA !== dateTimeB) return dateTimeA - dateTimeB;

      const bookedTimeA = a.rawCreatedAt
        ? new Date(a.rawCreatedAt).getTime()
        : 0;

      const bookedTimeB = b.rawCreatedAt
        ? new Date(b.rawCreatedAt).getTime()
        : 0;

      return bookedTimeB - bookedTimeA;
    });

    return filtered;
  };

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      booked: 0,
      verification: 0,
      cancellationrequest: 0,
      neworder: 0,
      inkitchen: 0,
      outfordelivery: 0,
      delivered: 0,
      cancelled: 0,
      notdelivered: 0,
      baddelivery: 0,
      complaints: 0,
      refund: 0,
      all: 0,
    };
    const flatOrders = Object.values(allOrders).flat();

    counts.all = flatOrders.length;

    flatOrders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });

    return counts;
  }, [allOrders]);
  const visibleOrders = useMemo(
    () => applyFiltersAndSorting(orders),
    [
      orders,
      searchOrderId,
      searchCustomerMobile,
      searchOutlet,
      searchStation,
      searchDeliveryFrom,
      searchDeliveryTo,
      searchTrainNo,
      searchBookingFrom,
      searchBookingTo,
      bookingDateFilterOn,
      dateSearchType,
    ],
  );

  function csvEscape(value: any) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadOrdersReport() {
    if (!visibleOrders.length) {
      alert("No data found to download");
      return;
    }

    const params = new URLSearchParams();

    params.set("status", activeTab);
    params.set("orderIds", visibleOrders.map((o) => o.id).join(","));

    window.open(`/api/admin/orders-report?${params.toString()}`, "_blank");
  }

  async function copyWhatsAppMessage() {
    if (!whatsappMessage.trim()) {
      alert("WhatsApp message is empty");
      return;
    }

    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setMessageCopied(true);
      window.setTimeout(() => setMessageCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Message copy nahi ho paya");
    }
  }

  function openVendorWhatsApp() {
    if (!whatsappMessage.trim()) {
      alert("WhatsApp message is empty");
      return;
    }

    const vendorMobile = String(
      valueFrom(
        fetchedRestro,
        "RestroPhone",
        "restroPhone",
        "OwnerPhone",
        "ownerPhone",
        "RestroLoginMobile",
        "OwnerMobile",
        "ownerMobile",
      ) || "",
    ).replace(/\D/g, "");

    if (!vendorMobile) {
      alert("Vendor mobile number RestroMaster me nahi mila");
      return;
    }

    const mobileWithCountryCode =
      vendorMobile.length === 10 ? `91${vendorMobile}` : vendorMobile;

    window.open(
      `https://wa.me/${mobileWithCountryCode}?text=${encodeURIComponent(
        whatsappMessage,
      )}`,
      "_blank",
    );
  }
  function openWorkflow(kind: "complaint-approve" | "complaint-reject" | "refund", order: Order) {
    setWorkflowModal({ open: true, kind, order });
    setWorkflowStatus("");
    setWorkflowSubStatus("");
    setWorkflowPenalty("");
    setWorkflowRemarks("");
    setWorkflowAmount(String(valueFrom(order.raw, "RefundAmount", "refundAmount", "PaidAmount", "paidAmount", "TotalAmount", "totalAmount") || ""));
  }

  async function submitWorkflow() {
    const order = workflowModal.order;
    if (!order || !workflowModal.kind) return;
    const actor = getAdminActor();
    setWorkflowSaving(true);
    try {
      if (workflowModal.kind === "complaint-approve" || workflowModal.kind === "complaint-reject") {
        const complaintId = valueFrom(order.raw, "ComplaintId", "complaintId", "ComplaintNo", "complaintNo");
        if (!complaintId) throw new Error("Complaint ID not found");
        if (workflowModal.kind === "complaint-approve" && !workflowStatus) throw new Error("Final status select karein");
        const res = await fetch(`/api/orders/complaints/${encodeURIComponent(String(complaintId))}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: workflowModal.kind === "complaint-approve" ? "Approved" : "Rejected",
            finalStatus: workflowStatus || undefined,
            finalSubStatus: workflowSubStatus || undefined,
            vendorPenalty: workflowPenalty === "" ? undefined : Number(workflowPenalty),
            adminRemarks: workflowRemarks,
            adminName: actor.userName, userName: actor.userName, changedBy: actor.userName,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Complaint action failed");
      } else {
        const refundId = valueFrom(order.raw, "RefundId", "refundId", "RefundNo", "refundNo");
        if (!refundId) throw new Error("Refund ID not found");
        if (!workflowStatus) throw new Error("Refund status select karein");
        const res = await fetch(`/api/admin/refunds/${encodeURIComponent(String(refundId))}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refundStatus: workflowStatus, refundAmount: workflowAmount === "" ? undefined : Number(workflowAmount), remarks: workflowRemarks, adminName: actor.userName }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Refund update failed");
      }
      setWorkflowModal({ open: false, kind: null, order: null });
      hasLoadedTabRef.current[activeTab] = false;
      setRefreshTick((v) => v + 1);
    } catch (e: any) { alert(e?.message || "Action failed"); } finally { setWorkflowSaving(false); }
  }

  return (
    <section
      style={{
        padding: 12,
        minHeight: "100vh",
        background: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Orders Dashboard
          </h1>
          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Real-time dynamic monitoring console ordered by delivery schedule
            urgency
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link
            href="/admin/orders"
            onClick={() => {
              setNewOrderCount(0);
              localStorage.removeItem("raileats_new_orders");
            }}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              color: "#111827",
              textDecoration: "none",
            }}
          >
            <Bell size={24} />
            {Number(newOrderCount) > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -8,
                  right: -10,
                  background: "#dc2626",
                  color: "#fff",
                  borderRadius: 999,
                  minWidth: 20,
                  height: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 6px",
                }}
              >
                {newOrderCount}
              </span>
            )}
          </Link>

          <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 600 }}>
            Active Stage:{" "}
            <strong style={{ color: "#2563eb" }}>
              {TABS.find((t) => t.key === activeTab)?.label}
            </strong>
            {loading ? " • Syncing..." : ""}
          </div>
        </div>
      </header>

      {/* TABS VIEW */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                localStorage.setItem("raileats_admin_tab", tab.key);

                setSearchOrderId("");
                setSearchCustomerMobile("");
                setSearchOutlet("");
                setSearchStation("");
                setSearchTrainNo("");
                setSearchDeliveryFrom("");
                setSearchDeliveryTo("");
                setSearchBookingFrom("");
                setSearchBookingTo("");
                setBookingDateFilterOn(false);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: active ? "2px solid #2563eb" : "1px solid #e2e8f0",
                background: active ? "#fff" : "#f8fafc",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: active ? "#0f172a" : "#475569" }}>
                  {tab.label}
                </span>
                <span
                  style={{
                    background: active ? "#2563eb" : "#e2e8f0",
                    color: active ? "#fff" : "#475569",
                    borderRadius: 999,
                    minWidth: 20,
                    height: 20,
                    padding: "0 6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {tabCounts[tab.key] || 0}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* FILTER CONTROLS */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
          background: "#fff",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #e2e8f0",
        }}
      >
        <input
          placeholder="Order ID"
          value={draftOrderId}
          onChange={(e) => setDraftOrderId(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            width: 150,
            fontSize: 13,
          }}
        />

        <input
          placeholder="Customer Mobile"
          value={draftCustomerMobile}
          onChange={(e) => setDraftCustomerMobile(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            width: 150,
            fontSize: 13,
          }}
        />

        <input
          placeholder="Outlet ID / Name"
          value={draftOutlet}
          onChange={(e) => setDraftOutlet(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            width: 160,
            fontSize: 13,
          }}
        />

        <input
          placeholder="Station Code / Name"
          value={draftStation}
          onChange={(e) => setDraftStation(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            width: 170,
            fontSize: 13,
          }}
        />

        <input
          placeholder="Train No."
          value={draftTrainNo}
          onChange={(e) => setDraftTrainNo(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            width: 120,
            fontSize: 13,
          }}
        />

        <select
          value={draftDateSearchType}
          onChange={(e) =>
            setDraftDateSearchType(e.target.value as "delivery" | "booking")
          }
          style={{
            padding: 8,
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            width: 160,
            fontSize: 13,
          }}
        >
          <option value="delivery">By Delivery Date</option>
          <option value="booking">By Booking Date</option>
        </select>

        {draftDateSearchType === "delivery" && (
          <>
            <input
              type="datetime-local"
              value={draftDeliveryFrom}
              onChange={(e) => setDraftDeliveryFrom(e.target.value)}
              title="Delivery From"
              style={{
                padding: 7,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                width: 190,
                fontSize: 13,
              }}
            />

            <input
              type="datetime-local"
              value={draftDeliveryTo}
              onChange={(e) => setDraftDeliveryTo(e.target.value)}
              title="Delivery To"
              style={{
                padding: 7,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                width: 190,
                fontSize: 13,
              }}
            />
          </>
        )}

        {draftDateSearchType === "booking" && (
          <>
            <input
              type="datetime-local"
              value={draftBookingFrom}
              onChange={(e) => setDraftBookingFrom(e.target.value)}
              title="Booking From"
              style={{
                padding: 7,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                width: 190,
                fontSize: 13,
              }}
            />

            <input
              type="datetime-local"
              value={draftBookingTo}
              onChange={(e) => setDraftBookingTo(e.target.value)}
              title="Booking To"
              style={{
                padding: 7,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                width: 190,
                fontSize: 13,
              }}
            />
          </>
        )}

        <button
          onClick={() => {
            const hasTextSearch = Boolean(
              draftOrderId.trim() ||
                draftCustomerMobile.trim() ||
                draftOutlet.trim() ||
                draftStation.trim() ||
                draftTrainNo.trim(),
            );

            setSearchOrderId(draftOrderId.trim());
            setSearchCustomerMobile(draftCustomerMobile.trim());
            setSearchOutlet(draftOutlet.trim());
            setSearchStation(draftStation.trim());
            setSearchTrainNo(draftTrainNo.trim());
            setDateSearchType(draftDateSearchType);

            if (hasTextSearch) {
              setActiveTab("all");
              localStorage.setItem("raileats_admin_tab", "all");
              setSearchDeliveryFrom("");
              setSearchDeliveryTo("");
              setSearchBookingFrom("");
              setSearchBookingTo("");
              setBookingDateFilterOn(false);
            } else if (draftDateSearchType === "delivery") {
              setSearchDeliveryFrom(draftDeliveryFrom);
              setSearchDeliveryTo(draftDeliveryTo);
              setSearchBookingFrom("");
              setSearchBookingTo("");
              setBookingDateFilterOn(false);
            } else {
              setSearchDeliveryFrom("");
              setSearchDeliveryTo("");
              setSearchBookingFrom(draftBookingFrom);
              setSearchBookingTo(draftBookingTo);
              setBookingDateFilterOn(true);
            }
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Search
        </button>

        <button
          onClick={() => {
            setDraftOrderId("");
            setDraftCustomerMobile("");
            setDraftOutlet("");
            setDraftStation("");
            setDraftTrainNo("");

            setDraftDateSearchType("delivery");
            setDraftDeliveryFrom(`${todayDate}T00:00`);
            setDraftDeliveryTo(`${todayDate}T23:59`);
            setDraftBookingFrom(`${todayDate}T00:00`);
            setDraftBookingTo(`${todayDate}T23:59`);

            setSearchOrderId("");
            setSearchCustomerMobile("");
            setSearchOutlet("");
            setSearchStation("");
            setSearchTrainNo("");

            setDateSearchType("delivery");
            setSearchDeliveryFrom("");
            setSearchDeliveryTo("");
            setSearchBookingFrom("");
            setSearchBookingTo("");
            setBookingDateFilterOn(false);
          }}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "1px solid #cbd5e1",
            background: "#f1f5f9",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Reset Filters
        </button>

        <button
          onClick={downloadOrdersReport}
          style={{
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            background: "#16a34a",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Download Report
        </button>
      </div>
      {/* TABLE VIEW */}
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 12,
          boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 1300,
            }}
          >
            <thead
              style={{
                textAlign: "left",
                borderBottom: "2px solid #edf2f7",
                background: "#f8fafc",
                fontSize: 13,
                color: "#475569",
              }}
            >
              <tr>
                <th style={{ padding: 12 }}>Order ID</th>
                <th style={{ padding: 12 }}>Outlet ID</th>
                <th style={{ padding: 12 }}>Outlet Name</th>
                <th style={{ padding: 12 }}>Station Code</th>
                <th style={{ padding: 12 }}>Station Name</th>
                <th style={{ padding: 12 }}>Delivery Date</th>
                <th style={{ padding: 12 }}>Delivery Time</th>
                <th style={{ padding: 12 }}>Train No.</th>
                <th style={{ padding: 12 }}>Coach</th>
                <th style={{ padding: 12 }}>Seat</th>
                <th style={{ padding: 12 }}>Customer Name</th>
                <th style={{ padding: 12 }}>Customer Mobile</th>
                <th style={{ padding: 12 }}>Payment</th>
                <th style={{ padding: 12 }}>Order Process Log</th>
                <th style={{ padding: 12, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody style={{ fontSize: 13, color: "#334155" }}>
              {visibleOrders.map((o) => (
                <tr
                  key={o.id}
                  style={{ borderBottom: "1px solid #f1f5f9" }}
                  className="table-row-hover"
                >
                  {/* MODIFIED: Clickable Order ID triggers detailed information view */}
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleOpenDiagnosticsDrawer(o, "details")}
                      title="View order details"
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        font: "inherit",
                        fontWeight: 800,
                        color: "#2563eb",
                        cursor: "pointer",
                        textDecoration: "underline",
                        textAlign: "left",
                      }}
                    >
                      #{o.id}
                    </button>
                  </td>

                  <td style={{ padding: 12 }}>
                    {o.outletId ? (
                      <Link
                        href={`/admin/restros/${encodeURIComponent(o.outletId)}/edit`}
                        title={`Open restro ${o.outletId} edit page`}
                        style={{
                          background: "#f1f5f9",
                          color: "#0f172a",
                          padding: "3px 6px",
                          borderRadius: 4,
                          fontWeight: 700,
                          textDecoration: "underline",
                          display: "inline-block",
                        }}
                      >
                        {o.outletId}
                      </Link>
                    ) : (
                      <span
                        style={{
                          background: "#f1f5f9",
                          padding: "3px 6px",
                          borderRadius: 4,
                          fontWeight: 600,
                        }}
                      >
                        -
                      </span>
                    )}
                  </td>
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {o.outletName}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "3px 6px",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {o.stationCode}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{o.stationName}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    {o.deliveryDate}
                  </td>
                  <td
                    style={{ padding: 12, fontWeight: 600, color: "#0284c7" }}
                  >
                    {o.deliveryTime}
                  </td>
                  <td style={{ padding: 12 }}>
                    {o.trainNo ? (
                      <button
                        onClick={() => openRouteModal(o.trainNo, o.stationCode)}
                        title="Open train route map"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          margin: 0,
                          color: "#2563eb",
                          cursor: "pointer",
                          font: "inherit",
                          fontWeight: 800,
                          textDecoration: "underline",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <MapPin size={14} /> {o.trainNo}
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ padding: 12 }}>{o.coach || "-"}</td>
                  <td style={{ padding: 12 }}>{o.seat || "-"}</td>
                  <td style={{ padding: 12, fontWeight: 600 }}>
                    {o.customerName}
                  </td>
                  <td style={{ padding: 12, fontFamily: "monospace" }}>
                    {o.customerMobile}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontWeight: 700,
                        fontSize: 12,
                        background: isPrepaidOrder(o) ? "#dcfce7" : "#fee2e2",
                        color: isPrepaidOrder(o) ? "#166534" : "#991b1b",
                      }}
                    >
                      {isPrepaidOrder(o) ? "PPD" : "COD"}
                    </span>
                  </td>

                  {/* Order process log opens the centered log view */}
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleOpenDiagnosticsDrawer(o, "logs")}
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                        width: 38,
                        height: 34,
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Eye size={18} />
                    </button>
                  </td>

                  <td style={{ padding: 12, verticalAlign: "middle" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* INLINE BUTTON CONTROLLERS */}
                      {o.status === "complaints" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openWorkflow("complaint-approve", o)} style={{ padding: "6px 10px", borderRadius: 6, background: "#16a34a", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 11 }}>Approve</button>
                          <button onClick={() => openWorkflow("complaint-reject", o)} style={{ padding: "6px 10px", borderRadius: 6, background: "#dc2626", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 11 }}>Reject</button>
                        </div>
                      ) : o.status === "refund" ? (
                        <button onClick={() => openWorkflow("refund", o)} style={{ padding: "6px 10px", borderRadius: 6, background: "#7c3aed", color: "#fff", border: "none", cursor: "pointer", fontWeight: 800, fontSize: 11 }}>Update Refund</button>
                      ) : o.status === "cancellationrequest" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrder(o);
                            setActionType("cancel");
                            setSubStatus("");
                            setRemarks("");
                            setVendorPenaltyAmount("");
                            setStatusModalOpen(true);
                          }}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: 11,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Review & Cancel
                        </button>
                      ) : [
                          "booked",
                          "verification",
                          "neworder",
                          "inkitchen",
                          "outfordelivery",
                        ].includes(o.status) ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            flexWrap: "nowrap",
                          }}
                        >
                          <button
                            onClick={() => {
                              if (!confirm(`Move ${o.id} to next status?`))
                                return;
                              moveOrderToNext(o.id);
                            }}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              background: "#2563eb",
                              color: "#fff",
                              border: "none",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: 11,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {NEXT_MAP[o.status]?.actionLabel}
                          </button>

                          {(o.status === "booked" ||
                            o.status === "verification" ||
                            o.status === "neworder") && (
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                actionType === "cancel";
                                setActionType("cancel");
                                setSubStatus("");
                                setRemarks("");
                                setVendorPenaltyAmount("");
                                setStatusModalOpen(true);
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: "#dc2626",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: 11,
                              }}
                            >
                              Cancel
                            </button>
                          )}

                          {(o.status === "inkitchen" ||
                            o.status === "outfordelivery") && (
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                setActionType("mark");
                                setSubStatus("");
                                setRemarks("");
                                setVendorPenaltyAmount("");
                                setStatusModalOpen(true);
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 6,
                                background: "#475569",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: 11,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Mark Status
                            </button>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            alignItems: "center",
                          }}
                        >
                          <select
                            value={marking[o.id]?.status || ""}
                            onChange={(e) =>
                              setMarking((prev) => ({
                                ...prev,
                                [o.id]: {
                                  ...(prev[o.id] || { remarks: "" }),
                                  status: e.target.value,
                                },
                              }))
                            }
                            style={{
                              padding: 5,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              fontSize: 11,
                            }}
                          >
                            <option value="">Select status</option>
                            {FINAL_MARK_OPTIONS.map((opt) => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          <input
                            placeholder="Remarks"
                            value={marking[o.id]?.remarks || ""}
                            onChange={(e) =>
                              setMarking((prev) => ({
                                ...prev,
                                [o.id]: {
                                  ...(prev[o.id] || { status: "" }),
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            style={{
                              padding: 5,
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              fontSize: 11,
                              width: 100,
                            }}
                          />

                          <button
                            onClick={() => submitMark(o)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: "#0f172a",
                              color: "#fff",
                              cursor: "pointer",
                              border: "none",
                              fontSize: 11,
                              fontWeight: "bold",
                            }}
                          >
                            Go
                          </button>
                          {marking[o.id] && (
                            <button
                              onClick={() =>
                                setMarking((prev) => {
                                  const cp = { ...prev };
                                  delete cp[o.id];
                                  return cp;
                                })
                              }
                              style={{
                                padding: "5px 6px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 11,
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={14}
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "#94a3b8",
                      fontWeight: 600,
                    }}
                  >
                    No active track records inside this tab scope constraints.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td
                    colSpan={14}
                    style={{
                      padding: 30,
                      textAlign: "center",
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    Syncing structural updates with live engine stream...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRAIN ROUTE MODAL */}
      {routeModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 920,
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <MapPin size={18} /> Route Map: {routeModal.trainNo}
                  {routeModal.data[0]?.trainName ? (
                    <span style={{ color: "#2563eb" }}>
                      - {routeModal.data[0].trainName}
                    </span>
                  ) : null}
                </h3>
                {routeModal.data[0] && (
                  <div
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}
                  >
                    {routeModal.data[0].stationFrom || "-"} to{" "}
                    {routeModal.data[0].stationTo || "-"} ·{" "}
                    {routeModal.data.length} stations ·{" "}
                    {routeModal.data[0].runningDays || "Running days N/A"}
                  </div>
                )}
              </div>
              <button
                onClick={() =>
                  setRouteModal((prev) => ({
                    ...prev,
                    open: false,
                    message: "",
                  }))
                }
                title="Close route map"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflow: "auto", padding: 16 }}>
              <table
                style={{
                  width: "100%",
                  minWidth: 820,
                  borderCollapse: "collapse",
                  fontSize: 13,
                }}
              >
                <thead>
                  <tr
                    style={{
                      position: "sticky",
                      top: 0,
                      background: "#f8fafc",
                      zIndex: 1,
                      borderBottom: "1px solid #e2e8f0",
                      color: "#64748b",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "9px 8px", width: 56 }}>No.</th>
                    <th style={{ padding: "9px 8px" }}>Station</th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>
                      Arrives
                    </th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>
                      Departs
                    </th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>
                      Stop
                    </th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>
                      Distance
                    </th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>
                      Platform
                    </th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>
                      Day
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {routeModal.data.length > 0 ? (
                    routeModal.data.map((r, idx) => {
                      const stationCode = normalizeRouteValue(
                        getRouteField(
                          r,
                          "StationCode",
                          "stationCode",
                          "stationcode",
                        ),
                      ).toUpperCase();
                      const stationName = normalizeRouteValue(
                        getRouteField(
                          r,
                          "StationName",
                          "stationName",
                          "stationname",
                        ),
                      );
                      const stnNumber = getRouteField(
                        r,
                        "StnNumber",
                        "stnNumber",
                        "stnnumber",
                      );
                      const arrives = normalizeRouteValue(
                        getRouteField(r, "Arrives", "arrives"),
                      );
                      const departs = normalizeRouteValue(
                        getRouteField(r, "Departs", "departs"),
                      );
                      const stopTime = normalizeRouteValue(
                        getRouteField(r, "Stoptime", "stoptime", "StopTime"),
                      );
                      const distance = normalizeRouteValue(
                        getRouteField(r, "Distance", "distance"),
                      );
                      const platform = normalizeRouteValue(
                        getRouteField(r, "Platform", "platform"),
                      );
                      const day = normalizeRouteValue(
                        getRouteField(r, "Day", "day"),
                      );
                      const isTarget = stationCode === routeModal.stationCode;
                      return (
                        <tr
                          key={`${stnNumber || idx}-${stationCode}`}
                          id={`stn-${stationCode}`}
                          style={{
                            background: isTarget ? "#fef08a" : "transparent",
                            fontWeight: isTarget ? 800 : 600,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          <td
                            style={{
                              padding: "10px 8px",
                              width: 52,
                              color: "#94a3b8",
                              fontWeight: 800,
                            }}
                          >
                            {stnNumber || idx + 1}
                          </td>
                          <td style={{ padding: "10px 8px", color: "#0f172a" }}>
                            {stationName || "Unknown Station"}{" "}
                            <span style={{ color: "#2563eb" }}>
                              ({stationCode || "-"})
                            </span>
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              textAlign: "right",
                              color: "#475569",
                              fontFamily: "monospace",
                            }}
                          >
                            {arrives || "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              textAlign: "right",
                              color: "#475569",
                              fontFamily: "monospace",
                            }}
                          >
                            {departs || "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              textAlign: "right",
                              color: "#475569",
                              fontFamily: "monospace",
                            }}
                          >
                            {stopTime || "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              textAlign: "right",
                              color: "#475569",
                              fontFamily: "monospace",
                            }}
                          >
                            {distance || "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              textAlign: "right",
                              color: "#475569",
                              fontFamily: "monospace",
                            }}
                          >
                            {platform || "-"}
                          </td>
                          <td
                            style={{
                              padding: "10px 8px",
                              textAlign: "right",
                              color: "#475569",
                              fontFamily: "monospace",
                            }}
                          >
                            {day || "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        style={{
                          padding: 20,
                          textAlign: "center",
                          color: "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        {routeModal.message ||
                          "No route rows found for this train number in TrainRoute table."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* ORDER DETAILS / LOGS CENTER MODAL */}
      {/* ========================================================================= */}
      {viewDrawerOpen && detailedOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.64)",
            backdropFilter: "blur(5px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => {
            setViewDrawerOpen(false);
            setDetailedOrder(null);
          }}
        >
          <div
            className="order-details-modal"
            style={{
              width: "min(1220px, 96vw)",
              height: "92vh",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 28px 80px rgba(15,23,42,0.34)",
              display: "flex",
              flexDirection: "column",
              animation: "scaleIn 0.18s ease-out",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#f8fafc",
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 900,
                      color: "#0f172a",
                    }}
                  >
                    Order Details
                  </h2>
                  <span
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 6,
                    }}
                  >
                    #{detailedOrder.id}
                  </span>
                </div>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: 11,
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  Current Status:{" "}
                  <span style={{ color: "#2563eb", fontWeight: 800 }}>
                    {detailedOrder.dbStatus || detailedOrder.status}
                  </span>
                </p>
              </div>

              <button
                onClick={() => {
                  setViewDrawerOpen(false);
                  setDetailedOrder(null);
                }}
                title="Close"
                style={{
                  width: 36,
                  height: 36,
                  background: "#fff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #e2e8f0",
                background: "#fff",
                padding: "0 24px",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setActiveDrawerSection("details")}
                style={{
                  padding: "14px 20px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeDrawerSection === "details"
                      ? "3px solid #2563eb"
                      : "3px solid transparent",
                  color:
                    activeDrawerSection === "details" ? "#2563eb" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Order Details
              </button>
              <button
                onClick={() => setActiveDrawerSection("logs")}
                style={{
                  padding: "14px 20px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeDrawerSection === "logs"
                      ? "3px solid #2563eb"
                      : "3px solid transparent",
                  color: activeDrawerSection === "logs" ? "#2563eb" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Order Process Log
              </button>
              <button
                onClick={() => setActiveDrawerSection("whatsapp")}
                style={{
                  padding: "14px 20px",
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeDrawerSection === "whatsapp"
                      ? "3px solid #16a34a"
                      : "3px solid transparent",
                  color:
                    activeDrawerSection === "whatsapp" ? "#16a34a" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                WhatsApp Message
              </button>
            </div>

            <div
              style={{
                flex: 1,
                padding: 22,
                overflowY: "auto",
                minHeight: 0,
              }}
            >
              {activeDrawerSection === "details" ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  <div className="order-top-grid">
                    <div className="order-info-card">
                      <h3 className="order-card-title">
                        <Smartphone size={15} /> Journey &amp; Customer Details
                      </h3>
                      <div className="order-field-grid">
                        <OrderDetailField
                          label="Customer Name"
                          value={
                            detailedOrder.customerName ||
                            valueFrom(
                              detailedOrder.raw,
                              "CustomerName",
                              "customerName",
                            ) ||
                            "Guest"
                          }
                        />
                        <OrderDetailField
                          label="Customer Mobile"
                          value={
                            detailedOrder.customerMobile ||
                            valueFrom(
                              detailedOrder.raw,
                              "CustomerMobile",
                              "customerMobile",
                            ) ||
                            "N/A"
                          }
                        />
                        <OrderDetailField
                          label="PNR Number"
                          value={
                            valueFrom(
                              detailedOrder.raw,
                              "PNR",
                              "pnr",
                              "PnrNumber",
                              "PNRNumber",
                            ) || "N/A"
                          }
                        />
                        <OrderDetailField
                          label="Train Number"
                          value={
                            detailedOrder.trainNo
                              ? `Train ${detailedOrder.trainNo}`
                              : "N/A"
                          }
                        />
                        <OrderDetailField
                          label="Coach"
                          value={detailedOrder.coach || "-"}
                        />
                        <OrderDetailField
                          label="Seat"
                          value={detailedOrder.seat || "-"}
                        />
                        <OrderDetailField
                          label="Delivery Date"
                          value={detailedOrder.deliveryDate || "N/A"}
                          highlight
                        />
                        <OrderDetailField
                          label="Delivery Time"
                          value={detailedOrder.deliveryTime || "N/A"}
                          highlight
                        />
                        <OrderDetailField
                          label="Station Code"
                          value={detailedOrder.stationCode || "N/A"}
                        />
                        <OrderDetailField
                          label="Station Name"
                          value={detailedOrder.stationName || "N/A"}
                        />
                        <OrderDetailField
                          label="Booking Source"
                          value={
                            valueFrom(
                              detailedOrder.raw,
                              "BookingSource",
                              "bookingSource",
                              "Source",
                              "source",
                            ) || "N/A"
                          }
                        />
                        <OrderDetailField
                          label="Booked By"
                          value={
                            valueFrom(
                              detailedOrder.raw,
                              "BookedBy",
                              "bookedBy",
                            ) || "Customer"
                          }
                        />
                        <div className="order-field-full">
                          <OrderDetailField
                            label="Order Booked At"
                            value={formatAdminDateTime(
                              valueFrom(
                                detailedOrder.raw,
                                "CreatedAt",
                                "createdAt",
                                "created_at",
                              ) || detailedOrder.rawCreatedAt,
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="order-info-card payment-card">
                      <h3 className="order-card-title payment-title">
                        <ShieldCheck size={15} /> Payment Details
                      </h3>
                      <div className="payment-summary-row">
                        <div>
                          <span className="order-field-label">
                            Payment Mode
                          </span>
                          <span className="payment-mode-pill">
                            {String(
                              detailedOrder.paymentMode ||
                                valueFrom(
                                  detailedOrder.raw,
                                  "PaymentMode",
                                  "paymentMode",
                                ) ||
                                "COD",
                            ).toUpperCase()}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className="order-field-label">
                            Payment Status
                          </span>
                          <strong style={{ color: "#166534", fontSize: 14 }}>
                            {valueFrom(
                              detailedOrder.raw,
                              "PaymentStatus",
                              "paymentStatus",
                            ) ||
                              (isPrepaidOrder(detailedOrder)
                                ? "Paid / Online"
                                : "Pay on Delivery")}
                          </strong>
                        </div>
                      </div>

                      <div className="payment-lines">
                        <PaymentLine
                          label="Base Price / Subtotal"
                          value={moneyFrom(
                            detailedOrder.raw,
                            "BasePrice",
                            "basePrice",
                            "Subtotal",
                            "subtotal",
                            "SubTotal",
                          )}
                        />
                        <PaymentLine
                          label="GST Amount"
                          value={moneyFrom(
                            detailedOrder.raw,
                            "GSTAmount",
                            "gstAmount",
                            "GST",
                            "gst",
                            "TaxAmount",
                            "taxAmount",
                          )}
                        />
                        <PaymentLine
                          label="Platform Charge"
                          value={moneyFrom(
                            detailedOrder.raw,
                            "PlatformCharge",
                            "platformCharge",
                          )}
                        />
                        <PaymentLine
                          label="Delivery Charge"
                          value={moneyFrom(
                            detailedOrder.raw,
                            "DeliveryCharge",
                            "deliveryCharge",
                          )}
                        />
                        <PaymentLine
                          label="Coupon Code / Discount"
                          textValue={(() => {
                            const couponCode = valueFrom(
                              detailedOrder.raw,
                              "CouponCode",
                              "couponCode",
                              "AppliedCoupon",
                              "appliedCoupon",
                            );
                            const couponDiscount = moneyFrom(
                              detailedOrder.raw,
                              "CouponDiscount",
                              "couponDiscount",
                              "DiscountAmount",
                              "discountAmount",
                              "Discount",
                            );

                            if (!couponCode && !couponDiscount)
                              return "Not Applied";
                            if (!couponCode)
                              return `- ₹${moneyNumber(couponDiscount || 0)}`;
                            if (!couponDiscount) return String(couponCode);
                            return `${couponCode}  •  - ₹${moneyNumber(couponDiscount)}`;
                          })()}
                        />
                        <PaymentLine
                          label="Order Total"
                          value={
                            moneyFrom(
                              detailedOrder.raw,
                              "TotalAmount",
                              "totalAmount",
                            ) ?? Number(detailedOrder.total || 0)
                          }
                        />
                      </div>

                      <div className="payable-box">
                        <span>
                          {isPrepaidOrder(detailedOrder)
                            ? "Amount to Collect"
                            : "Payable Amount"}
                        </span>
                        <strong>
                          ₹
                          {moneyNumber(
                            isPrepaidOrder(detailedOrder)
                              ? 0
                              : (moneyFrom(
                                  detailedOrder.raw,
                                  "TotalAmount",
                                  "totalAmount",
                                ) ?? Number(detailedOrder.total || 0)),
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <h3 className="section-heading">
                      <ShoppingBag size={15} /> Menu Items (
                      {fetchedItems.length})
                    </h3>
                    <div className="items-table-wrap">
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Item &amp; Description</th>
                            <th>Type</th>
                            <th style={{ textAlign: "right" }}>Unit Price</th>
                            <th style={{ textAlign: "center" }}>Qty</th>
                            <th style={{ textAlign: "right" }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingItems ? (
                            <tr>
                              <td colSpan={5} className="empty-cell">
                                Loading order items...
                              </td>
                            </tr>
                          ) : fetchedItems.length > 0 ? (
                            fetchedItems.map((item: any, idx: number) => {
                              const itemName =
                                valueFrom(
                                  item,
                                  "ItemName",
                                  "itemName",
                                  "item_name",
                                  "Name",
                                  "name",
                                ) || `Item ${idx + 1}`;
                              const description = valueFrom(
                                item,
                                "ItemDescription",
                                "itemDescription",
                                "item_description",
                                "Description",
                                "description",
                              );
                              const quantity = Number(
                                valueFrom(
                                  item,
                                  "Quantity",
                                  "quantity",
                                  "Qty",
                                  "qty",
                                ) || 1,
                              );
                              const unitPrice = Number(
                                valueFrom(
                                  item,
                                  "SellingPrice",
                                  "sellingPrice",
                                  "UnitPrice",
                                  "unitPrice",
                                  "Price",
                                  "price",
                                ) || 0,
                              );
                              const lineTotal = Number(
                                valueFrom(
                                  item,
                                  "LineTotal",
                                  "lineTotal",
                                  "Total",
                                  "total",
                                ) || unitPrice * quantity,
                              );
                              const menuType =
                                valueFrom(
                                  item,
                                  "MenuType",
                                  "menuType",
                                  "menu_type",
                                  "TypeName",
                                  "typeName",
                                  "FoodType",
                                  "foodType",
                                ) || "-";
                              return (
                                <tr
                                  key={
                                    valueFrom(item, "ItemId", "itemId", "id") ||
                                    idx
                                  }
                                >
                                  <td>
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        color: "#0f172a",
                                      }}
                                    >
                                      {itemName}
                                    </div>
                                    <div className="item-description">
                                      {description ||
                                        "No item description available"}
                                    </div>
                                  </td>
                                  <td>
                                    <span className="type-chip">
                                      {menuType}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: "right" }}>
                                    ₹{moneyNumber(unitPrice)}
                                  </td>
                                  <td
                                    style={{
                                      textAlign: "center",
                                      color: "#2563eb",
                                      fontWeight: 900,
                                    }}
                                  >
                                    × {quantity}
                                  </td>
                                  <td
                                    style={{
                                      textAlign: "right",
                                      fontWeight: 800,
                                    }}
                                  >
                                    ₹{moneyNumber(lineTotal)}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="empty-cell">
                                No order items found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="restaurant-card">
                    <h3 className="order-card-title restaurant-title">
                      <ShieldCheck size={15} /> Restaurant / Outlet Details
                    </h3>
                    {loadingRestro ? (
                      <p className="loading-text">
                        Loading restaurant details...
                      </p>
                    ) : fetchedRestro ? (
                      <div className="restaurant-grid">
                        <OrderDetailField
                          label="Restro Code"
                          value={
                            valueFrom(
                              fetchedRestro,
                              "RestroCode",
                              "restroCode",
                            ) ||
                            detailedOrder.outletId ||
                            "N/A"
                          }
                        />
                        <OrderDetailField
                          label="Restro Name"
                          value={
                            valueFrom(
                              fetchedRestro,
                              "RestroName",
                              "restroName",
                            ) ||
                            detailedOrder.outletName ||
                            "N/A"
                          }
                        />
                        <OrderDetailField
                          label="Station"
                          value={`${valueFrom(fetchedRestro, "StationName", "stationName") || detailedOrder.stationName || "N/A"} (${valueFrom(fetchedRestro, "StationCode", "stationCode") || detailedOrder.stationCode || "-"})`}
                        />
                        <OrderDetailField
                          label="Outlet Mobile"
                          value={
                            valueFrom(
                              fetchedRestro,
                              "RestroPhone",
                              "restroPhone",
                              "OwnerPhone",
                              "ownerPhone",
                              "RestroLoginMobile",
                            ) || "N/A"
                          }
                        />
                        <OrderDetailField
                          label="Open / Close Time"
                          value={`${valueFrom(fetchedRestro, "open_time", "OpenTime", "openTime") || "N/A"} - ${valueFrom(fetchedRestro, "closed_time", "CloseTime", "closeTime") || "N/A"}`}
                        />
                        <OrderDetailField
                          label="FSSAI Number"
                          value={
                            valueFrom(
                              fetchedRestro,
                              "FSSAINumber",
                              "FssaiNumber",
                              "fssaiNumber",
                            ) || "N/A"
                          }
                        />
                        <OrderDetailField
                          label="FSSAI Expiry"
                          value={
                            valueFrom(
                              fetchedRestro,
                              "FSSAIExpiryDate",
                              "fssaiExpiryDate",
                            ) || "N/A"
                          }
                        />
                        <OrderDetailField
                          label="GST Number"
                          value={
                            valueFrom(
                              fetchedRestro,
                              "GSTNumber",
                              "GstNumber",
                              "gstNumber",
                            ) || "N/A"
                          }
                        />
                        <div className="order-field-full">
                          <OrderDetailField
                            label="Outlet Address"
                            value={
                              valueFrom(
                                fetchedRestro,
                                "RestroAddress",
                                "Address",
                                "address",
                                "FullAddress",
                                "fullAddress",
                              ) || "N/A"
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="loading-text">
                        No restaurant details found.
                      </p>
                    )}
                  </div>
                </div>
              ) : activeDrawerSection === "logs" ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <h3 className="section-heading">
                    <Clock size={15} /> Order Process Timeline (
                    {orderLogs.length})
                  </h3>

                  {loadingLogs ? (
                    <p className="loading-text">Loading order process log...</p>
                  ) : orderLogs.length === 0 ? (
                    <div
                      style={{
                        background: "#fef3c7",
                        border: "1px solid #fde68a",
                        color: "#92400e",
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      No order process log found for this order.
                    </div>
                  ) : (
                    <div
                      style={{
                        position: "relative",
                        borderLeft: "2px dashed #e2e8f0",
                        paddingLeft: 18,
                        marginLeft: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      {orderLogs.map((log: any, idx: number) => {
                        const newStatus =
                          log.NewStatus ?? log.newStatus ?? log.Status ?? "N/A";
                        const oldStatus = log.OldStatus ?? log.oldStatus ?? "";
                        const subStatusText =
                          log.SubStatus ?? log.subStatus ?? "";
                        const remarksText = log.Remarks ?? log.remarks ?? "";
                        const noteText = log.Note ?? log.note ?? "";
                        const userType =
                          log.UserType ??
                          log.userType ??
                          log.ActionSource ??
                          log.actionSource ??
                          "System";
                        const userName =
                          log.UserName ??
                          log.userName ??
                          log.ChangedBy ??
                          log.changedBy ??
                          log.Actor ??
                          "System";
                        const source =
                          log.ActionSource ?? log.actionSource ?? userType;
                        const changedAt =
                          log.ChangedAt ??
                          log.changedAt ??
                          log.created_at ??
                          log.CreatedAt;

                        return (
                          <div
                            key={log.Id || log.id || idx}
                            style={{ position: "relative" }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: -24,
                                top: 4,
                                background: "#2563eb",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                border: "2px solid #fff",
                                boxShadow: "0 0 0 2px #bfdbfe",
                              }}
                            />
                            <div
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: 10,
                                padding: "12px 14px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  flexWrap: "wrap",
                                  gap: 4,
                                  fontSize: 12,
                                }}
                              >
                                <span
                                  style={{ fontWeight: 800, color: "#0f172a" }}
                                >
                                  Status:{" "}
                                  <span style={{ color: "#2563eb" }}>
                                    {newStatus}
                                  </span>
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "#94a3b8",
                                    fontWeight: 700,
                                  }}
                                >
                                  {formatAdminDateTime(changedAt)}
                                </span>
                              </div>
                              {oldStatus && (
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                  Previous Status:{" "}
                                  <span
                                    style={{ textDecoration: "line-through" }}
                                  >
                                    {oldStatus}
                                  </span>
                                </div>
                              )}
                              {(subStatusText || remarksText || noteText) && (
                                <div
                                  style={{
                                    background: "#fff",
                                    border: "1px solid #e2e8f0",
                                    padding: 10,
                                    borderRadius: 8,
                                    fontSize: 11,
                                    color: "#475569",
                                    display: "grid",
                                    gap: 5,
                                  }}
                                >
                                  {subStatusText && (
                                    <div>
                                      <strong style={{ color: "#e11d48" }}>
                                        Sub Status:
                                      </strong>{" "}
                                      {subStatusText}
                                    </div>
                                  )}
                                  {remarksText && (
                                    <div>
                                      <strong>Remarks:</strong> {remarksText}
                                    </div>
                                  )}
                                  {noteText && noteText !== remarksText && (
                                    <div>
                                      <strong>Note:</strong> {noteText}
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="log-meta-grid">
                                <span>
                                  User Type: <strong>{userType}</strong>
                                </span>
                                <span>
                                  User Name: <strong>{userName}</strong>
                                </span>
                                <span>
                                  Source: <strong>{source}</strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: 820,
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 14,
                      padding: 18,
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 6px",
                        color: "#166534",
                        fontSize: 15,
                        fontWeight: 900,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <MessageCircle size={18} /> Vendor WhatsApp Message
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        color: "#64748b",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      Message order details aur order items se automatically
                      generate hua hai. Send karne se pehle edit bhi kar sakte
                      ho.
                    </p>
                  </div>

                  <textarea
                    value={whatsappMessage}
                    onChange={(e) => {
                      setWhatsappMessage(e.target.value);
                      setMessageCopied(false);
                    }}
                    rows={20}
                    spellCheck={false}
                    style={{
                      width: "100%",
                      minHeight: 430,
                      resize: "vertical",
                      padding: 18,
                      borderRadius: 14,
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#0f172a",
                      fontSize: 14,
                      lineHeight: 1.65,
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={copyWhatsAppMessage}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        background: messageCopied ? "#dcfce7" : "#ffffff",
                        color: messageCopied ? "#166534" : "#334155",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 13,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <Copy size={16} />
                      {messageCopied ? "Copied ✓" : "Copy Message"}
                    </button>

                    <button
                      type="button"
                      onClick={openVendorWhatsApp}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#16a34a",
                        color: "#ffffff",
                        cursor: "pointer",
                        fontWeight: 800,
                        fontSize: 13,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <MessageCircle size={16} /> Open Vendor WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUS ACTIONS MODAL */}
      {/* ========================================================================= */}
      {workflowModal.open && workflowModal.order && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10050, background: "rgba(15,23,42,.58)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 560, background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 25px 70px rgba(0,0,0,.28)" }}>
            <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>{workflowModal.kind === "complaint-approve" ? "Approve Complaint" : workflowModal.kind === "complaint-reject" ? "Reject Complaint" : "Update Refund"}</h3>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Order ID: <strong>{workflowModal.order.id}</strong></div>
            {workflowModal.kind === "complaint-approve" && <>
              <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 800 }}>Final Status<select value={workflowStatus} onChange={(e)=>setWorkflowStatus(e.target.value)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}><option value="">Select status</option><option>Cancelled</option><option>Not Delivered</option><option>Delivered</option><option>Bad Delivery</option><option>Partial Delivery</option></select></label>
              <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 800 }}>Final Sub Status<input value={workflowSubStatus} onChange={(e)=>setWorkflowSubStatus(e.target.value)} placeholder="Sub status" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}/></label>
              <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 800 }}>Vendor Penalty (Rs)<input type="number" min="0" value={workflowPenalty} onChange={(e)=>setWorkflowPenalty(e.target.value)} placeholder="0" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}/></label>
            </>}
            {workflowModal.kind === "refund" && <>
              <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 800 }}>Refund Status<select value={workflowStatus} onChange={(e)=>setWorkflowStatus(e.target.value)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}><option value="">Select status</option><option>Pending</option><option>Approved</option><option>Processing</option><option>Success</option><option>Failed</option></select></label>
              <label style={{ display: "grid", gap: 6, marginBottom: 12, fontSize: 12, fontWeight: 800 }}>Refund Amount<input type="number" min="0" step="0.01" value={workflowAmount} onChange={(e)=>setWorkflowAmount(e.target.value)} style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8 }}/></label>
            </>}
            <label style={{ display: "grid", gap: 6, marginBottom: 16, fontSize: 12, fontWeight: 800 }}>Admin Remarks<textarea rows={4} value={workflowRemarks} onChange={(e)=>setWorkflowRemarks(e.target.value)} placeholder="Remarks" style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 8, resize: "vertical" }}/></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button disabled={workflowSaving} onClick={()=>setWorkflowModal({open:false,kind:null,order:null})} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: 700 }}>Close</button>
              <button disabled={workflowSaving} onClick={submitWorkflow} style={{ padding: "9px 14px", borderRadius: 8, border: "none", background: workflowModal.kind === "complaint-reject" ? "#dc2626" : "#0f172a", color: "#fff", cursor: "pointer", fontWeight: 800 }}>{workflowSaving ? "Saving..." : "Submit"}</button>
            </div>
          </div>
        </div>
      )}

      {statusModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "#fff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: "18px",
                fontWeight: 800,
                color: "#1e293b",
              }}
            >
              {actionType === "cancel" ? "Cancel Order" : "Mark Order Status"}
            </h2>

            <select
              value={subStatus}
              onChange={(e) => {
                setSubStatus(e.target.value);
                const option = OUT_FOR_DELIVERY_OUTCOME_OPTIONS.find(
                  (item) => item.key === e.target.value,
                );
                setVendorPenaltyAmount(
                  option?.manualPenalty
                    ? ""
                    : String(option?.vendorPenalty ?? ""),
                );
              }}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                marginBottom: 16,
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              <option value="">
                {actionType === "cancel"
                  ? "-- Select Cancel Reason --"
                  : "-- Select Outcome Status --"}
              </option>

              {actionType === "cancel"
                ? CANCEL_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))
                : selectedOrder?.status === "inkitchen" ||
                    selectedOrder?.status === "outfordelivery"
                  ? OUT_FOR_DELIVERY_OUTCOME_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.manualPenalty
                          ? `${option.label} - Manual Penalty`
                          : `${option.label} - Rs ${option.vendorPenalty}`}
                      </option>
                    ))
                  : DELIVERED_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
            </select>

            {actionType === "mark" &&
              (selectedOrder?.status === "inkitchen" ||
                selectedOrder?.status === "outfordelivery") &&
              subStatus && (
                <div
                  style={{
                    marginTop: -6,
                    marginBottom: 16,
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                  }}
                >
                  {OUT_FOR_DELIVERY_OUTCOME_OPTIONS.find(
                    (option) => option.key === subStatus,
                  )?.manualPenalty ? (
                    <label
                      style={{
                        display: "grid",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#334155",
                      }}
                    >
                      Vendor Penalty Amount (Rs)
                      <input
                        type="number"
                        min="0"
                        value={vendorPenaltyAmount}
                        onChange={(e) => setVendorPenaltyAmount(e.target.value)}
                        placeholder="Enter manual amount"
                        style={{
                          width: "100%",
                          padding: 10,
                          borderRadius: 8,
                          border: "1px solid #cbd5e1",
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      />
                    </label>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: "#0f172a",
                      }}
                    >
                      Vendor Penalty: Rs{" "}
                      {OUT_FOR_DELIVERY_OUTCOME_OPTIONS.find(
                        (option) => option.key === subStatus,
                      )?.vendorPenalty ?? 0}
                    </div>
                  )}
                </div>
              )}

            <textarea
              placeholder="Internal administrative remarks annotation ledger (Optional)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                marginBottom: 16,
                resize: "vertical",
                fontSize: "13px",
              }}
            />

            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}
            >
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedOrder(null);
                  setSubStatus("");
                  setRemarks("");
                  setVendorPenaltyAmount("");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Close
              </button>

              <button
                onClick={submitStatusAction}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1e293b",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                Submit Action
              </button>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .table-row-hover:hover { background-color: #f8fafc !important; transition: background-color 0.15s ease; }
        .order-top-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr); gap: 18px; align-items: stretch; }
        .order-info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; }
        .payment-card { background: #f8fafc; }
        .order-card-title, .section-heading { margin: 0 0 14px; font-size: 12px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: .55px; display: flex; align-items: center; gap: 7px; }
        .payment-title { color: #2563eb; }
        .restaurant-title { color: #16a34a; }
        .section-heading { margin-bottom: 0; color: #64748b; }
        .order-field-grid, .restaurant-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px 18px; }
        .restaurant-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .order-field, .order-field-highlight { min-width: 0; }
        .order-field-highlight { background: #eff6ff; border: 1px solid #bfdbfe; padding: 9px 11px; border-radius: 8px; }
        .order-field-full { grid-column: 1 / -1; }
        .order-field-label { display: block; margin-bottom: 4px; color: #64748b; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: .35px; }
        .order-field-value { display: block; color: #0f172a; font-size: 13px; font-weight: 700; line-height: 1.45; word-break: break-word; }
        .payment-summary-row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
        .payment-mode-pill { display: inline-flex; padding: 5px 10px; border-radius: 999px; background: #dbeafe; color: #1d4ed8; font-size: 12px; font-weight: 900; }
        .payment-lines { display: flex; flex-direction: column; }
        .payment-line { display: flex; justify-content: space-between; gap: 18px; padding: 8px 2px; border-bottom: 1px dashed #dbe3ee; color: #64748b; font-size: 12px; }
        .payment-line strong { text-align: right; word-break: break-word; }
        .payable-box { margin-top: 14px; padding: 13px 14px; border-radius: 10px; background: #2563eb; color: #fff; display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 800; }
        .payable-box strong { font-size: 20px; }
        .items-table-wrap { border: 1px solid #e2e8f0; border-radius: 14px; overflow-x: auto; }
        .items-table { width: 100%; min-width: 760px; border-collapse: collapse; font-size: 13px; }
        .items-table thead { background: #f8fafc; color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: .35px; text-align: left; }
        .items-table th, .items-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        .items-table tbody tr:last-child td { border-bottom: none; }
        .item-description { margin-top: 4px; max-width: 560px; color: #64748b; font-size: 11px; font-weight: 500; line-height: 1.45; white-space: normal; }
        .type-chip { display: inline-flex; padding: 4px 8px; border-radius: 999px; background: #f1f5f9; color: #475569; font-size: 10px; font-weight: 800; }
        .empty-cell { padding: 22px !important; text-align: center; color: #94a3b8; font-style: italic; }
        .restaurant-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px; }
        .loading-text { margin: 0; font-size: 12px; color: #64748b; font-style: italic; }
        .log-meta-grid { margin-top: 2px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .log-meta-grid strong { color: #0f172a; }
        @media (max-width: 980px) {
          .order-top-grid { grid-template-columns: 1fr; }
          .restaurant-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .order-details-modal { width: 100% !important; height: 95vh !important; border-radius: 14px !important; }
          .order-field-grid, .restaurant-grid { grid-template-columns: 1fr; }
          .payment-summary-row { flex-direction: column; }
          .log-meta-grid { grid-template-columns: 1fr; }
        }
      `,
        }}
      />
    </section>
  );
}
