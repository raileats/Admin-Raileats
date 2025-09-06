// app/admin/layout.tsx
import Link from "next/link";
import "./admin-globals.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
          <aside style={{
            width: 240,
            background: "#fff",
            borderRight: "1px solid #e6e8eb",
            padding: 20,
            boxSizing: "border-box"
          }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: 0 }}>RailEats</h2>
              <small style={{ color: "#6b7280" }}>Admin Panel</small>
            </div>

            <nav>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 10 }}><Link href="/admin/home">Home</Link></li>
                <li style={{ marginBottom: 10 }}><Link href="/admin/orders">Orders</Link></li>
                <li style={{ marginBottom: 10 }}><Link href="/admin/menu">Menu</Link></li>
                <li style={{ marginBottom: 10 }}><Link href="/admin/trains">Trains</Link></li>
                <li style={{ marginBottom: 10 }}><Link href="/admin/stations">Stations</Link></li>
                <li style={{ marginBottom: 10 }}><Link href="/admin/users">Users</Link></li>
                <li style={{ marginBottom: 10 }}><Link href="/admin/vendors">Vendors</Link></li>
                <li style={{ marginTop: 18 }}><Link href="/admin/logout">Logout</Link></li>
              </ul>
            </nav>
          </aside>

          <main style={{ flex: 1, padding: 24 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
