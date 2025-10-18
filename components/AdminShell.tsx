// components/AdminShell.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Props = { children: React.ReactNode };

export default function AdminShell({ children }: Props) {
  const pathname = usePathname() || "";

  // Paths where we DON'T want to show admin chrome
  const hideFor = ["/admin/login", "/admin/login/"];
  const hide = hideFor.some((p) => pathname === p || pathname.startsWith(p));

  if (hide) {
    // On login page: render children only (no sidebar/topbar)
    return <>{children}</>;
  }

  // Otherwise show full admin shell
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafafa" }}>
      {/* Sidebar */}
      <aside
        aria-label="Admin sidebar"
        style={{
          width: 96,
          background: "#ffffff",
          borderRight: "1px solid #eee",
          paddingTop: 20,
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <img src="/logo.png" alt="RailEats logo" style={{ width: 48, height: 48 }} />
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 14, paddingLeft: 12 }}>
          <Link href="/admin/home" style={{ display: "block", fontSize: 14, color: "#111", textDecoration: "none", padding: "6px 8px", borderRadius: 6 }}>
            Dashboard
          </Link>
          <Link href="/admin/orders" style={{ display: "block", fontSize: 14, color: "#111", textDecoration: "none", padding: "6px 8px", borderRadius: 6 }}>
            Orders
          </Link>
          <Link href="/admin/restros" style={{ display: "block", fontSize: 14, color: "#111", textDecoration: "none", padding: "6px 8px", borderRadius: 6 }}>
            Restro Master
          </Link>
          <Link href="/admin/menu" style={{ display: "block", fontSize: 14, color: "#111", textDecoration: "none", padding: "6px 8px", borderRadius: 6 }}>
            Menu
          </Link>
          <Link href="/admin/trains" style={{ display: "block", fontSize: 14, color: "#111", textDecoration: "none", padding: "6px 8px", borderRadius: 6 }}>
            Trains
          </Link>
          <Link href="/admin/stations" style={{ display: "block", fontSize: 14, color: "#111", textDecoration: "none", padding: "6px 8px", borderRadius: 6 }}>
            Stations
          </Link>
          <Link href="/admin/users" style={{ display: "block", fontSize: 14, color: "#111", textDecoration: "none", padding: "6px 8px", borderRadius: 6 }}>
            Users
          </Link>

          <div style={{ marginTop: 20 }}>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                aria-label="Logout"
                style={{
                  width: "72px",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main area */}
      <main style={{ flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            paddingLeft: 20,
            paddingRight: 24,
            gap: 12,
            borderBottom: "1px solid #f0f0f0",
            background: "#fff",
          }}
        >
          <img src="/logo.png" alt="logo small" style={{ width: 28, height: 28 }} />
          <div style={{ fontWeight: 700, fontSize: 18 }}>RailEats Admin</div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            {/* This client component doesn't fetch user server-side; keep minimal */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "#111" }}>Not signed in</div>
              <Link href="/admin/login" style={{ fontSize: 12, color: "#0070f3", textDecoration: "underline" }}>
                Login
              </Link>
            </div>
          </div>
        </header>

        <section style={{ padding: 24, flex: 1 }}>{children}</section>
      </main>
    </div>
  );
}
