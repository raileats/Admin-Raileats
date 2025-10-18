// app/admin/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Client admin layout — wraps /admin routes (except the login page).
 *
 * Notes:
 * - Don't export `metadata` from a client component (causes Next.js build error).
 * - Root app/layout.tsx should import globals.css (keep that as-is).
 * - /api/auth/logout should accept POST and clear auth cookie/session.
 */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      // call API route to clear session/cookies
      // prefer POST for logout
      const res = await fetch("/api/auth/logout", { method: "POST" });
      // you can examine res.ok or returned JSON if needed
      if (!res.ok) {
        console.warn("Logout API responded with non-OK status:", res.status);
      }
    } catch (err) {
      console.error("Logout network error:", err);
    } finally {
      // redirect to login page after logout attempt
      // (use /admin/login to show the admin login screen)
      router.replace("/admin/login");
    }
  }

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
          <Link href="/admin/home" className="admin-nav-link">Dashboard</Link>
          <Link href="/admin/orders" className="admin-nav-link">Orders</Link>
          <Link href="/admin/restros" className="admin-nav-link">Restro Master</Link>
          <Link href="/admin/menu" className="admin-nav-link">Menu</Link>
          <Link href="/admin/trains" className="admin-nav-link">Trains</Link>
          <Link href="/admin/stations" className="admin-nav-link">Stations</Link>
          <Link href="/admin/users" className="admin-nav-link">Users</Link>

          <div style={{ marginTop: 20 }}>
            <button
              onClick={handleLogout}
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
          </div>
        </nav>
      </aside>

      {/* Main area */}
      <main style={{ flex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Top header */}
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
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "#111" }}>ops@raileats.in</div>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: 12,
                  color: "#0070f3",
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <section style={{ padding: 24, flex: 1 }}>{children}</section>
      </main>

      <style jsx>{`
        .admin-nav-link {
          display: block;
          font-size: 14px;
          color: #111;
          text-decoration: none;
          padding: 4px 8px;
        }
        .admin-nav-link:hover {
          background: #f5f5f5;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
