"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Bell } from "lucide-react";
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

// MAPS EVERYTHING TO THE EXACT SUPABASE ENUM CASING (Matches 'Booked', 'In Verification' etc.)
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

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {

  if (typeof window !== "undefined") {

    return (
      localStorage.getItem("raileats_admin_tab") as TabKey
    ) || "booked";

  }

  return "booked";

});
  const [allOrders, setAllOrders] = useState<Record<TabKey, Order[]>>({} as Record<TabKey, Order[]>);
  const [loading, setLoading] = useState(false);
  const [statusModalOpen, setStatusModalOpen] =
  useState(false);

const [selectedOrder, setSelectedOrder] =
  useState<any>(null);

const [actionType, setActionType] =
  useState("");

const [subStatus, setSubStatus] =
  useState("");
const [mainStatus, setMainStatus] =
  useState("");
  
const [remarks, setRemarks] =
  useState("");
  const [marking, setMarking] = useState<Record<string, { status: string; remarks: string }>>({});

  const [searchType, setSearchType] = useState<SearchType>("orderId");
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState<string>(""); 
  const [searchOutlet, setSearchOutlet] = useState("");
  const [newOrderCount, setNewOrderCount] = useState<number>(() => {

  if (typeof window !== "undefined") {

    return Number(
      localStorage.getItem("raileats_new_orders") || 0
    );

  }

  return 0;

});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ================= INIT SOUND ================= */

useEffect(() => {

  audioRef.current = new Audio("/sounds/new-order.mp3");

audioRef.current.preload = "auto";

document.body.addEventListener(
  "click",
  async () => {

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

  },
  { once: true }
);
  audioRef.current.volume = 1;

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
      {
        event: "INSERT",
        schema: "public",
        table: "Orders",
      },

      async (payload) => {

        console.log("NEW ORDER:", payload);
        setNewOrderCount((prev) => {

  const updated = prev + 1;

  console.log("Bell Updated:", updated);

  localStorage.setItem(
    "raileats_new_orders",
    String(updated)
  );

  return updated;

});
        setNewOrderCount((prev) => prev + 1);

        /* PLAY SOUND */

        try {

          if (audioRef.current) {

            audioRef.current.currentTime = 0;

            await audioRef.current.play();

          }

        } catch (e) {

          console.log("sound blocked");

        }

        /* NOTIFICATION */

try {

  if (Notification.permission === "granted") {

    new Notification("🚆 New RailEats Order", {

      body:
        `${payload.new.customerName || "Customer"} • ${payload.new.stationName || ""}`,

    });

  }

} catch (e) {}

/* AUTO REFRESH HANDLED SEPARATELY */

    }

  )

  .subscribe();

return () => {

  supabase.removeChannel(channel);

};

}, []);;

/* ================= AUTO REFRESH ================= */

useEffect(() => {

  const interval = setInterval(() => {

    window.location.reload();

  }, 30000);

  return () => clearInterval(interval);

}, []);

/* ================= LOAD ORDERS ================= */

