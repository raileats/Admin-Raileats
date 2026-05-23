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

type SearchType =
  | "customerMobile"
  | "orderId"
  | "outletId"
  | "stationCode"
  | "deliveryDate"
  | "trainNo";

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
      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json?.ok) {
        console.error("orders fetch failed", json);
        setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
        return;
      }

      // 🔹 DEEP READ MAPPING: Database headings aur UI state ko sync karne ki layer
      const mapped: Order[] = (json.orders || []).map((row: any) => {
        // Supabase schema 'Status' property ko uppercase karke check karenge
        const rawStatus = String(row.Status || row.status || "BOOKED").toUpperCase().trim();
        let tabStatus: TabKey = "booked";
        
        if (rawStatus === "BOOKED") tabStatus = "booked";
        else if (rawStatus === "UNDER_VERIFICATION" || rawStatus === "IN VERIFICATION" || rawStatus === "VERIFICATION") tabStatus = "verification";
        else if (rawStatus === "IN_KITCHEN" || rawStatus === "IN KITCHEN" || rawStatus === "INKITCHEN") tabStatus = "inkitchen";
        else if (rawStatus === "OUT_FOR_DELIVERY" || rawStatus === "OUT FOR DELIVERY" || rawStatus === "OUTFORDELIVERY") tabStatus = "outfordelivery";
        else if (rawStatus === "DELIVERED") tabStatus = "delivered";
        else if (rawStatus === "CANCELLED") tabStatus = "cancelled";
        else if (rawStatus === "NOT_DELIVERED" || rawStatus === "NOT DELIVERED" || rawStatus === "NOTDELIVERED") tabStatus = "notdelivered";
        else if (rawStatus === "BAD_DELIVERY" || rawStatus === "BAD DELIVERY" || rawStatus === "BADDELIVERY") tabStatus = "baddelivery";

        // History keys matching with OrderStatusHistory_rows schema
        const rawHistory = Array.isArray(row.history) ? row.history : [];
        const formattedHistory: OrderHistoryItem[] = rawHistory.map((h: any) => ({
          at: String(h.ChangedAt || h.changedAt || h.at || new Date().toISOString()),
          by: String(h.ChangedBy || h.changedBy || h.by || "system"),
          note: h.Note || h.note || h.Remarks || h.remarks || "",
          status: String(h.NewStatus || h.newStatus || h.status || "")
        }));

        // Main orders columns mapping with proper database heading fallbacks
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
          trainNo: String(row.TrainNumber || row.trainNo || row.TrainNo || ""),
          coach: String(row.Coach || row.coach || ""),
          seat: String(row.Seat || row.seat || ""),
          customerName: String(row.CustomerName || row.customerName || ""),
          customerMobile: String(row.CustomerMobile || row.customerMobile || ""),
          total: row.TotalAmount != null ? String(row.TotalAmount) : undefined,
          history: formattedHistory,
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

  useEffect(() => {
    loadOrders();
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
          }),
        });
        
        const json = await res.json().catch(() => ({}));
        
        if (!res.ok || !json?.ok) {
          alert(`🚨 STATUS UPDATE FAILED!\n\n${json?.details || json?.message || "Error"}`);
          return;
        }

        alert("Status moved successfully!");
        await loadOrders();

      } catch (e: any) {
        alert(`Network Error: ${e?.message || e}`);
      }
    })();
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
            newStatus: targetDbValue, 
            remarks,
            changedBy: "admin",
          }),
        });
        
        const json = await res.json().catch(() => ({}));
        
        if (!res.ok || !json?.ok) {
          alert(`🚨 DROPDOWN UPDATE FAILED!\n\n${json?.details || json?.message || "Error"}`);
          return;
        }

        setMarking((prev) => {
          const cp = { ...prev };
          delete cp[order.id];
          return cp;
        });

        alert("Status updated successfully!");
        await loadOrders();
      } catch (e: any) {
        alert(`Network Error: ${e?.message || e}`);
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

  const visibleOrders = useMemo(() => applyFilters(orders), [orders, searchText, searchDate, searchType, searchOutlet]);

  return (
    <section style={{ padding: 12 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Orders</h1>
          <p style={{ margin: 0, color: "#6b7280" }}>Manage orders &amp; mark statuses</p>
        </div>
        <div style={{ color: "#6b7280" }}>
          Showing: <strong>{TABS.find((t) => t.key === activeTab)?.label}</strong>
          {loading ? " • Loading…" : ""}
        </div>
      </header>

      <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => submitMark(o)}
                            style={{ padding: "8px 10px", borderRadius: 6, background: "#0f172a", color: "#fff", cursor: "pointer", flex: 1, border: "none" }}
                          >
                            Submit
                          </button>
                          <button
                            onClick={() =>
                              setMarking((prev) => {
                                const cp = { ...prev };
                                // FIX: 'order' ki jagah 'o' use kiya hai kyunki map mein 'o' define hai
                                delete cp[o.id]; 
                                return cp;
                              })
                            }
                            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #e6e8eb", background: "#fff", cursor: "pointer" }}
                          >
                            Clear
                          </button>
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
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{h.at ? new Date(h.at).toLocaleString() : "N/A"}</div>
                            <div style={{ fontWeight: 600 }}>{h.by}</div>
                            <div style={{ fontSize: 13 }}>{h.note || h.status}</div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>

                  <td style={{ padding: 10, verticalAlign: "top" }}>
                    {["booked", "verification", "inkitchen", "outfordelivery"].includes(o.status) ? (
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
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
                        <select
                          value={marking[o.id]?.status || ""}
                          onChange={(e) =>
                            setMarking((prev) => ({
                              ...prev,
                              [o.id]: { ...(prev[o.id] || { remarks: "" }), status: e.target.value },
                            }))
                          }
                          style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb" }}
                        >
                          <option value="">Select status</option>
                          {FINAL_MARK_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>

                        <input
                          placeholder="Remarks (optional)"
                          value={marking[o.id]?.remarks || ""}
                          onChange={(e) =>
                            setMarking((prev) => ({
                              ...prev,
                              [o.id]: { ...(prev[o.id] || { status: "" }), remarks: e.target.value },
                            }))
                          }
                          style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb" }}
                        />

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => submitMark(o)}
                            style={{ padding: "8px 10px", borderRadius: 6, background: "#0f172a", color: "#fff", cursor: "pointer", flex: 1, border: "none" }}
                          >
                            Submit
                          </button>
                          <button
                            onClick={() =>
                              setMarking((prev) => {
                                const cp = { ...prev };
                                delete cp[order.id];
                                return cp;
                              })
                            }
                            style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #e6e8eb", background: "#fff", cursor: "pointer" }}
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
    </section>
  );
}
