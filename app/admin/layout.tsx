// app/admin/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Client admin layout — wraps /admin routes.
 *
 * This version fetches /api/admin/me on mount to show:
 * - logged in user's name and photo at top-right
 * - Logout button which calls /api/auth/logout
 */

type MeUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  mobile?: string | null;
  user_type?: string | null;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      setLoadingMe(true);
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        if (!mounted) return;
        if (!res.ok) {
          setMe(null);
        } else {
          const j = await res.json().catch(() => ({}));
          // Expecting API: { ok: true, user: {...} } or { user: {...} } or direct user
          const user = j?.user ?? (j?.ok ? j?.data ?? null : null) ?? null;
          setMe(user);
        }
      } catch (err) {
        console.error("Failed to load /api/admin/me", err);
        setMe(null);
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
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      // ignore body, just redirect to login
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setLoggingOut(false);
      // ensure client navigates to login page
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
            {/* User area */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* show name + photo if logged in */}
              {loadingMe ? (
                <div style={{ fontSize: 13, color: "#666" }}>Loading…</div>
              ) : me ? (
                <>
                  <div style={{ textAlign: "right", minWidth: 120 }}>
                    <div style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>
                      {me.name ?? me.email ?? me.mobile ?? "User"}
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      style={{
                        fontSize: 12,
                        color: "#0070f3",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        marginTop: 2,
                      }}
                    >
                      {loggingOut ? "Logging out…" : "Logout"}
                    </button>
                  </div>

                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#eee",
                      border: "1px solid #f0f0f0",
                    }}
                    aria-hidden
                  >
                    {me.photo_url ? (
                      <img
                        src={me.photo_url}
                        alt={me.name ?? "avatar"}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700, color: "#555" }}>
                        {(me.name ?? me.email ?? "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                // not signed in UI
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "#111" }}>Not signed in</div>
                  <Link
                    href="/admin/login"
                    style={{
                      fontSize: 12,
                      color: "#0070f3",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Login
                  </Link>
                </div>
              )}
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