useEffect(() => {

  let mounted = true;

  const load = async () => {

    try {

      setLoading(true);

      const params = new URLSearchParams();
        
        // API handles query parameter
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
            else if (
  lowerRaw === "neworder" ||
  lowerRaw === "new order"
)
  tabStatus = "neworder";
          else if (lowerRaw === "inkitchen" || lowerRaw === "in kitchen") tabStatus = "inkitchen";
          else if (lowerRaw === "outfordelivery" || lowerRaw === "out for delivery") tabStatus = "outfordelivery";
          else if (lowerRaw === "delivered") {

  const sub =
    String(
      row.subStatus ??
      row.SubStatus ??
      ""
    )
      .toLowerCase()
      .trim();

  if (
    sub === "bad delivery"
  ) {

    tabStatus = "baddelivery";

  }

  else {

    tabStatus = "delivered";

  }

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
          };
        });

        setAllOrders((prev) => ({ ...prev, [activeTab]: mapped }));
      } catch (e) {
        console.error("orders fetch error", e);
        setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
      } finally {
        setLoading(false);
      }
    };

       load();

    return () => {

      mounted = false;

    };

}, [activeTab]);

  const orders = useMemo(() => allOrders[activeTab] ?? [], [allOrders, activeTab]);

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
            newStatus: targetDbValue, // Sends exact Enum string like "In Verification"
            remarks: mapping.actionLabel,
            changedBy: "admin",
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

    let mainStatus = "";

    /* CANCEL FLOW */

    if (actionType === "cancel") {

      mainStatus = "Cancelled";

    }

    /* MARK FLOW */

    else {

      if (
        subStatus === "Delivered" ||
        subStatus === "Bad Delivery"
      ) {

        mainStatus = "Delivered";

      }

      else if (
        subStatus === "Not Delivered"
      ) {

        mainStatus = "Not Delivered";

      }

      else if (
        subStatus === "Cancelled"
      ) {

        mainStatus = "Cancelled";

      }

    }

    const res = await fetch(

      `/api/orders/${encodeURIComponent(
        selectedOrder.id
      )}/status`,

      {
        method: "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({

          newStatus: mainStatus,

          subStatus,

          remarks,

          changedBy: "admin",

          actionSource: "admin",

        }),

      }

    );

    const json =
      await res.json();

    if (!res.ok || !json?.ok) {

      alert("Failed to update order");

      return;

    }

    /* MOVE UI */

    const targetKey: TabKey =

  subStatus === "Bad Delivery"

    ? "baddelivery"

    : (
        mainStatus
          .toLowerCase()
          .replace(/\s/g, "")
      ) as TabKey;

    const updatedOrder = {

      ...selectedOrder,

      status: targetKey,

      dbStatus: mainStatus,

      history: [

        ...selectedOrder.history,

        {

          at: new Date().toISOString(),

          by: "admin",

          note:
            `${subStatus}${remarks ? ` • ${remarks}` : ""}`,

          status: targetKey,

        },

      ],

    };

    setAllOrders((prev) => {

      const copy = {
        ...prev,
      };

      (
        Object.keys(
          copy
        ) as TabKey[]
      ).forEach((k) => {

        copy[k] =
          (
            copy[k] || []
          ).filter(
            (o) =>
              o.id !==
              selectedOrder.id
          );

      });

      copy[targetKey] = [

        updatedOrder,

        ...(copy[
          targetKey
        ] || []),

      ];

      return copy;

    });

    /* RESET */

    setStatusModalOpen(false);

    setSelectedOrder(null);

    setSubStatus("");

setMainStatus("");

setRemarks("");

    setActiveTab(targetKey);

  } catch (e) {

    console.error(e);

    alert("Network error");

  }

}
  function submitMark(order: Order) {
    const selection = marking[order.id];
    if (!selection || !selection.status) {
      alert("Select status first");
      return;
    }
    const targetKey = selection.status as TabKey;
    const matchedOption = FINAL_MARK_OPTIONS.find(o => o.key === targetKey);
    const targetDbValue = matchedOption ? matchedOption.dbValue : targetKey;
    const remarks = selection.remarks || `Marked ${targetKey}`;

    (async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newStatus: targetDbValue, // Pushes capitalized Enum string
            remarks,
            changedBy: "admin",
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
              note: remarks,
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

        setActiveTab(targetKey);
      } catch (e) {
        alert("Failed to change status (network error)");
      }
    })();
  }

  function applyFilters(list: Order[]) {
    let filtered = list.slice();

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

    return filtered;
  }
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
  const visibleOrders = useMemo(() => applyFilters(orders), [orders, searchText, searchDate, searchType, searchOutlet]);

  return (
    <section style={{ padding: 12 }}>
      <header
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  }}
>

  {/* LEFT */}

  <div>
    <h1
      style={{
        margin: 0,
        fontSize: 28,
      }}
    >
      Orders
    </h1>

    <p
      style={{
        margin: 0,
        color: "#6b7280",
      }}
    >
      Manage orders &amp; mark statuses
    </p>
  </div>

  {/* RIGHT */}

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >

    {/* BELL */}

    <Link
      href="/admin/orders"
      onClick={() => {

  setNewOrderCount(0);

  localStorage.removeItem(
    "raileats_new_orders"
  );

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

    {/* STATUS */}

    <div style={{ color: "#6b7280" }}>

      Showing:

      {" "}

      <strong>
        {
          TABS.find(
            (t) =>
              t.key === activeTab
          )?.label
        }
      </strong>

      {loading
        ? " • Loading…"
        : ""}

    </div>

  </div>

</header>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => {

  setActiveTab(tab.key);

  localStorage.setItem(
    "raileats_admin_tab",
    tab.key
  );

}}
              style={{
  padding: "8px 12px",
  borderRadius: 8,
  border: active ? "2px solid #273e9a" : "1px solid #e6e8eb",
  background: active ? "#fff" : "#f8fafc",
  fontWeight: active ? 700 : 600,
  cursor: "pointer",
}}
>

<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
  }}
