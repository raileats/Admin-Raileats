// components/Sidebar.tsx
import Link from "next/link";
import Image from "next/image";

export default function Sidebar() {
  return (
    <aside style={{ width: 240, padding: 20 }}>
      {/* Logo + Title same as raileats.in */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <Image
          src="/logo.png"   // <-- /public/logo.png me rakho
          alt="RailEats"
          width={40}
          height={40}
          style={{ borderRadius: "50%" }}
        />
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", lineHeight: 1 }}>
          <span style={{ color: "#F6C800" }}>Rail</span>
          <span style={{ color: "#000" }}>Eats</span>
        </h3>
      </div>

      {/* Navigation same as pehle tha */}
      <nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 10 }}>
            <Link href="/admin/home">Home</Link>
          </li>
          <li style={{ marginBottom: 10 }}>
            <Link href="/admin/orders">Orders</Link>
          </li>
          <li style={{ marginBottom: 10 }}>
            <Link href="/admin/menu">Menu</Link>
          </li>
          <li style={{ marginBottom: 10 }}>
            <Link href="/admin/trains">Trains</Link>
          </li>
          <li style={{ marginBottom: 10 }}>
            <Link href="/admin/stations">Stations</Link>
          </li>
          <li style={{ marginBottom: 10 }}>
            <Link href="/admin/users">Users</Link>
          </li>
          <li style={{ marginBottom: 10 }}>
            <Link href="/admin/vendors">Vendors</Link>
          </li>
          <li style={{ marginTop: 18 }}>
            <Link href="/admin/logout">Logout</Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
