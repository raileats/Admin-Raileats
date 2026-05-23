"use client";

import React, { useEffect, useMemo, useState } from "react";

type TabKey =
  | "booked"
  | "verification"
  | "inkitchen"
  | "outfordelivery"
  | "delivered"
  | "cancelled"
  | "notdelivered"
  | "baddelivery";

type OrderHistoryItem = { 
  at: string; 
  by: string; 
  note?: string; 
  status: string; 
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
  total?: string;
  history: OrderHistoryItem[];
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "booked", label: "Booked" },
  { key: "verification", label: "In Verification" },
  { key: "inkitchen", label: "In Kitchen" },
  { key: "outfordelivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "notdelivered", label: "Not Delivered" },
  { key: "baddelivery", label: "Bad Delivery" },
];

const NEXT_MAP: Record<TabKey, { next: TabKey | null; actionLabel: string; dbValue: string }> = {
  booked: { next: "verification", actionLabel: "Move to In Verification", dbValue: "UNDER_VERIFICATION" },
  verification: { next: "inkitchen", actionLabel: "Move to In Kitchen", dbValue: "IN_KITCHEN" },
  inkitchen: { next: "outfordelivery", actionLabel: "Move to Out for Delivery 🛵", dbValue: "OUT_FOR_DELIVERY" },
  outfordelivery: { next: "delivered", actionLabel: "Mark as Delivered ✅", dbValue: "DELIVERED" },
  delivered: { next: null, actionLabel: "", dbValue: "DELIVERED" },
  cancelled: { next: null, actionLabel: "", dbValue: "CANCELLED" },
  notdelivered: { next: null, actionLabel: "", dbValue: "NOT_DELIVERED" },
  baddelivery: { next: null, actionLabel: "", dbValue: "BAD_DELIVERY" },
};

const FINAL_MARK_OPTIONS = [
  { key: "delivered", label: "Delivered", dbValue: "DELIVERED" },
  { key: "cancelled", label: "Cancelled", dbValue: "CANCELLED" },
  { key: "notdelivered", label: "Not Delivered", dbValue: "NOT_DELIVERED" },
  { key: "baddelivery", label: "Bad Delivery", dbValue: "BAD_DELIVERY" },
] as const;

type SearchType = "customerMobile" | "orderId" | "outletId" | "stationCode" | "deliveryDate" | "trainNo";

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("booked");
  const [allOrders, setAllOrders] = useState<Record<TabKey, Order[]>>({} as Record<TabKey, Order[]>);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState<Record<string, { status: string; remarks: string }>>({});
  const [searchType, setSearchType] = useState<SearchType>("orderId");
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchOutlet, setSearchOutlet] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${activeTab}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({ orders: [] }));
      
      const mapped: Order[] = (json.orders || []).map((row: any) => ({
        id: String(row.OrderId || row.orderId || row.id || ""),
        status: (row.Status || "booked").toLowerCase() as TabKey,
        dbStatus: row.Status || "",
        outletId: String(row.RestroCode || row.restroCode || ""),
        outletName: String(row.RestroName || row.restroName || ""),
        stationCode: String(row.StationCode || row.stationCode || ""),
        stationName: String(row.StationName || row.stationName || ""),
        deliveryDate: String(row.DeliveryDate || row.deliveryDate || ""),
        deliveryTime: String(row.DeliveryTime || row.deliveryTime || ""),
        customerMobile: String(row.CustomerMobile || row.customerMobile || ""),
        history: Array.isArray(row.history) ? row.history : []
      }));
      setAllOrders((prev) => ({ ...prev, [activeTab]: mapped }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [activeTab]);

  const orders = useMemo(() => allOrders[activeTab] ?? [], [allOrders, activeTab]);

  const visibleOrders = useMemo(() => {
    return orders.filter(o => {
      if (searchDate && o.deliveryDate !== searchDate) return false;
      if (searchText) {
        const q = searchText.toLowerCase();
        if (searchType === "orderId" && !o.id.toLowerCase().includes(q)) return false;
        if (searchType === "customerMobile" && !o.customerMobile.includes(q)) return false;
      }
      return true;
    });
  }, [orders, searchText, searchDate, searchType]);

  return (
    <section style={{ padding: 20 }}>
      <h1>Orders Management</h1>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ fontWeight: activeTab === tab.key ? "bold" : "normal" }}>
            {tab.label}
          </button>
        ))}
      </div>
      
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc" }}>
            <th>ID</th><th>Customer</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {visibleOrders.map((o) => (
            <tr key={o.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{o.id}</td>
              <td>{o.customerMobile}</td>
              <td>{o.dbStatus}</td>
              <td>
                {["booked", "verification", "inkitchen", "outfordelivery"].includes(o.status) ? (
                  <button onClick={async () => {
                    await fetch(`/api/orders/${o.id}/status`, { 
                      method: "PATCH", 
                      body: JSON.stringify({ newStatus: NEXT_MAP[o.status].dbValue }) 
                    });
                    loadOrders();
                  }}>
                    {NEXT_MAP[o.status].actionLabel}
                  </button>
                ) : (
                  <div>
                    <select onChange={(e) => setMarking(p => ({ ...p, [o.id]: { ...(p[o.id] || {remarks: ""}), status: e.target.value } }))}>
                      <option value="">Select...</option>
                      {FINAL_MARK_OPTIONS.map(opt => <option key={opt.key} value={opt.dbValue}>{opt.label}</option>)}
                    </select>
                    <button onClick={async () => {
                      const m = marking[o.id];
                      if(!m?.status) return;
                      await fetch(`/api/orders/${o.id}/status`, { 
                        method: "PATCH", 
                        body: JSON.stringify({ newStatus: m.status }) 
                      });
                      loadOrders();
                    }}>Submit</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
