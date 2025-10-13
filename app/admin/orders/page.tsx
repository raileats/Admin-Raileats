// app/admin/orders/page.tsx
"use client";
import { useMemo, useState } from "react";

/**
 * Orders admin page with tabs, inline dropdown marking, and flexible search filters.
 *
 * Replace demo data with real API calls in useEffect and call backend for status changes.
 */

/* ---------- Types ---------- */
type TabKey =
  | "booked"
  | "verification"
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
  outletId: string;
  outletName: string;
  stationCode: string;
  stationName: string;
  deliveryDate: string; // yyyy-mm-dd
  deliveryTime: string; // hh:mm
  trainNo?: string;
  coach?: string;
  seat?: string;
  customerName: string;
  customerMobile: string;
  total?: string;
  history: OrderHistoryItem[];
};

/* ---------- Tabs & helpers ---------- */
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

const NEXT_MAP: Record<TabKey, { next?: TabKey; actionLabel?: string }> = {
  booked: { next: "verification", actionLabel: "Move to In Verification" },
  verification: { next: "inkitchen", actionLabel: "Move to In Kitchen" },
  inkitchen: { next: "outfordelivery", actionLabel: "Move to Out for Delivery" },
  outfordelivery: {},
  delivered: {},
  cancelled: {},
  notdelivered: {},
  baddelivery: {},
};

const FINAL_MARK_OPTIONS = [
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "notdelivered", label: "Not Delivered" },
  { key: "baddelivery", label: "Bad Delivery" },
] as const;

/* ---------- Demo data generator (replace with API) ---------- */
function makeDemoOrdersFor(status: TabKey, count = 6): Order[] {
  return Array.from({ length: count }).map((_, i) => {
    const id = `${status.slice(0, 3).toUpperCase()}-${1000 + i}`;
    const days = i;
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return {
      id,
      status,
      outletId: `OUT${100 + (i % 5)}`,
      outletName: `Outlet ${(i % 5) + 1}`,
      stationCode: `ST${10 + (i % 4)}`,
      stationName: `Station ${(i % 4) + 1}`,
      deliveryDate: date.toISOString().slice(0, 10),
      deliveryTime: `${10 + (i % 6)}:30`,
      trainNo: `TN${500 + i}`,
      coach: `C${(i % 8) + 1}`,
      seat: `${(i % 72) + 1}A`,
      customerName: `Customer ${i + 1}`,
      customerMobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      total: (120 + i * 10).toFixed(2),
      history: [{ at: new Date().toISOString(), by: "system", note: "Order created", status }],
    } as Order;
  });
}

/* ---------- Search types ---------- */
type SearchType =
  | "customerMobile"
  | "orderId"
  | "outletId"
  | "stationCode"
  | "deliveryDate"
  | "trainNo";

