// app/admin/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Admin layout (client). Shows sidebar + header.
 * Header now fetches /api/admin/me to display logged-in user's name & photo.
 */

type MeUser = {
  id?: string;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  user_type?: string | null;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      setLoadingMe(true);
      try {
        const res = await fetch("/api/admin/me");
        if (!res.ok) {
          // if 401, not signed in
          if (res.status === 401) {
            if (mounted) setMe(null);
            return;
          }
          // otherwise try parse message
        }
        const j = await res.json().catch(() => ({}));
        if (mounted) setMe(j?.user ?? null);
      } catch (err) {
        console.error("Failed to fetch /api/admin/me:", err);
        if (mounted) setMe(null);
      } finally {
        if (mounted) setLoadingMe(false);
      }
    }
    loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      // call your logout API to clear cookies
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("logout error", e);
    } finally {
      // redirect to login
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
            {/* If still loading show placeholder */}
            {loadingMe ? (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#111" }}>Loading...</div>
              </div>
            ) : me ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>
                    {me.name ?? me.email}
                  </div>
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

                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {me.photo_url ? (
                    // show provided photo url
                    // NOTE: if this is an object URL or requires CORS, ensure Supabase public URL is used
                    <img
                      src={me.photo_url}
                      alt={me.name ?? "avatar"}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {me.name ? me.name.split(" ").map(s=>s[0]).slice(0,2).join("") : "U"}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#111" }}>Not signed in</div>
                <Link href="/admin/login" style={{ fontSize: 12, color: "#0070f3" }}>
                  Login
                </Link>
              </div>
            )}
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
