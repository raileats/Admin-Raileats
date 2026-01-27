"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/admin/AuthGuard";
import { AdminUserProvider } from "@/components/admin/AdminUserContext"; // ✅ ADD

type User = {
  id?: string;
  user_id?: string;
  user_type?: string;
  name?: string | null;
  mobile?: string | null;
  photo_url?: string | null;
  email?: string | null;
} | null;

type Props = {
  children: React.ReactNode;
  currentUser?: User;
  requireAuth?: boolean;
};

export default function AdminShell({
  children,
  currentUser,
  requireAuth = true,
}: Props) {
  const pathname = usePathname() || "";

  // Paths where we DON'T want to show admin chrome
  const hideFor = ["/admin/login", "/admin/login/"];
  const hide = hideFor.some((p) => pathname === p || pathname.startsWith(p));

  const logoutLinkStyle: React.CSSProperties = {
    display: "inline-block",
    width: "72px",
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    textDecoration: "none",
    color: "#111",
    textAlign: "center",
    fontSize: 14,
  };

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      try {
        window.location.replace("/admin/login");
      } catch {
        window.location.href = "/admin/login";
      }
    }
  };

  if (hide) {
    return <>{children}</>;
  }

  const shell = (
    // ✅ HERE IS THE MAGIC
    <AdminUserProvider user={currentUser ?? null}>
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
            <Link href="/admin/home">Dashboard</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/restros">Restro Master</Link>
            <Link href="/admin/menu">Menu</Link>
            <Link href="/admin/trains">Trains</Link>
            <Link href="/admin/stations">Stations</Link>
            <Link href="/admin/users">Users</Link>

            <div style={{ marginTop: 20 }}>
              <a
                href="#logout"
                onClick={handleLogout}
                style={logoutLinkStyle}
                role="button"
              >
                Logout
              </a>
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
              {currentUser ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {currentUser.name ?? currentUser.mobile ?? currentUser.email}
                    </div>
                    <a
                      href="#logout"
                      onClick={handleLogout}
                      style={{ fontSize: 12, color: "#0070f3" }}
                    >
                      Logout
                    </a>
                  </div>

                  {currentUser.photo_url ? (
                    <img
                      src={currentUser.photo_url}
                      alt="avatar"
                      style={{ width: 36, height: 36, borderRadius: 999 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {(currentUser.name || "U").charAt(0)}
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/admin/login">Login</Link>
              )}
            </div>
          </header>

          <section style={{ padding: 24, flex: 1 }}>{children}</section>
        </main>
      </div>
    </AdminUserProvider>
  );

  return requireAuth ? <AuthGuard>{shell}</AuthGuard> : shell;
}
