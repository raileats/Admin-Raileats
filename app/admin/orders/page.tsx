"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Bell, Clock, MapPin, ShieldCheck, ShoppingBag, Smartphone, X } from "lucide-react";
import Link from "next/link";

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

type OrderHistoryItem = { at: string; by: string; note?: string; status: TabKey };
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
  total?: string;
  history: OrderHistoryItem[];
  rawCreatedAt?: string; // Correct fallback sorting key for booking chronology
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "booked", label: "Booked" },
  { key: "verification", label: "In Verification" },
  { key: "neworder", label: "New Order" },
  { key: "inkitchen", label: "In Kitchen" },
  { key: "outfordelivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "notdelivered", label: "Not Delivered" },
  { key: "baddelivery", label: "Bad Delivery" },
];

const CANCEL_REASONS = [
  "Customer Plan Change",
  "Customer Call Not Connect",
  "Restro Closed",
  "Train Late",
  "Train Divert",
  "Item Issue",
  "Restro Refused without Reason",
  "Other",
];

const NOT_DELIVERED_REASONS = [
  "Restro Missed",
  "Late Processing",
  "Technical Issue",
];

const DELIVERED_REASONS = [
  "Delivered",
  "Bad Delivery",
];

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
  delivered: { next: null, actionLabel: "", dbValue: "Delivered" },
  cancelled: { next: null, actionLabel: "", dbValue: "Cancelled" },
  notdelivered: { next: null, actionLabel: "", dbValue: "Not Delivered" },
  baddelivery: { next: null, actionLabel: "", dbValue: "Bad Delivery" },
};

const FINAL_MARK_OPTIONS = [
  { key: "delivered", label: "Delivered", dbValue: "Delivered" },
  { key: "cancelled", label: "Cancelled", dbValue: "Cancelled" },
  { key: "notdelivered", label: "Not Delivered", dbValue: "Not Delivered" },
  { key: "baddelivery", label: "Bad Delivery", dbValue: "Bad Delivery" },
] as const;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const rowMatchesTrain = (row: TrainRouteRow, trainNo: string) => {
  const candidates = [
    getRouteField(row, "trainNumber", "TrainNumber", "trainnumber"),
    getRouteField(row, "trainNumber_text", "TrainNumber_text", "trainnumber_text"),
    getRouteField(row, "TrainNo", "trainNo", "train_no"),
  ];

  return candidates.some((value) => normalizeRouteValue(value) === trainNo);
};

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("raileats_admin_tab") as TabKey) || "booked";
    }
    return "booked";
  });

  const [allOrders, setAllOrders] = useState<Record<TabKey, Order[]>>({} as Record<TabKey, Order[]>);

const [loading, setLoading] = useState(false);

const [refreshTick, setRefreshTick] = useState(0);

const [statusModalOpen, setStatusModalOpen] = useState(false);

const [selectedOrder, setSelectedOrder] = useState<any>(null);

const [actionType, setActionType] = useState("");

const [subStatus, setSubStatus] = useState("");

