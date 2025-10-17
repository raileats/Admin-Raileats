// app/admin/layout.tsx
import React from "react";
import Link from "next/link";
import "./globals.css";
import { cookies } from "next/headers";

export const metadata = {
  title: "RailEats Admin",
};

/**
 * IMPORTANT:
 * - This layout decides whether to render the admin sidebar/header
 *   based on presence of an auth cookie.
 * - If your auth cookie name is different, add it into COOKIE_NAMES below.
 */

const COOKIE_NAMES = [
  "auth_token",                 // common custom name
  "next-auth.session-token",    // next-auth
  "sb:token",                   // example supabase (older)
  "supabase-auth-token",        // example supabase
  "raileats_auth",              // possible custom
];

function hasAuthCookie() {
  const ck = cookies();
  for (const name of COOKIE_NAMES) {
    if (ck.get(name)) return true;
  }
  // fallback: if any cookie exists at all, assume logged in (optional)
  // return ck.getAll().length > 0;
  return false;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const loggedIn = hasAuthCookie();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar: only render when logged in */}
      {loggedIn ? (
        <aside className="hidden md:block" style={{ width: 88, background: "#fff", borderRight: "1px solid #eee", paddingTop: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <img src="/logo.png" alt="logo" style={{ width: 44, height: 44 }} />
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 18, paddingLeft: 12 }}>
            <Link href="/admin/home"><div style={{ fontSize: 14 }}>Dashboard</div></Link>
            <Link href="/admin/orders"><div style={{ fontSize: 14 }}>Orders</div></Link>
            <Link href="/admin/restros"><div style={{ fontSize: 14 }}>Restro Master</div></Link>
            <Link href="/admin/menu"><div style={{ fontSize: 14 }}>Menu</div></Link>
            <Link href="/admin/trains"><div style={{ fontSize: 14 }}>Trains</div></Link>
            <Link href="/admin/stations"><div style={{ fontSize: 14 }}>Stations</div></Link>
            <Link href="/admin/users"><div style={{ fontSize: 14 }}>Users</div></Link>

            <div style={{ marginTop: 20 }}>
              <Link href="/api/auth/logout">
                <button style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd" }}>Logout</button>
              </Link>
            </div>
          </nav>
        </aside>
      ) : null}

      {/* Main */}
      <main style={{ flex: 1, background: "#fafafa", minHeight: "100vh" }}>
        {/* Top header: compact and always present, but minimal if not logged in */}
        <header style={{ height: 64, display: "flex", alignItems: "center", paddingLeft: 20, gap: 12, background: "#fff", borderBottom: "1px solid #eee" }}>
          <img src="/logo-small.png" alt="logo small" style={{ width: 32, height: 32 }} />
          <div style={{ fontWeight: 700 }}>RailEats Admin</div>

          <div style={{ marginLeft: "auto", paddingRight: 24, textAlign: "right" }}>
            {loggedIn ? (
              // when logged in show email + top logout
              <>
                <div style={{ fontSize: 13, color: "#111" }}>ops@raileats.in</div>
                <Link href="/api/auth/logout"><small>Logout</small></Link>
              </>
            ) : (
              // when not logged in show a small link to public site
              <Link href="/" style={{ color: "#666" }}>Back to public site</Link>
            )}
          </div>
        </header>

        <section style={{ padding: 24 }}>
          {children}
        </section>
      </main>
    </div>
  );
}
