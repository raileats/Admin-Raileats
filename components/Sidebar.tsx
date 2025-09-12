// components/Sidebar.tsx
import Link from "next/link";
import Image from "next/image";

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        padding: 20,
        background: "#000", // black sidebar background
        color: "#fff", // default white text
        minHeight: "100vh",
      }}
    >
      {/* Logo + RailEats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "24px",
        }}
      >
        <Image
          src="/logo.png" // public/logo.png
          alt="RailEats"
          width={40}
          height={40}
          style={{
            borderRadius: "50%",
            background: "#F6C800", // yellow bubble
            padding: "4px",
          }}
        />
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "bold",
            lineHeight: 1,
          }}
        >
          <span style={{ color: "#F6C800" }}>Rail</span>
          <span style={{ color: "#fff" }}>Eats</span>
        </h3>
      </div>

      {/* Sidebar Menu */}
      <nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ marginBottom: 12 }}>
            <Link href="/admin/home" style={{ color: "#fff", textDecoration: "none" }}>
              Home
            </Link>
          </li>
          <li style={{ marginBottom: 12 }}>
            <Link href="/admin/orders" style={{ color: "#fff", textDecoration: "none" }}>
              Orders
            </Link>
          </li>
          <li style={{ marginBottom: 12 }}>
            <Link href="/admin/menu" style={{ color: "#fff", textDecoration: "none" }}>
              Menu
            </Link>
          </li>
          <li style={{ marginBottom: 12 }}>
            <Link href="/admin/trains" style={{ color: "#fff", textDecoration: "none" }}>
              Trains
            </Link>
          </li>
          <li style={{ marginBottom: 12 }}>
            <Link href="/admin/stations" style={{ color: "#fff", textDecoration: "none" }}>
              Stations
            </Link>
          </li>
          <li style={{ marginBottom: 12 }}>
            <Link href="/admin/users" style={{ color: "#fff", textDecoration: "none" }}>
              Users
            </Link>
          </li>
          <li style={{ marginBottom: 12 }}>
            <Link href="/admin/vendors" style={{ color: "#fff", textDecoration: "none" }}>
              Vendors
            </Link>
          </li>
          <li style={{ marginTop: 20 }}>
            <Link href="/admin/logout" style={{ color: "red", fontWeight: "bold", textDecoration: "none" }}>
              Logout
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
