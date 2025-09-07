// app/admin/home/page.tsx
export default function AdminHome() {
  return (
    <>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 36, margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#6b7280" }}>Welcome to the RailEats admin dashboard.</p>
      </header>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ padding: 18, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: 0 }}>Orders</h3>
          <p style={{ marginTop: 8, color: "#6b7280" }}>Pending orders: 12</p>
        </div>

        <div style={{ padding: 18, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: 0 }}>Active Outlets</h3>
          <p style={{ marginTop: 8, color: "#6b7280" }}>Total: 34</p>
        </div>

        <div style={{ padding: 18, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: 0 }}>Menu Items</h3>
          <p style={{ marginTop: 8, color: "#6b7280" }}>Total: 128</p>
        </div>
      </section>
    </>
  );
}
