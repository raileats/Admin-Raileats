// app/admin/layout.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Admin layout (client) — wraps /admin routes (except login).
 * Root app/layout.tsx should still import app/globals.css.
 *
 * Important:
 * - Remove any duplicate header/navigation from individual admin pages.
 * - Ensure your API handler /api/auth/logout accepts POST (or GET) and clears auth cookie/session.
 */

export const metadata = {
  title: "RailEats Admin - Admin Area",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    try {
      // Prefer POST for logout. Adjust if your API expects GET.
      const res = await fetch("/api/auth/logout", { method: "POST" });
      // if API returns JSON with {ok: true} or status 200
      if (!res.ok) {
        console.error("Logout failed", await res.text());
        // still try to redirect to login to avoid locking user out of UI
      }
    } catch (err) {
      console.error("Logout network error", err);
    } finally {
      // Always redirect to login page after logout attempt
      router.replace("/admin");
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
          <Link href="/admin/home">
            <a style={{ fontSize: 14, color: "#111", textDecoration: "none" }}>Dashboard</a>
          </Link>
          <Link href="/admin/orders">
            <a style={{ fontSize: 14, color: "#111", textDecoration: "none" }}>Orders</a>
          </Link>
          <Link href="/admin/restros">
            <a style={{ fontSize: 14, color: "#111", textDecoration: "none" }}>Restro Master</a>
          </Link>
          <Link href="/admin/menu">
            <a style={{ fontSize: 14, color: "#111", textDecoration: "none" }}>Menu</a>
          </Link>
          <Link href="/admin/trains">
            <a style={{ fontSize: 14, color: "#111", textDecoration: "none" }}>Trains</a>
          </Link>
          <Link href="/admin/stations">
            <a style={{ fontSize: 14, color: "#111", textDecoration: "none" }}>Stations</a>
          </Link>
          <Link href="/admin/users">
            <a style={{ fontSize: 14, color: "#111", textDecoration: "none" }}>Users</a>
          </Link>

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
            {/* show admin email (replace with real user data if available) */}
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
    </div>
  );
}
