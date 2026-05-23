"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "booked" | "verification" | "inkitchen" | "outfordelivery" | "delivered" | "cancelled" | "notdelivered" | "baddelivery";

type OrderHistoryItem = { at: string; by: string; note?: string; status: string; };
type Order = { id: string; status: TabKey; dbStatus: string; outletId: string; outletName: string; stationCode: string; stationName: string; deliveryDate: string; deliveryTime: string; trainNo?: string; coach?: string; seat?: string; customerName: string; customerMobile: string; total?: string; history: OrderHistoryItem[]; };

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

  const [searchType, setSearchType] = useState<string>("orderId");
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState(""); 
  const [searchOutlet, setSearchOutlet] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?status=${activeTab}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
        return;
      }

      const mapped: Order[] = (json.orders || []).map((row: any) => {
        const raw = String(row.Status ?? "Booked");
        let tabStatus: TabKey = "booked";

        if (raw === "In Verification") tabStatus = "verification";
        else if (raw === "In Kitchen") tabStatus = "inkitchen";
        else if (raw === "Out for Delivery") tabStatus = "outfordelivery";
        else if (raw === "Delivered") tabStatus = "delivered";
        else if (raw === "Cancelled") tabStatus = "cancelled";
        else if (raw === "Not Delivered") tabStatus = "notdelivered";
        else if (raw === "Bad Delivery") tabStatus = "baddelivery";

        const historyArr = (row.history || []).map((h: any) => ({
          at: String(h.ChangedAt || h.changedAt || new Date().toISOString()),
          by: String(h.ChangedBy || h.changedBy || "system"),
          note: h.Note || h.remarks || h.note || "",
          status: String(h.NewStatus || "")
        }));

        return {
          id: String(row.OrderId ?? ""), status: tabStatus, dbStatus: raw,
          outletId: String(row.RestroCode ?? ""), outletName: String(row.RestroName ?? ""),
          stationCode: String(row.StationCode ?? ""), stationName: String(row.StationName ?? ""),
          deliveryDate: String(row.DeliveryDate ?? ""), deliveryTime: String(row.DeliveryTime ?? ""),
          trainNo: row.TrainNumber ?? "", coach: row.Coach ?? "", seat: row.Seat ?? "",
          customerName: String(row.CustomerName ?? ""), customerMobile: String(row.CustomerMobile ?? ""),
          total: String(row.TotalAmount ?? 0), history: historyArr
        };
      });

      setAllOrders((prev) => ({ ...prev, [activeTab]: mapped }));
    } catch (e) {
      setAllOrders((prev) => ({ ...prev, [activeTab]: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [activeTab]);

  const orders = useMemo(() => allOrders[activeTab] ?? [], [allOrders, activeTab]);

  function moveOrderToNext(orderId: string) {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const mapping = NEXT_MAP[order.status];
    if (!mapping || !mapping.next) return;

    (async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus: mapping.dbValue, remarks: mapping.actionLabel, changedBy: "admin" })
        });
        if (res.ok) { alert("Moved successfully!"); loadOrders(); }
        else { alert("Failed to change status"); }
      } catch (e) { alert("Network Error"); }
    })();
  }

  function submitMark(order: Order) {
    const selection = marking[order.id];
    if (!selection || !selection.status) return;
    const targetOption = FINAL_MARK_OPTIONS.find(o => o.key === selection.status);
    if (!targetOption) return;

    (async () => {
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus: targetOption.dbValue, remarks: selection.remarks || `Marked ${targetOption.label}`, changedBy: "admin" })
        });
        if (res.ok) {
          setMarking(p => { const c = {...p}; delete c[order.id]; return c; });
          alert("Updated successfully!");
          loadOrders();
        }
      } catch (e) { alert("Network error"); }
    })();
  }

  const visibleOrders = useMemo(() => {
    let filtered = orders.slice();
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      if (searchType === "customerMobile") filtered = filtered.filter(o => o.customerMobile.includes(q));
      else if (searchType === "orderId") filtered = filtered.filter(o => o.id.toLowerCase().includes(q));
      else if (searchType === "outletId") filtered = filtered.filter(o => o.outletId.includes(q) || o.outletName.toLowerCase().includes(q));
      else if (searchType === "stationCode") filtered = filtered.filter(o => o.stationCode.toLowerCase().includes(q) || o.stationName.toLowerCase().includes(q));
      else if (searchType === "trainNo") filtered = filtered.filter(o => o.trainNo?.toLowerCase().includes(q));
    }
    if (searchDate) filtered = filtered.filter(o => o.deliveryDate === searchDate);
    if (searchOutlet.trim()) {
      const q = searchOutlet.trim().toLowerCase();
      filtered = filtered.filter(o => o.outletId.includes(q) || o.outletName.toLowerCase().includes(q));
    }
    return filtered;
  }, [orders, searchText, searchType, searchDate, searchOutlet]);

  return (
    <section style={{ padding: 12 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24 }}>Admin Order Desk</h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>Realtime database view based logs</p>
        </div>
        <div>{loading ? "⚡ Syncing Database..." : "🟢 Connected"}</div>
      </header>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: "8px 14px", borderRadius: 6, cursor: "pointer",
              border: activeTab === t.key ? "2px solid #273e9a" : "1px solid #e2e8f0",
              background: activeTab === t.key ? "#273e9a" : "#fff",
              color: activeTab === t.key ? "#fff" : "#1e293b",
              fontWeight: "bold"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap", background: "#f8fafc", padding: 8, borderRadius: 6 }}>
        <select value={searchType} onChange={(e) => setSearchType(e.target.value)} style={{ padding: 6 }}>
          <option value="orderId">Order ID</option>
          <option value="customerMobile">Mobile No</option>
          <option value="outletId">Outlet ID/Name</option>
          <option value="stationCode">Station</option>
          <option value="trainNo">Train No</option>
        </select>
        <input placeholder="Search query..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc" }} />
        <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} style={{ padding: 5 }} />
        <button onClick={() => { setSearchText(""); setSearchDate(""); setSearchOutlet(""); }} style={{ padding: "6px 12px" }}>Clear Filters</button>
      </div>

      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#f1f5f9", textAlign: "left" }}>
            <tr>
              <th style={{ padding: 10 }}>Order ID</th>
              <th style={{ padding: 10 }}>Outlet Name</th>
              <th style={{ padding: 10 }}>Station</th>
              <th style={{ padding: 10 }}>Date/Time</th>
              <th style={{ padding: 10 }}>Train details</th>
              <th style={{ padding: 10 }}>Customer</th>
              <th style={{ padding: 10 }}>Total</th>
              <th style={{ padding: 10 }}>History</th>
              <th style={{ padding: 10 }}>Action Trigger</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={{ padding: 10, fontWeight: "bold" }}>{o.id}</td>
                <td style={{ padding: 10 }}>{o.outletName} <br/><small style={{ color: "#6b7280" }}>ID: {o.outletId}</small></td>
                <td style={{ padding: 10 }}>{o.stationName} ({o.stationCode})</td>
                <td style={{ padding: 10 }}>{o.deliveryDate}<br/>{o.deliveryTime}</td>
                <td style={{ padding: 10 }}>T: {o.trainNo}<br/>C: {o.coach} / S: {o.seat}</td>
                <td style={{ padding: 10 }}>{o.customerName}<br/>{o.customerMobile}</td>
                <td style={{ padding: 10, fontWeight: "bold" }}>₹{o.total}</td>
                <td style={{ padding: 10 }}>
                  <details>
                    <summary style={{ cursor: "pointer", color: "#2563eb" }}>Logs ({o.history.length})</summary>
                    <div style={{ padding: 6, background: "#f8fafc", fontSize: 11, borderRadius: 4 }}>
                      {o.history.map((h, idx) => (
                        <div key={idx} style={{ marginBottom: 4 }}>
                          <strong>{h.by}</strong>: {h.note || h.status}
                        </div>
                      ))}
                    </div>
                  </details>
                </td>
                <td style={{ padding: 10 }}>
                  {["booked", "verification", "inkitchen", "outfordelivery"].includes(o.status) ? (
                    <button onClick={() => moveOrderToNext(o.id)} style={{ padding: "6px 12px", background: "#273e9a", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                      {NEXT_MAP[o.status]?.actionLabel}
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 4 }}>
                      <select onChange={(e) => setMarking(p => ({...p, [o.id]: {...(p[o.id] || {}), status: e.target.value}})} style={{ padding: 4 }}>
                        <option value="">Choose</option>
                        {FINAL_MARK_OPTIONS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                      <button onClick={() => submitMark(o)} style={{ padding: "4px 8px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 4 }}>Go</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {visibleOrders.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No record matches active dashboard criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
