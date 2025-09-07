// app/admin/layout.tsx  (server component)
import Link from "next/link";
import { cookies } from "next/headers";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_auth")?.value;

  // not logged in -> render only child (login)
  if (!token) return <>{children}</>;

  // logged in -> full admin layout
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <aside style={{
        width: 260,
        background: "#fff",
        borderRight: "1px solid #e6e8eb",
        padding: 24,
        boxSizing: "border-box"
      }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0 }}>RailEats</h2>
          <small style={{ color: "#6b7280" }}>Admin Panel</small>
        </div>

        <nav>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ marginBottom: 12 }}><Link href="/admin/home">Dashboard</Link></li>
            <li style={{ marginBottom: 12 }}><Link href="/admin/orders">Orders</Link></li>
            <li style={{ marginBottom: 12 }}><Link href="/admin/vendors">Outlets Management</Link></li>
            <li style={{ marginBottom: 12 }}><Link href="/admin/menu">Menu</Link></li>
            <li style={{ marginBottom: 12 }}><Link href="/admin/trains">Trains</Link></li>
            <li style={{ marginBottom: 12 }}><Link href="/admin/stations">Stations</Link></li>
            <li style={{ marginBottom: 12 }}><Link href="/admin/users">Users</Link></li>
            <li style={{ marginTop: 20 }}><Link href="/admin/logout">Logout</Link></li>
          </ul>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: 32 }}>
        {children}
      </main>
    </div>
  );
}
