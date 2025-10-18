// app/admin/layout.tsx
import React from "react";
import Link from "next/link";
import { getServerClient, serviceClient } from "@/lib/supabaseServer";
import Image from "next/image";

type Props = { children: React.ReactNode };

const navLinkBaseStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  color: "#111",
  textDecoration: "none",
  padding: "6px 8px",
  borderRadius: 6,
};

export default async function AdminLayout({ children }: Props) {
  // server-side: get supabase client that reads cookies
  let currentUser: any = null;
  try {
    const supa = getServerClient();
    const { data: authData } = await supa.auth.getUser();
    const email = authData?.user?.email ?? null;
    if (email) {
      const { data: row } = await serviceClient
        .from("users")
        .select("id, user_id, user_type, name, mobile, photo_url, email")
        .eq("email", email)
        .limit(1)
        .single();
      currentUser = row ?? null;
    }
  } catch (e) {
    console.error("AdminLayout get user error:", e);
    currentUser = null;
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
          <Link href="/admin/home" style={navLinkBaseStyle}>Dashboard</Link>
          <Link href="/admin/orders" style={navLinkBaseStyle}>Orders</Link>
          <Link href="/admin/restros" style={navLinkBaseStyle}>Restro Master</Link>
          <Link href="/admin/menu" style={navLinkBaseStyle}>Menu</Link>
          <Link href="/admin/trains" style={navLinkBaseStyle}>Trains</Link>
          <Link href="/admin/stations" style={navLinkBaseStyle}>Stations</Link>
          <Link href="/admin/users" style={navLinkBaseStyle}>Users</Link>

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
            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>
                    {currentUser.name ?? currentUser.mobile ?? currentUser.email}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <form action="/api/auth/logout" method="post" style={{ margin: 0 }}>
                      <button
                        type="submit"
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
                    </form>
                  </div>
                </div>

                <div>
                  {currentUser.photo_url ? (
                    <img
                      src={currentUser.photo_url}
                      alt="avatar"
                      style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12 }}>{(currentUser.name || "U").charAt(0)}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#111" }}>Not signed in</div>
                <Link href="/admin/login" style={{ fontSize: 12, color: "#0070f3", textDecoration: "underline" }}>Login</Link>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <section style={{ padding: 24, flex: 1 }}>{children}</section>
      </main>
    </div>
  );
}
