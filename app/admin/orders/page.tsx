"use client";

import React, { useEffect, useMemo, useState } from "react";

// --- Types ---
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

type SearchType = 
  | "customerMobile" 
  | "orderId" 
  | "outletId" 
  | "stationCode" 
  | "deliveryDate" 
  | "trainNo";

// --- Constants ---
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

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("booked");
  const [allOrders, setAllOrders] = useState<Record<TabKey, Order[]>>({} as Record<TabKey, Order[]>);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState<Record<string, { status: string; remarks: string }>>({});

  const [searchType, setSearchType] = useState<SearchType>("orderId");
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState<string>(""); 
  const [searchOutlet, setSearchOutlet] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("status", activeTab);
      
      const res = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({ orders: [] }));

      if (!res.ok || !json) {
        setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
        return;
      }

      const mapped: Order[] = (json.orders || []).map((row: any) => {
        const rawStatus = String(row.Status || row.status || "BOOKED").toUpperCase().trim();
        let tabStatus: TabKey = "booked";
        
        if (rawStatus === "BOOKED") tabStatus = "booked";
        else if (rawStatus.includes("VERIF")) tabStatus = "verification";
        else if (rawStatus.includes("KITCHEN")) tabStatus = "inkitchen";
        else if (rawStatus.includes("DELIVERY")) tabStatus = "outfordelivery";
        else if (rawStatus === "DELIVERED") tabStatus = "delivered";
        else if (rawStatus === "CANCELLED") tabStatus = "cancelled";
        else if (rawStatus.includes("NOT")) tabStatus = "notdelivered";
        else if (rawStatus.includes("BAD")) tabStatus = "baddelivery";

        const rawHistory = Array.isArray(row.history) ? row.history : [];
        const formattedHistory: OrderHistoryItem[] = rawHistory.map((h: any) => ({
          at: String(h.ChangedAt || h.changedAt || h.at || new Date().toISOString()),
          by: String(h.ChangedBy || h.changedBy || h.by || "system"),
          note: h.Note || h.note || h.Remarks || h.remarks,
          status: String(h.NewStatus || h.newStatus || h.status || "")
        }));

        return {
          id: String(row.OrderId || row.orderId || row.id || ""),
          status: tabStatus,
          dbStatus: rawStatus, 
          outletId: String(row.RestroCode || row.restroCode || ""),
          outletName: String(row.RestroName || row.restroName || ""),
          stationCode: String(row.StationCode || row.stationCode || ""),
          stationName: String(row.StationName || row.stationName || ""),
          deliveryDate: String(row.DeliveryDate || row.deliveryDate || ""),
          deliveryTime: String(row.DeliveryTime || row.deliveryTime || ""),
          trainNo: row.TrainNumber || row.trainNo || "",
          coach: row.Coach || row.coach || "",
          seat: row.Seat || row.seat || "",
          customerName: String(row.CustomerName || row.customerName || ""),
          customerMobile: String(row.CustomerMobile || row.customerMobile || ""),
          total: row.TotalAmount != null ? String(row.TotalAmount) : undefined,
          history: formattedHistory,
        };
      });

      setAllOrders((prev) => ({ ...prev, [activeTab]: mapped }));
    } catch (e) {
      console.error("fetch error", e);
      setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const orders = useMemo(() => allOrders[activeTab] ?? [], [allOrders, activeTab]);

  const applyFilters = (list: Order[]) => {
    let filtered = list.slice();
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      filtered = filtered.filter(o => 
        (o.customerMobile.toLowerCase().includes(q)) ||
        (o.id.toLowerCase().includes(q)) ||
        (o.outletId.toLowerCase().includes(q)) ||
        (o.outletName.toLowerCase().includes(q)) ||
        (o.stationCode.toLowerCase().includes(q)) ||
        (o.trainNo?.toLowerCase().includes(q) ?? false)
      );
    }
    if (searchDate) filtered = filtered.filter((o) => o.deliveryDate === searchDate);
    if (searchOutlet) {
      const q = searchOutlet.trim().toLowerCase();
      filtered = filtered.filter((o) => o.outletId.toLowerCase().includes(q) || o.outletName.toLowerCase().includes(q));
    }
    return filtered;
  };

  const visibleOrders = useMemo(() => applyFilters(orders), [orders, searchText, searchDate, searchOutlet]);

  // Handler for next status button
  const handleMoveToNext = async (order: Order) => {
    if (!confirm(`Move order ${order.id} to next status?`)) return;
    const mapping = NEXT_MAP[order.status];
    if (!mapping || !mapping.next) return;

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus: mapping.dbValue, remarks: mapping.actionLabel }),
      });
      if (res.ok) {
        alert("Status updated!");
        await loadOrders();
      } else {
        alert("Update failed.");
      }
    } catch (e) { alert("Error"); }
  };

  // Handler for marking status
  const handleSubmitMark = async (order: Order) => {
    const selection = marking[order.id];
    if (!selection || !selection.status) {
      alert("Please select a status first");
      return;
    }
    
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus: selection.status, remarks: selection.remarks || "Updated by Admin" }),
      });
      
      if (res.ok) {
        setMarking((prev) => {
          const cp = { ...prev };
          delete cp[order.id];
          return cp;
        });
        alert("Status updated successfully!");
        await loadOrders();
      } else {
        alert("Update failed!");
      }
    } catch (e) {
      alert("Network Error");
    }
  };

  return (
    <section style={{ padding: 20 }}>
      <h1>Orders Management</h1>
      
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button 
            key={tab.key} 
            onClick={() => setActiveTab(tab.key)} 
            style={{ fontWeight: activeTab === tab.key ? "bold" : "normal", padding: "8px 12px" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <input placeholder="Search orders..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ padding: 8 }} />
        <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
        <button onClick={() => { setSearchText(""); setSearchDate(""); setSearchOutlet(""); }}>Reset</button>
      </div>
      
      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ccc" }}>
            <th>ID</th><th>Customer</th><th>Status</th><th>Actions</th>
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
                  <button onClick={() => handleMoveToNext(o)}>
                    {NEXT_MAP[o.status].actionLabel}
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 5 }}>
                    <select 
                      onChange={(e) => setMarking(prev => ({ 
                        ...prev, 
                        [o.id]: { ...(prev[o.id] || {remarks: ""}), status: e.target.value } 
                      }))}
                      value={marking[o.id]?.status || ""}
                    >
                      <option value="">Select Status</option>
                      {FINAL_MARK_OPTIONS.map(opt => <option key={opt.key} value={opt.dbValue}>{opt.label}</option>)}
                    </select>
                    <button onClick={() => handleSubmitMark(o)}>Submit</button>
                    <button onClick={() => setMarking(prev => { const cp = {...prev}; delete cp[o.id]; return cp; })}>Clear</button>
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
