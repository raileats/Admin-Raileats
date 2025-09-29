'use client';
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React from "react";

export default function Sidebar() {
  const pathname = usePathname() || '';

  const linkStyleBase: React.CSSProperties = {
    color: "#000",
    textDecoration: "none",
    display: "block",
    padding: "8px 6px",
    borderRadius: 6,
  };

  const liStyle: React.CSSProperties = { marginBottom: 12 };

  function isActive(href: string) {
    // mark active when current path starts with the href (so /admin/restros/123 also highlights)
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      style={{
        width: 240,
        padding: 20,
        background: "#fff",
        color: "#000",
        minHeight: "100vh",
        borderRight: "1px solid #e6e8eb",
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
          src="/logo.png"
          alt="RailEats"
          width={40}
          height={40}
          style={{
            borderRadius: "50%",
            background: "#F6C800",
            padding: "4px",
          }}
        />
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "bold", lineHeight: 1 }}>
          <span style={{ color: "#F6C800" }}>Rail</span>
          <span style={{ color: "#000" }}>Eats</span>
        </h3>
      </div>

      {/* Sidebar Menu */}
      <nav>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={liStyle}>
            <Link href="/admin/home" style={{ ...linkStyleBase, background: isActive("/admin/home") ? "#f2f4f6" : "transparent" }}>
              Home
            </Link>
          </li>

          <li style={liStyle}>
            <Link href="/admin/orders" style={{ ...linkStyleBase, background: isActive("/admin/orders") ? "#f2f4f6" : "transparent" }}>
              Orders
            </Link>
          </li>

          {/* Outlets link */}
          <li style={liStyle}>
            <Link href="/admin/vendors" style={{ ...linkStyleBase, background: isActive("/admin/vendors") ? "#f2f4f6" : "transparent" }}>
              Outlets
            </Link>
          </li>

          {/* NEW: Restro Master — placed right below Outlets and above Menu */}
          <li style={liStyle}>
            <Link href="/admin/restros" style={{ ...linkStyleBase, background: isActive("/admin/restros") ? "#f2f4f6" : "transparent", fontWeight: 600 }}>
              Restro Master
            </Link>
          </li>

          <li style={liStyle}>
            <Link href="/admin/menu" style={{ ...linkStyleBase, background: isActive("/admin/menu") ? "#f2f4f6" : "transparent" }}>
              Menu
            </Link>
          </li>

          <li style={liStyle}>
            <Link href="/admin/trains" style={{ ...linkStyleBase, background: isActive("/admin/trains") ? "#f2f4f6" : "transparent" }}>
              Trains
            </Link>
          </li>

          <li style={liStyle}>
            <Link href="/admin/stations" style={{ ...linkStyleBase, background: isActive("/admin/stations") ? "#f2f4f6" : "transparent" }}>
              Stations
            </Link>
          </li>

          <li style={liStyle}>
            <Link href="/admin/users" style={{ ...linkStyleBase, background: isActive("/admin/users") ? "#f2f4f6" : "transparent" }}>
              Users
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