>

  <span>{tab.label}</span>

  <span
    style={{
      background: active
        ? "#1d4ed8"
        : "#e5e7eb",

      color: active
        ? "#fff"
        : "#111827",

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

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Search by</span>
          <select value={searchType} onChange={(e) => setSearchType(e.target.value as SearchType)}>
            <option value="orderId">Order ID</option>
            <option value="customerMobile">Customer Mobile</option>
            <option value="outletId">Outlet ID / Name</option>
            <option value="stationCode">Station Code / Name</option>
            <option value="deliveryDate">Delivery Date</option>
            <option value="trainNo">Train No.</option>
          </select>
        </label>

        {searchType === "deliveryDate" ? (
          <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
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
            style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb", minWidth: 220 }}
          />
        )}

        <input
          placeholder="Filter by outlet (optional)"
          value={searchOutlet}
          onChange={(e) => setSearchOutlet(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb", minWidth: 180 }}
        />

        <button
          onClick={() => {
            setSearchText("");
            setSearchDate("");
            setSearchOutlet("");
          }}
          style={{ padding: "8px 12px", borderRadius: 6 }}
        >
          Reset
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 8, padding: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead style={{ textAlign: "left", borderBottom: "1px solid #e6e8eb" }}>
              <tr>
                <th style={{ padding: 10 }}>Order ID</th>
                <th style={{ padding: 10 }}>Outlet ID</th>
                <th style={{ padding: 10 }}>Outlet Name</th>
                <th style={{ padding: 10 }}>Station Code</th>
                <th style={{ padding: 10 }}>Station Name</th>
                <th style={{ padding: 10 }}>Delivery Date</th>
                <th style={{ padding: 10 }}>Delivery Time</th>
                <th style={{ padding: 10 }}>Train No.</th>
                <th style={{ padding: 10 }}>Coach</th>
                <th style={{ padding: 10 }}>Seat</th>
                <th style={{ padding: 10 }}>Customer Name</th>
                <th style={{ padding: 10 }}>Customer Mobile</th>
                <th style={{ padding: 10 }}>Order History</th>
                <th style={{ padding: 10 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {visibleOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 10 }}>{o.id}</td>
                  <td style={{ padding: 10 }}>{o.outletId}</td>
                  <td style={{ padding: 10 }}>{o.outletName}</td>
                  <td style={{ padding: 10 }}>{o.stationCode}</td>
                  <td style={{ padding: 10 }}>{o.stationName}</td>
                  <td style={{ padding: 10 }}>{o.deliveryDate}</td>
                  <td style={{ padding: 10 }}>{o.deliveryTime}</td>
                  <td style={{ padding: 10 }}>{o.trainNo}</td>
                  <td style={{ padding: 10 }}>{o.coach}</td>
                  <td style={{ padding: 10 }}>{o.seat}</td>
                  <td style={{ padding: 10 }}>{o.customerName}</td>
                  <td style={{ padding: 10 }}>{o.customerMobile}</td>

                  <td style={{ padding: 10, maxWidth: 260 }}>
                    <details>
                      <summary style={{ cursor: "pointer", color: "#2563eb" }}>View ({o.history.length})</summary>
                      <ul style={{ marginTop: 8, paddingLeft: 14 }}>
                        {o.history.map((h, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{new Date(h.at).toLocaleString()}</div>
                            <div style={{ fontWeight: 600 }}>{h.by}</div>
                            <div style={{ fontSize: 13 }}>{h.note ?? TABS.find((t) => t.key === h.status)?.label}</div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>

                  <td style={{ padding: 10, verticalAlign: "top" }}>

  {[
    "booked",
    "verification",
    "neworder",
    "inkitchen",
    "outfordelivery",
  ].includes(o.status) ? (

    <div
  style={{
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  }}
>

  <button
    onClick={() => {
      if (!confirm(`Move ${o.id} to next status?`)) return;
      moveOrderToNext(o.id);
    }}
    style={{
      padding: "8px 10px",
      borderRadius: 6,
      background: "#273e9a",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    {NEXT_MAP[o.status]?.actionLabel}
  </button>

  {(
    o.status === "booked" ||
    o.status === "verification" ||
    o.status === "neworder"
  ) && (

    <button
      onClick={() => {

        setSelectedOrder(o);

        setActionType("cancel");
        
        setMainStatus("Cancelled");

        setSubStatus("");

setMainStatus("");

setRemarks("");

        setStatusModalOpen(true);

      }}
      style={{
        padding: "8px 10px",
        borderRadius: 6,
        background: "#dc2626",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Cancel
    </button>

  )}

  {(
    o.status === "inkitchen" ||
    o.status === "outfordelivery"
  ) && (

    <button
      onClick={() => {

        setSelectedOrder(o);

        setActionType("mark");

        setMainStatus("");

        setSubStatus("");

setMainStatus("");

setRemarks("");

        setStatusModalOpen(true);

      }}
      style={{
        padding: "8px 10px",
        borderRadius: 6,
        background: "#111827",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Mark Status
    </button>

  )}

</div>

  ) : (

    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>

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
          padding: 8,
          borderRadius: 6,
          border: "1px solid #e6e8eb",
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
        placeholder="Remarks (optional)"
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
          padding: 8,
          borderRadius: 6,
          border: "1px solid #e6e8eb",
        }}
      />

      <div style={{ display: "flex", gap: 8 }}>

        <button
          onClick={() => submitMark(o)}
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            background: "#0f172a",
            color: "#fff",
            cursor: "pointer",
            flex: 1,
            border: "none",
          }}
        >
          Submit
        </button>

        <button
          onClick={() =>
            setMarking((prev) => {
              const cp = { ...prev };
              delete cp[o.id];
              return cp;
            })
          }
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid #e6e8eb",
            background: "#fff",
            cursor: "pointer",
          }}
        >
          Clear
        </button>

      </div>

    </div>

  )}

</td>
                </tr>
              ))}

              {!loading && visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ padding: 20, color: "#6b7280" }}>No orders found for this tab / filter.</td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={14} style={{ padding: 20, color: "#6b7280" }}>Loading orders…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      }}
    >

      <h2
        style={{
          marginTop: 0,
          marginBottom: 16,
        }}
      >
        {actionType === "cancel"
          ? "Cancel Order"
          : "Mark Order Status"}
      </h2>

      {/* CANCEL FLOW */}

      {actionType === "cancel" && (

        <select
          value={subStatus}
          onChange={(e) =>
            setSubStatus(e.target.value)
          }
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
            border: "1px solid #d1d5db",
          }}
        >

          <option value="">
            Select Cancel Reason
          </option>

          {CANCEL_REASONS.map((r) => (

            <option
              key={r}
              value={r}
            >
              {r}
            </option>

          ))}

        </select>

      )}

      {/* MARK FLOW */}