/* ---------- Component ---------- */
export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("booked");

  // All orders grouped by status (demo). In real app: fetch from API.
  const [allOrders, setAllOrders] = useState<Record<TabKey, Order[]>>(() => {
    const map = {} as Record<TabKey, Order[]>;
    for (const t of TABS) {
      map[t.key] = makeDemoOrdersFor(t.key, 6);
    }
    return map;
  });

  // Inline marking state per-order (dropdown + remarks)
  const [marking, setMarking] = useState<Record<string, { status: string; remarks: string }>>({});

  // Search controls
  const [searchType, setSearchType] = useState<SearchType>("orderId");
  const [searchText, setSearchText] = useState("");
  const [searchDate, setSearchDate] = useState<string>(""); // yyyy-mm-dd
  const [searchTrainNo, setSearchTrainNo] = useState("");
  const [searchOutlet, setSearchOutlet] = useState("");

  // Derived orders for active tab
  const orders = useMemo(() => allOrders[activeTab] ?? [], [allOrders, activeTab]);

  /* ---------- Helpers: move to next status (quick) ---------- */
  function moveOrderToNext(orderId: string) {
    const current = allOrders[activeTab] ?? [];
    const idx = current.findIndex((o) => o.id === orderId);
    if (idx === -1) return;
    const order = current[idx];
    const mapping = NEXT_MAP[order.status];
    if (!mapping?.next) return alert("Cannot move further");

    // In production: call API to change status, then update state on success
    const updated: Order = {
      ...order,
      status: mapping.next!,
      history: [
        ...order.history,
        { at: new Date().toISOString(), by: "admin", note: mapping.actionLabel, status: mapping.next! },
      ],
    };

    setAllOrders((prev) => {
      const copy = { ...prev };
      copy[activeTab] = copy[activeTab].filter((o) => o.id !== orderId);
      copy[mapping.next!] = [updated, ...(copy[mapping.next!] ?? [])];
      return copy;
    });
  }

  /* ---------- Submit marking (dropdown) ---------- */
  function submitMark(order: Order) {
    const selection = marking[order.id];
    if (!selection || !selection.status) {
      alert("Select status first");
      return;
    }
    const target = selection.status as TabKey;

    // In production: call API: POST /api/admin/orders/:id/mark { newStatus, remarks }
    const updated: Order = {
      ...order,
      status: target,
      history: [
        ...order.history,
        { at: new Date().toISOString(), by: "admin", note: selection.remarks || `Marked ${target}`, status: target },
      ],
    };

    setAllOrders((prev) => {
      const copy = { ...prev };
      // remove from all tabs
      for (const k of Object.keys(copy) as TabKey[]) {
        copy[k] = copy[k].filter((o) => o.id !== order.id);
      }
      // put into target tab
      copy[target] = [updated, ...(copy[target] ?? [])];
      return copy;
    });

    // cleanup
    setMarking((prev) => {
      const cp = { ...prev };
      delete cp[order.id];
      return cp;
    });

    // switch view to target tab
    setActiveTab(target);
  }

  /* ---------- Filtering logic (based on selected search type + inputs) ---------- */
  function applyFilters(list: Order[]) {
    // first: if search type uses text fields
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
      if (q) filtered = filtered.filter((o) => o.outletId.toLowerCase().includes(q) || o.outletName.toLowerCase().includes(q));
    }

    return filtered;
  }

  const visibleOrders = useMemo(() => applyFilters(orders), [orders, searchText, searchDate, searchType, searchTrainNo, searchOutlet]);

  /* ---------- render helpers ---------- */
  const renderDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  };

  return (
    <section style={{ padding: 12 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Orders</h1>
          <p style={{ margin: 0, color: "#6b7280" }}>Manage orders & mark statuses</p>
        </div>
        <div style={{ color: "#6b7280" }}>Showing: <strong>{TABS.find(t => t.key === activeTab)?.label}</strong></div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, marginBottom: 12 }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: active ? "2px solid #273e9a" : "1px solid #e6e8eb",
                background: active ? "#fff" : "#f8fafc",
                fontWeight: active ? 700 : 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search / Filters */}
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

        {/* conditional input based on search type */}
        {searchType === "deliveryDate" ? (
          <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} />
        ) : (
          <input
            placeholder={
              searchType === "customerMobile"
                ? "Enter customer mobile"
                : searchType === "orderId"
                  ? "Enter order id"
                  : searchType === "outletId"
                    ? "Enter outlet id or name"
                    : searchType === "stationCode"
                      ? "Enter station code or name"
                      : "Enter train no"
            }
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb", minWidth: 220 }}
          />
        )}

        {/* optional quick outlet filter */}
        <input
          placeholder="Filter by outlet (optional)"
          value={searchOutlet}
          onChange={(e) => setSearchOutlet(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb", minWidth: 180 }}
        />

        <button
          onClick={() => {
            // quick reset
            setSearchText("");
            setSearchDate("");
            setSearchOutlet("");
            setSearchTrainNo("");
          }}
          style={{ padding: "8px 12px", borderRadius: 6 }}
        >
          Reset
        </button>
      </div>

      {/* Orders table */}
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
                  <td style={{ padding: 10 }}>{renderDate(o.deliveryDate)}</td>
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
                            <div style={{ fontSize: 13 }}>{h.note ?? TABS.find(t => t.key === h.status)?.label}</div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>

                  <td style={{ padding: 10, verticalAlign: "top" }}>
                    {/* If intermediary => quick move */}
                    {["booked", "verification", "inkitchen"].includes(o.status) ? (
                      <button
                        onClick={() => {
                          if (!confirm(`Move ${o.id} to next status?`)) return;
                          moveOrderToNext(o.id);
                        }}
                        style={{ padding: "8px 10px", borderRadius: 6, background: "#273e9a", color: "#fff", border: "none", cursor: "pointer" }}
                      >
                        {NEXT_MAP[o.status]?.actionLabel}
                      </button>
                    ) : (
                      // Out for delivery or final-state => inline dropdown + remarks + submit
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
                        <select
                          value={marking[o.id]?.status || ""}
                          onChange={(e) =>
                            setMarking((prev) => ({ ...prev, [o.id]: { ...(prev[o.id] || { remarks: "" }), status: e.target.value } }))
                          }
                          style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb" }}
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
                            setMarking((prev) => ({ ...prev, [o.id]: { ...(prev[o.id] || { status: "" }), remarks: e.target.value } }))
                          }
                          style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb" }}
                        />

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => submitMark(o)}
                            style={{ padding: "8px 10px", borderRadius: 6, border: "none", background: "#0f172a", color: "#fff", cursor: "pointer", flex: 1 }}
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

              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ padding: 20, color: "#6b7280" }}>
                    No orders found for this tab / filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
