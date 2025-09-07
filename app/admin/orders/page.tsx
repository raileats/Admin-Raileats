// app/admin/orders/page.tsx
"use client";
import { useMemo, useState } from "react";

/**
 * Tab keys and labels
 */
type TabKey =
  | "booked"
  | "verification"
  | "inkitchen"
  | "outfordelivery"
  | "delivered"
  | "cancelled"
  | "notdelivered"
  | "baddelivery";

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

/**
 * Order type
 */
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
  total: string;
  history: { at: string; by: string; note?: string; status: TabKey }[]; // history entries
};

/**
 * Demo orders generator (replace with API fetch)
 */
function makeDemoOrdersFor(status: TabKey, count = 6): Order[] {
  return Array.from({ length: count }).map((_, i) => {
    const id = `${status.slice(0, 3).toUpperCase()}-${1000 + i}`;
    return {
      id,
      status,
      outletId: `OUT${100 + (i % 5)}`,
      outletName: `Outlet ${(i % 5) + 1}`,
      stationCode: `ST${10 + (i % 4)}`,
      stationName: `Station ${(i % 4) + 1}`,
      deliveryDate: new Date(Date.now() + i * 86400000).toISOString().slice(0, 10),
      deliveryTime: `${10 + i % 6}:30`,
      trainNo: `TN${500 + i}`,
      coach: `C${(i % 8) + 1}`,
      seat: `${(i % 72) + 1}A`,
      customerName: `Customer ${i + 1}`,
      customerMobile: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
      total: (100 + i * 20).toFixed(2),
      history: [
        { at: new Date().toISOString(), by: "system", note: "Order created", status },
      ],
    } as Order;
  });
}

/**
 * Utility: get next status label and key
 */
const NEXT_MAP: Record<TabKey, { next?: TabKey; actionLabel?: string }> = {
  booked: { next: "verification", actionLabel: "Move to In Verification" },
  verification: { next: "inkitchen", actionLabel: "Move to In Kitchen" },
  inkitchen: { next: "outfordelivery", actionLabel: "Move to Out for Delivery" },
  outfordelivery: { next: "delivered", actionLabel: "Mark Delivered" },
  delivered: { next: undefined, actionLabel: undefined },
  cancelled: { next: undefined, actionLabel: undefined },
  notdelivered: { next: undefined, actionLabel: undefined },
  baddelivery: { next: undefined, actionLabel: undefined },
};

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("booked");

  // In real app: fetch orders from API by status. Here we use demo generator.
  const [allOrders, setAllOrders] = useState<Record<TabKey, Order[]>>(() => {
    const map = {} as Record<TabKey, Order[]>;
    for (const t of TABS) {
      map[t.key] = makeDemoOrdersFor(t.key, 6);
    }
    return map;
  });

  // Orders for active tab
  const orders = useMemo(() => allOrders[activeTab] ?? [], [allOrders, activeTab]);

  // Move an order to next status (client-side)
  async function moveOrderToNext(orderId: string) {
    // Find order in current tab
    const current = allOrders[activeTab] || [];
    const idx = current.findIndex((o) => o.id === orderId);
    if (idx === -1) return;

    const order = current[idx];
    const mapping = NEXT_MAP[order.status];
    if (!mapping?.next) {
      alert("This order cannot be moved further.");
      return;
    }

    // Optional: call your backend API to change status
    // const res = await fetch('/api/admin/orders/change-status', { method: 'POST', body: JSON.stringify({ id: order.id, newStatus: mapping.next }) });

    // Update client state (simulate success)
    const newOrder: Order = {
      ...order,
      status: mapping.next!,
      history: [
        ...order.history,
        { at: new Date().toISOString(), by: "admin", note: mapping.actionLabel, status: mapping.next! },
      ],
    };

    setAllOrders((prev) => {
      const copy = { ...prev };
      // remove from current tab
      copy[activeTab] = copy[activeTab].filter((o) => o.id !== orderId);
      // add to next tab at top
      copy[mapping.next!] = [newOrder, ...(copy[mapping.next!] ?? [])];
      return copy;
    });
  }

  // Render helper: format date/time
  function renderDate(d: string) {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return d;
    }
  }

  return (
    <section>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Orders</h1>
          <p style={{ color: "#6b7280", marginTop: 6 }}>Manage and update order statuses</p>
        </div>
        <div style={{ color: "#6b7280" }}>Showing: <strong>{TABS.find(t => t.key === activeTab)?.label}</strong></div>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
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

      {/* Filters / Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input placeholder="Search order id / customer" style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #e6e8eb" }} />
        <select style={{ padding: 8, borderRadius: 6, border: "1px solid #e6e8eb" }}>
          <option>All Outlets</option>
        </select>
        <button style={{ padding: "8px 12px", borderRadius: 6, background: "#273e9a", color: "#fff", border: "none" }}>Refresh</button>
      </div>

      {/* Orders table */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1100 }}>
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
              {orders.map((o) => (
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

                  <td style={{ padding: 10, maxWidth: 240 }}>
                    <details>
                      <summary style={{ cursor: "pointer", color: "#2563eb" }}>View history ({o.history.length})</summary>
                      <ul style={{ marginTop: 8, paddingLeft: 14 }}>
                        {o.history.map((h, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            <div style={{ fontSize: 13, color: "#6b7280" }}>{new Date(h.at).toLocaleString()}</div>
                            <div style={{ fontWeight: 600 }}>{h.by}</div>
                            <div style={{ fontSize: 13 }}>{h.note ?? TABS.find(t=>t.key===h.status)?.label}</div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>

                  <td style={{ padding: 10 }}>
                    {NEXT_MAP[o.status]?.next ? (
                      <button
                        onClick={() => {
                          if (!confirm(`Are you sure you want to ${NEXT_MAP[o.status]?.actionLabel}?`)) return;
                          moveOrderToNext(o.id);
                        }}
                        style={{ padding: "8px 10px", borderRadius: 6, border: "none", background: "#0f172a", color: "#fff", cursor: "pointer" }}
                      >
                        {NEXT_MAP[o.status].actionLabel}
                      </button>
                    ) : (
                      <div style={{ color: "#6b7280" }}>—</div>
                    )}
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={14} style={{ padding: 20, color: "#6b7280" }}>
                    No orders in this tab.
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
