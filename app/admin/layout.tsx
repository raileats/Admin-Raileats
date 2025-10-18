// app/admin/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

type Profile = {
  name?: string | null;
  photo_url?: string | null;
  email?: string | null;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      setLoadingProfile(true);
      try {
        // get auth user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          if (mounted) setProfile(null);
          return;
        }

        // prefer reading from your users table (so admin name/photo stored there are used)
        const email = authUser.email ?? null;
        if (email) {
          const { data, error } = await supabase
            .from("users")
            .select("name, photo_url, email")
            .eq("email", email)
            .limit(1)
            .single();

          if (!error && data) {
            if (mounted) setProfile({ name: data.name ?? undefined, photo_url: data.photo_url ?? undefined, email: data.email ?? undefined });
            return;
          }
        }

        // fallback: try to use auth user's metadata if present
        const fallbackName = (authUser.user_metadata && (authUser.user_metadata.name || authUser.user_metadata.full_name)) || authUser.email;
        if (mounted) {
          setProfile({
            name: fallbackName ?? undefined,
            photo_url: (authUser.user_metadata && authUser.user_metadata.avatar_url) ?? undefined,
            email: authUser.email ?? undefined,
          });
        }
      } catch (e) {
        console.error("Failed to fetch profile:", e);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    }
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout network error:", err);
    } finally {
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
            {/* Profile area */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* photo or initial */}
              {loadingProfile ? (
                <div style={{ width: 40, height: 40, borderRadius: 20, background: "#f0f0f0" }} />
              ) : profile ? (
                <>
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt="profile"
                      style={{ width: 40, height: 40, borderRadius: 999, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        background: "#e6e6e6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        color: "#333",
                      }}
                    >
                      {(profile.name && profile.name[0]?.toUpperCase()) || "U"}
                    </div>
                  )}

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "#111" }}>{profile.name ?? profile.email ?? "User"}</div>
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
                </>
              ) : (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "#111" }}>Not signed in</div>
                  <button
                    onClick={() => router.push("/admin/login")}
                    style={{
                      fontSize: 12,
                      color: "#0070f3",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    Login
                  </button>
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