{actionType === "mark" && (

  <>

    <select
      value={mainStatus}
      onChange={(e) => {

        setMainStatus(
          e.target.value
        );

        setSubStatus("");

      }}
      style={{
        width: "100%",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
        border: "1px solid #d1d5db",
      }}
    >

      <option value="">
        Select Main Status
      </option>

      <option value="Delivered">
        Delivered
      </option>

      <option value="Cancelled">
        Cancelled
      </option>

      <option value="Not Delivered">
        Not Delivered
      </option>

    </select>

    {mainStatus && (

      <select
        value={subStatus}
        onChange={(e) =>
          setSubStatus(
            e.target.value
          )
        }
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          marginBottom: 12,
          border:
            "1px solid #d1d5db",
        }}
      >

        <option value="">
          Select Sub Status
        </option>

        {mainStatus ===
          "Delivered" && (

          <>

            <option value="Delivered">
              Delivered
            </option>

            <option value="Bad Delivery">
              Bad Delivery
            </option>

          </>

        )}

        {mainStatus ===
          "Cancelled" && (

          <>

            {CANCEL_REASONS.map(
              (r) => (

                <option
                  key={r}
                  value={r}
                >
                  {r}
                </option>

              )
            )}

          </>

        )}

        {mainStatus ===
          "Not Delivered" && (

          <>

            {NOT_DELIVERED_REASONS.map(
              (r) => (

                <option
                  key={r}
                  value={r}
                >
                  {r}
                </option>

              )
            )}

          </>

        )}

      </select>

    )}

  </>

)}