const [remarks, setRemarks] = useState("");

  const [marking, setMarking] = useState<Record<string, { status: string; remarks: string }>>({});
  const [searchType, setSearchType] = useState<SearchType>("orderId");
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState<string>(""); 
  const [searchOutlet, setSearchOutlet] = useState("");
  
  const [newOrderCount, setNewOrderCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("raileats_new_orders") || 0);
    }
    return 0;
  });

  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [detailedOrder, setDetailedOrder] = useState<any>(null);
  const [activeDrawerSection, setActiveDrawerSection] = useState<"details" | "logs">("details");

  const [fetchedItems, setFetchedItems] = useState<any[]>([]);
  const [fetchedRestro, setFetchedRestro] = useState<any>(null);
  const [orderLogs, setOrderLogs] = useState<any[]>([]);
  
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

  /* ================= INIT SOUND ================= */
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.preload = "auto";

    const unlockAudio = async () => {
      try {
        if (audioRef.current) {
          audioRef.current.muted = true;
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.muted = false;
          console.log("Audio unlocked");
        }
      } catch (e) {
        console.log("Unlock failed");
      }
    };

    document.body.addEventListener("click", unlockAudio, { once: true });
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  /* ================= REALTIME ORDERS ================= */
  useEffect(() => {
    const channel = supabase
      .channel("admin-orders-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "Orders" },
        async (payload) => {
          console.log("NEW ORDER:", payload);
          setNewOrderCount((prev) => {
            const updated = prev + 1;
            localStorage.setItem("raileats_new_orders", String(updated));
            return updated;
          });

          try {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              await audioRef.current.play();
            }
          } catch (e) {
            console.log("sound blocked");
          }

          try {
            if (Notification.permission === "granted") {
              new Notification("🚆 New RailEats Order", {
                body: `${payload.new.customerName || "Customer"} • ${payload.new.stationName || ""}`,
              });
            }
          } catch (e) {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ================= SMART AUTO REFRESH ================= */

useEffect(() => {

  const interval = setInterval(() => {

    setRefreshTick(
      (prev) => prev + 1
    );

  }, 30000);

  return () => {

    clearInterval(interval);

  };

}, []);

  /* ================= LOAD ORDERS ================= */
  useEffect(() => {
    const load = async () => {
      const shouldShowLoader = !hasLoadedTabRef.current[activeTab];

      try {
        if (shouldShowLoader) setLoading(true);
        const params = new URLSearchParams();
        params.set("status", activeTab);
        
        const res = await fetch(`/api/orders?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({} as any));

        if (!res.ok || !json?.ok) {
          console.error("orders fetch failed", json);
          setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
          return;
        }

        const mapped: Order[] = (json.orders || []).map((row: any) => {
          const rawStatus = String(row.status ?? row.Status ?? "Booked");
          let tabStatus: TabKey = "booked";
          const lowerRaw = rawStatus.toLowerCase().trim();
          
          if (lowerRaw === "booked") tabStatus = "booked";
          else if (lowerRaw === "verification" || lowerRaw === "in verification") tabStatus = "verification";
          else if (lowerRaw === "neworder" || lowerRaw === "new order") tabStatus = "neworder";
          else if (lowerRaw === "inkitchen" || lowerRaw === "in kitchen") tabStatus = "inkitchen";
          else if (lowerRaw === "outfordelivery" || lowerRaw === "out for delivery") tabStatus = "outfordelivery";
          else if (lowerRaw === "delivered") {
            const sub = String(row.subStatus ?? row.SubStatus ?? "").toLowerCase().trim();
            tabStatus = sub === "bad delivery" ? "baddelivery" : "delivered";
          }
          else if (lowerRaw === "cancelled") tabStatus = "cancelled";
          else if (lowerRaw === "notdelivered" || lowerRaw === "not delivered") tabStatus = "notdelivered";
          else if (lowerRaw === "baddelivery" || lowerRaw === "bad delivery") tabStatus = "baddelivery";

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
            total: row.totalAmount != null ? String(row.totalAmount) : (row.TotalAmount != null ? String(row.TotalAmount) : undefined),
            history: Array.isArray(row.history) ? row.history : [],
            rawCreatedAt: row.CreatedAt ?? row.createdAt ?? "",
          };
        });

        setAllOrders((prev) => ({ ...prev, [activeTab]: mapped }));
      } catch (e) {
        console.error("orders fetch error", e);
        setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
      } finally {
        hasLoadedTabRef.current[activeTab] = true;
        if (shouldShowLoader) setLoading(false);
      }
    };

    load();
  }, [activeTab, refreshTick]);

  const orders = useMemo(() => allOrders[activeTab] ?? [], [allOrders, activeTab]);

  useEffect(() => {
    if (detailedOrder) {
      const liveFlatArray = Object.values(allOrders).flat();
      const matchUpdate = liveFlatArray.find(o => o.id === detailedOrder.id);
      if (matchUpdate) {
        setDetailedOrder(matchUpdate);
      }
    }
  }, [allOrders]);

  /* ================= TRAIN ROUTE MODAL ================= */
  const openRouteModal = async (trainNo?: string, stationCode?: string) => {
    const normalizedTrainNo = normalizeRouteValue(trainNo);
    const normalizedStationCode = normalizeRouteValue(stationCode).toUpperCase();

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
    if (Number.isFinite(numericTrainNo)) filters.push(`trainNumber.eq.${numericTrainNo}`);

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
    const message = routeRows.length === 0
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
  const handleOpenDiagnosticsDrawer = async (order: Order, preferredSection: "details" | "logs" = "details") => {
    setDetailedOrder(order);
    setActiveDrawerSection(preferredSection);
    setViewDrawerOpen(true);
    
    const targetOrderId = order.id;
    const targetRestroCode = order.outletId;

    if (targetOrderId) {
      setLoadingItems(true);
      setFetchedItems([]);
      try {
        const { data, error } = await supabase
          .from("OrderItems")
          .select("*")
          .eq("OrderId", targetOrderId);
        if (!error && data) setFetchedItems(data);
      } catch (e) { console.error("Error connecting OrderItems database links:", e); }
      finally { setLoadingItems(false); }
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
      } catch (e) { console.error("Error connecting RestroMaster database links:", e); }
      finally { setLoadingRestro(false); }
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
      } catch (e) { console.error("Error connecting OrderStatusHistory database links:", e); }
      finally { setLoadingLogs(false); }
    }
  };

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
        const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStatus: targetDbValue,
            remarks: mapping.actionLabel,
            changedBy: "admin",
            actionSource: "Admin",
          }),
        });
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
              by: "admin",
              note: mapping.actionLabel,
              status: nextStatus,
            },
          ],
        };

        setAllOrders((prev) => {
          const copy = { ...prev };
          copy[activeTab] = (copy[activeTab] ?? []).filter((o) => o.id !== orderId);
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
          } catch (err) { console.error(err); }
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
      let computedMainStatus = "";
      if (actionType === "cancel") {
        computedMainStatus = "Cancelled";
      } else {
        if (subStatus === "Delivered" || subStatus === "Bad Delivery") {
          computedMainStatus = "Delivered";
        } else if (subStatus === "Not Delivered") {
          computedMainStatus = "Not Delivered";
        } else if (subStatus === "Cancelled") {
          computedMainStatus = "Cancelled";
        }
      }

      const res = await fetch(`/api/orders/${encodeURIComponent(selectedOrder.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: computedMainStatus,
          subStatus,
          remarks,
          changedBy: "admin",
          actionSource: "Admin",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        alert("Failed to update order");
        return;
      }

      const targetKey: TabKey = subStatus === "Bad Delivery"
        ? "baddelivery"
        : (computedMainStatus.toLowerCase().replace(/\s/g, "")) as TabKey;

      const updatedOrder = {
        ...selectedOrder,
        status: targetKey,
        dbStatus: computedMainStatus,
        history: [
          ...selectedOrder.history,
          {
            at: new Date().toISOString(),
            by: "admin",
            note: `${subStatus}${remarks ? ` • ${remarks}` : ""}`,
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

      if (viewDrawerOpen && detailedOrder && detailedOrder.id === selectedOrder.id) {
        try {
          const { data: logReload } = await supabase
            .from("OrderStatusHistory")
            .select("*")
            .eq("OrderId", selectedOrder.id)
            .order("ChangedAt", { ascending: true });
          if (logReload) setOrderLogs(logReload);
        } catch (err) { console.error(err); }
      }

      setStatusModalOpen(false);
      setSelectedOrder(null);
      setSubStatus("");
      setRemarks("");
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
    const matchedOption = FINAL_MARK_OPTIONS.find(o => o.key === targetKey);
    const targetDbValue = matchedOption ? matchedOption.dbValue : targetKey;
    const currentRemarks = selection.remarks || `Marked ${targetKey}`;

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: targetDbValue,
          remarks: currentRemarks,
          changedBy: "admin",
          actionSource: "Admin",
        }),
      });
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
            by: "admin",
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
        } catch (err) { console.error(err); }
      }

      setActiveTab(targetKey);
    } catch (e) {
      alert("Failed to change status (network error)");
    }
  }

  const applyFiltersAndSorting = (list: Order[]) => {
    let filtered = list.slice();

    // 1. Appling Search Filters
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      if (searchType === "customerMobile") {
        filtered = filtered.filter((o) => o.customerMobile.toLowerCase().includes(q));
      } else if (searchType === "orderId") {
        filtered = filtered.filter((o) => o.id.toLowerCase().includes(q));
      } else if (searchType === "outletId") {
        filtered = filtered.filter((o) => o.outletId.toLowerCase().includes(q) || o.outletName.toLowerCase().includes(q));
      } else if (searchType === "stationCode") {
        filtered = filtered.filter((o) => o.stationCode.toLowerCase().includes(q) || o.stationName.toLowerCase().includes(q));
      } else if (searchType === "trainNo") {
        filtered = filtered.filter((o) => (o.trainNo || "").toLowerCase().includes(q));
      }
    }

    if (searchDate) {
      filtered = filtered.filter((o) => o.deliveryDate === searchDate);
    }

    if (searchOutlet) {
      const q = searchOutlet.trim().toLowerCase();
      if (q) {
        filtered = filtered.filter((o) => o.outletId.toLowerCase().includes(q) || o.outletName.toLowerCase().includes(q));
      }
    }

    // 2. Chronological Delivery Date + Time Ascending Sorting Engine (Tie-breaker: Latest Booked on Top)
    filtered.sort((a, b) => {
      const dateTimeA = new Date(`${a.deliveryDate}T${a.deliveryTime || "00:00:00"}`).getTime();
      const dateTimeB = new Date(`${b.deliveryDate}T${b.deliveryTime || "00:00:00"}`).getTime();

      if (dateTimeA !== dateTimeB) {
        return dateTimeA - dateTimeB; // Earliest upcoming delivery window first
      }

      // Tie-breaker: If delivery timeline matches perfectly, sort by newest booked order creation
      const bookedTimeA = a.rawCreatedAt ? new Date(a.rawCreatedAt).getTime() : 0;
      const bookedTimeB = b.rawCreatedAt ? new Date(b.rawCreatedAt).getTime() : 0;
      return bookedTimeB - bookedTimeA; 
    });

    return filtered;
  };

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      booked: 0,
      verification: 0,
      neworder: 0,
      inkitchen: 0,
      outfordelivery: 0,
      delivered: 0,
      cancelled: 0,
      notdelivered: 0,
      baddelivery: 0,
    };

    Object.values(allOrders)
      .flat()
      .forEach((o) => {
        if (counts[o.status] !== undefined) {
          counts[o.status]++;
        }
      });

    return counts;
  }, [allOrders]);

  const visibleOrders = useMemo(() => applyFiltersAndSorting(orders), [orders, searchText, searchDate, searchType, searchOutlet]);

  return (
    <section style={{ padding: 12, minHeight: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
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
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>Orders Dashboard</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13, fontWeight: 500 }}>Real-time dynamic monitoring console ordered by delivery schedule urgency</p>
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
            Active Stage: <strong style={{ color: "#2563eb" }}>{TABS.find((t) => t.key === activeTab)?.label}</strong>
            {loading ? " • Syncing..." : ""}
          </div>
        </div>
      </header>

      {/* TABS VIEW */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                localStorage.setItem("raileats_admin_tab", tab.key);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: active ? "2px solid #2563eb" : "1px solid #e2e8f0",
                background: active ? "#fff" : "#f8fafc",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: active ? "#0f172a" : "#475569" }}>{tab.label}</span>
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
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap", background: "#fff", padding: 12, borderRadius: 10, border: "1px solid #e2e8f0" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#475569" }}>
          <span>Search Field</span>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value as SearchType)} style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }}>
            <option value="orderId">Order ID</option>
            <option value="customerMobile">Customer Mobile</option>
            <option value="outletId">Outlet ID / Name</option>
            <option value="stationCode">Station Code / Name</option>
            <option value="deliveryDate">Delivery Date</option>
            <option value="trainNo">Train No.</option>
          </select>
        </label>

        {searchType === "deliveryDate" ? (
          <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ padding: 6, borderRadius: 6, border: "1px solid #cbd5e1" }} />
        ) : (
          <input
            placeholder={
              searchType === "customerMobile" ? "Enter customer mobile" :
              searchType === "orderId" ? "Enter order id" :
              searchType === "outletId" ? "Enter outlet id or name" :
              searchType === "stationCode" ? "Enter station code or name" : "Enter train no"
            }
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", minWidth: 220, fontSize: 13 }}
          />
        )}

        <input
          placeholder="Outlet Name filter fallback"
          value={searchOutlet}
          onChange={(e) => setSearchOutlet(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #cbd5e1", minWidth: 180, fontSize: 13 }}
        />

        <button
          onClick={() => {
            setSearchText("");
            setSearchDate("");
            setSearchOutlet("");
          }}
          style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #cbd5e1", background: "#f1f5f9", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
        >
          Reset Filters
        </button>
      </div>

      {/* TABLE VIEW */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1300 }}>
            <thead style={{ textAlign: "left", borderBottom: "2px solid #edf2f7", background: "#f8fafc", fontSize: 13, color: "#475569" }}>
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
                <th style={{ padding: 12 }}>Order Process Log</th>
                <th style={{ padding: 12, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody style={{ fontSize: 13, color: "#334155" }}>
              {visibleOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="table-row-hover">
                  
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
                        textAlign: "left"
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
    <span style={{ background: "#f1f5f9", padding: "3px 6px", borderRadius: 4, fontWeight: 600 }}>-</span>
  )}
</td>
                  <td style={{ padding: 12, fontWeight: 600 }}>{o.outletName}</td>
                  <td style={{ padding: 12 }}><span style={{ background: "#eff6ff", color: "#2563eb", padding: "3px 6px", borderRadius: 4, fontWeight: 600 }}>{o.stationCode}</span></td>
                  <td style={{ padding: 12 }}>{o.stationName}</td>
                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>{o.deliveryDate}</td>
                  <td style={{ padding: 12, fontWeight: 600, color: "#0284c7" }}>{o.deliveryTime}</td>
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
                  <td style={{ padding: 12, fontWeight: 600 }}>{o.customerName}</td>
                  <td style={{ padding: 12, fontFamily: "monospace" }}>{o.customerMobile}</td>

                  {/* Order process log opens the centered log view */}
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleOpenDiagnosticsDrawer(o, "logs")}
                      style={{
                        background: "#f0fdf4",
                        color: "#16a34a",
                        border: "1px solid #bbf7d0",
                        padding: "5px 10px",
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      View Log ({o.history?.length || 0})
                    </button>
                  </td>

                  <td style={{ padding: 12, verticalAlign: "middle" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
                      
                      {/* INLINE BUTTON CONTROLLERS */}
                      {[
                        "booked",
                        "verification",
                        "neworder",
                        "inkitchen",
                        "outfordelivery",
                      ].includes(o.status) ? (
                        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                          <button
                            onClick={() => {
                              if (!confirm(`Move ${o.id} to next status?`)) return;
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
                              whiteSpace: "nowrap"
                            }}
                          >
                            {NEXT_MAP[o.status]?.actionLabel}
                          </button>

                          {(o.status === "booked" || o.status === "verification" || o.status === "neworder") && (
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                actionType === "cancel";
                                setActionType("cancel");
                                setSubStatus("");
                                setRemarks("");
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
                                fontSize: 11
                              }}
                            >
                              Cancel
                            </button>
                          )}

                          {(o.status === "inkitchen" || o.status === "outfordelivery") && (
                            <button
                              onClick={() => {
                                setSelectedOrder(o);
                                setActionType("mark");
                                setSubStatus("");
                                setRemarks("");
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
                                whiteSpace: "nowrap"
                              }}
                            >
                              Mark Status
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
                            style={{ padding: 5, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11 }}
                          >
                            <option value="">Select status</option>
                            {FINAL_MARK_OPTIONS.map((opt) => (
                              <option key={opt.key} value={opt.key}>{opt.label}</option>
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
                            style={{ padding: 5, borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, width: 100 }}
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
                              fontWeight: "bold"
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
                                fontSize: 11
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
                  <td colSpan={14} style={{ padding: 30, textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>No active track records inside this tab scope constraints.</td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={14} style={{ padding: 30, textAlign: "center", color: "#64748b", fontWeight: 600 }}>Syncing structural updates with live engine stream...</td>
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
            <div style={{ padding: 16, borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={18} /> Route Map: {routeModal.trainNo}
                  {routeModal.data[0]?.trainName ? (
                    <span style={{ color: "#2563eb" }}>- {routeModal.data[0].trainName}</span>
                  ) : null}
                </h3>
                {routeModal.data[0] && (
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                    {routeModal.data[0].stationFrom || "-"} to {routeModal.data[0].stationTo || "-"} · {routeModal.data.length} stations · {routeModal.data[0].runningDays || "Running days N/A"}
                  </div>
                )}
              </div>
              <button
                onClick={() => setRouteModal((prev) => ({ ...prev, open: false, message: "" }))}
                title="Close route map"
                style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ overflow: "auto", padding: 16 }}>
              <table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ position: "sticky", top: 0, background: "#f8fafc", zIndex: 1, borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "9px 8px", width: 56 }}>No.</th>
                    <th style={{ padding: "9px 8px" }}>Station</th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>Arrives</th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>Departs</th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>Stop</th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>Distance</th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>Platform</th>
                    <th style={{ padding: "9px 8px", textAlign: "right" }}>Day</th>
                  </tr>
                </thead>
                <tbody>
                  {routeModal.data.length > 0 ? (
                    routeModal.data.map((r, idx) => {
                      const stationCode = normalizeRouteValue(getRouteField(r, "StationCode", "stationCode", "stationcode")).toUpperCase();
                      const stationName = normalizeRouteValue(getRouteField(r, "StationName", "stationName", "stationname"));
                      const stnNumber = getRouteField(r, "StnNumber", "stnNumber", "stnnumber");
                      const arrives = normalizeRouteValue(getRouteField(r, "Arrives", "arrives"));
                      const departs = normalizeRouteValue(getRouteField(r, "Departs", "departs"));
                      const stopTime = normalizeRouteValue(getRouteField(r, "Stoptime", "stoptime", "StopTime"));
                      const distance = normalizeRouteValue(getRouteField(r, "Distance", "distance"));
                      const platform = normalizeRouteValue(getRouteField(r, "Platform", "platform"));
                      const day = normalizeRouteValue(getRouteField(r, "Day", "day"));
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
                          <td style={{ padding: "10px 8px", width: 52, color: "#94a3b8", fontWeight: 800 }}>{stnNumber || idx + 1}</td>
                          <td style={{ padding: "10px 8px", color: "#0f172a" }}>
                            {stationName || "Unknown Station"} <span style={{ color: "#2563eb" }}>({stationCode || "-"})</span>
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                            {arrives || "-"}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                            {departs || "-"}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                            {stopTime || "-"}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                            {distance || "-"}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                            {platform || "-"}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569", fontFamily: "monospace" }}>
                            {day || "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontWeight: 600 }}>
                        {routeModal.message || "No route rows found for this train number in TrainRoute table."}
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
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            animation: "fadeIn 0.2s ease"
          }}
          onClick={() => { setViewDrawerOpen(false); setDetailedOrder(null); }}
        >
          <div 
            style={{
              width: "100%",
              maxWidth: "920px",
              height: "88vh",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 24px 60px rgba(15,23,42,0.28)",
              display: "flex",
              flexDirection: "column",
              animation: "scaleIn 0.18s ease-out",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* DRAWER HEADER CONSOLE ROW */}
            <div style={{ background: "#f8fafc", padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#0f172a", letterSpacing: "0" }}>Order Details</h2>
                  <span style={{ background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: "11px", padding: "2px 8px", borderRadius: "5px" }}>#{detailedOrder.id}</span>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                  Current Status: <span style={{ color: "#2563eb", fontWeight: 800 }}>{detailedOrder.dbStatus || detailedOrder.status}</span>
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button 
                  onClick={() => { setViewDrawerOpen(false); setDetailedOrder(null); }}
                  style={{ width: "32px", height: "32px", background: "#fff", border: "1px solid #cbd5e1", borderRadius: "50%", cursor: "pointer", fontWeight: "bold", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* MODIFIED: TAB TOGGLES INSIDE THE DRAWER TO SWITCH PREFERENCES EASILY */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fff", padding: "0 24px" }}>
              <button
                onClick={() => setActiveDrawerSection("details")}
                style={{
                  padding: "14px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: activeDrawerSection === "details" ? "3px solid #2563eb" : "3px solid transparent",
                  color: activeDrawerSection === "details" ? "#2563eb" : "#64748b",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s"
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
                  borderBottom: activeDrawerSection === "logs" ? "3px solid #2563eb" : "3px solid transparent",
                  color: activeDrawerSection === "logs" ? "#2563eb" : "#64748b",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                Order Process Log
              </button>
            </div>

            {/* CORE INNER DRAWER PANEL */}
            <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {activeDrawerSection === "details" ? (
                <>
                  {/* TRANSIT METRICS PANEL */}
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Smartphone size={14} /> Customer &amp; Delivery Details
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                      <div><span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Customer Name</span>{detailedOrder.customerName || "Guest"}</div>
                      <div><span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Customer Mobile</span>{detailedOrder.customerMobile || "N/A"}</div>
                      <div><span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Train Number</span>Train {detailedOrder.trainNo || "N/A"}</div>
                      <div><span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Coach / Seat</span>Coach {detailedOrder.coach || "-"} / Seat {detailedOrder.seat || "-"}</div>
                      <div style={{ background: "#eff6ff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                        <span style={{ color: "#2563eb", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Delivery Date</span>
                        {detailedOrder.deliveryDate}
                      </div>
                      <div style={{ background: "#eff6ff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                        <span style={{ color: "#2563eb", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Delivery Time</span>
                        {detailedOrder.deliveryTime}
                      </div>
                      <div style={{ gridColumn: "span 2" }}><span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>Station</span>{detailedOrder.stationName} ({detailedOrder.stationCode})</div>
                    </div>
                  </div>

                  {/* FOOD ITEMS SUM BLOCK */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <h3 style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShoppingBag size={14} /> Order Items
                    </h3>
                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", textAlign: "left" }}>
                          <tr>
                            <th style={{ padding: "10px 16px" }}>Item Name</th>
                            <th style={{ padding: "10px 16px", textAlign: "center" }}>Qty</th>
                            <th style={{ padding: "10px 16px", textAlign: "right" }}>Line Total</th>
                          </tr>
                        </thead>
                        <tbody style={{ color: "#334155", fontWeight: 600 }}>
                          {loadingItems ? (
                            <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>Loading order items...</td></tr>
                          ) : fetchedItems.length > 0 ? (
                            fetchedItems.map((item: any, idx: number) => (
                              <tr key={item.ItemId || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0f172a" }}>{item.ItemName}</td>
                                <td style={{ padding: "12px 16px", textAlign: "center", color: "#2563eb", fontWeight: 800 }}>× {item.Quantity}</td>
                                <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace" }}>₹{item.LineTotal || (Number(item.SellingPrice || 0) * Number(item.Quantity || 1))}</td>
                              </tr>
                            ))
                          ) : (
                            <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>No order items found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "13px", fontWeight: 600, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b" }}><span>Order Total</span><span style={{ color: "#334155" }}>₹{detailedOrder.total || "0"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#0f172a", fontWeight: 800, fontSize: "14px", paddingTop: "6px", borderTop: "1px dashed #cbd5e1" }}>
                        <span>Payable Amount</span>
                        <span style={{ color: "#2563eb" }}>₹{detailedOrder.total || "0"}</span>
                      </div>
                    </div>
                  </div>

                  {/* RESTRO COMPLIANCE CARD */}
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px" }}>
                    <h3 style={{ margin: "0 0 12px 0", fontSize: "11px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ShieldCheck size={14} style={{ color: "#16a34a" }} /> Restaurant Details
                    </h3>
                    {loadingRestro ? (
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>Loading restaurant details...</p>
                    ) : fetchedRestro ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                        <div><span style={{ color: "#16a34a", display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Restro Code</span><span style={{ color: "#111827", fontWeight: 800 }}>{fetchedRestro.RestroCode || "N/A"}</span></div>
                        <div><span style={{ color: "#16a34a", display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Restro Name</span><span style={{ color: "#0f172a", fontWeight: 700 }}>{fetchedRestro.RestroName || "N/A"}</span></div>
                        <div><span style={{ color: "#64748b", display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>Open Time</span>{fetchedRestro.open_time || "N/A"} - {fetchedRestro.closed_time || "N/A"}</div>
                        <div><span style={{ color: "#64748b", display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>FSSAI Number</span><span style={{ fontFamily: "monospace" }}>{fetchedRestro.FSSAINumber || "N/A"}</span></div>
                        <div><span style={{ color: "#64748b", display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>FSSAI Expiry</span><span style={{ color: "#b45309" }}>{fetchedRestro.FSSAIExpiryDate || "N/A"}</span></div>
                        <div><span style={{ color: "#64748b", display: "block", fontSize: "10px", fontWeight: 700, textTransform: "uppercase" }}>GST Number</span><span style={{ fontFamily: "monospace" }}>{fetchedRestro.GSTNumber || "N/A"}</span></div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>No restaurant details found.</p>
                    )}
                  </div>
                </>
              ) : (
                /* TIMELINE LOGGER NODES SECTION */
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h3 style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={14} /> Order Process Timeline ({orderLogs.length})
                  </h3>
                  
                  {loadingLogs ? (
                    <p style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>Loading order process log...</p>
                  ) : orderLogs.length === 0 ? (
                    <div style={{ background: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600 }}>
                      No order process log found for this order.
                    </div>
                  ) : (
                    <div style={{ position: "relative", borderLeft: "2px dashed #e2e8f0", paddingLeft: "18px", marginLeft: "6px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      {orderLogs.map((log: any, idx: number) => (
                        <div key={log.Id || idx} style={{ position: "relative" }}>
                          <span style={{ position: "absolute", left: "-24px", top: "4px", background: "#2563eb", width: "10px", height: "10px", borderRadius: "50%", border: "2px solid #fff", boxShadow: "0 0 0 2px #bfdbfe" }} />
                          
                          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "4px", fontSize: "12px" }}>
                              <span style={{ fontWeight: 800, color: "#0f172a" }}>Status: <span style={{ color: "#2563eb" }}>{log.NewStatus}</span></span>
                              <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700 }}>{log.ChangedAt ? new Date(log.ChangedAt).toLocaleString() : "N/A"}</span>
                            </div>
                            
                            {log.OldStatus && <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>Previous Status: <span style={{ textDecoration: "line-through" }}>{log.OldStatus}</span></div>}
                            {(log.SubStatus || log.Remarks || log.Note) && (
                              <div style={{ background: "#fff", border: "1px solid #f1f5f9", padding: "8px", borderRadius: "6px", fontSize: "11px", marginTop: "4px", color: "#475569" }}>
                                {log.SubStatus && <div><strong style={{ color: "#e11d48" }}>Sub Status:</strong> {log.SubStatus}</div>}
                                {(log.Remarks || log.Note) && <div style={{ marginTop: "2px" }}><strong style={{ color: "#64748b" }}>Remarks:</strong> {log.Remarks || log.Note}</div>}
                              </div>
                            )}

                            <div style={{ marginTop: "4px", paddingTop: "4px", borderTop: "1px solid #f1f5f9", fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
                              <span>Changed By: <span style={{ color: "#475569", fontWeight: 800 }}>{log.ChangedBy || log.Actor || "System"}</span></span>
                              <span>Source: {log.ActionSource || log.actionSource || "System"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUS ACTIONS MODAL */}
      {/* ========================================================================= */}
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
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: "18px", fontWeight: 800, color: "#1e293b" }}>
              {actionType === "cancel" ? "Cancel Order" : "Mark Order Status"}
            </h2>

            <select
              value={subStatus}
              onChange={(e) => setSubStatus(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                marginBottom: 16,
                fontSize: "13px",
                fontWeight: 600
              }}
            >
              <option value="">
                {actionType === "cancel" ? "-- Select Cancel Reason --" : "-- Select Outcome Status --"}
              </option>

              {actionType === "cancel"
                ? CANCEL_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))
                : selectedOrder?.status === "inkitchen"
                ? NOT_DELIVERED_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))
                : DELIVERED_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))
              }
            </select>

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
                fontSize: "13px"
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedOrder(null);
                  setSubStatus("");
                  setRemarks("");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px"
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
                  fontSize: "13px"
                }}
              >
                Submit Action
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .table-row-hover:hover { background-color: #f8fafc !important; transition: background-color 0.15s ease; }
      `}} />
    </section>
  );
}
