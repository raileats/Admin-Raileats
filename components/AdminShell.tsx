"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthGuard from "@/components/admin/AuthGuard";

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

  // pages without chrome
  const hideFor = ["/admin/login"];
  const hide = hideFor.some(
    (p) => pathname === p || pathname.startsWith(p)
  );

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
      window.location.replace("/admin/login");
    }
  };

  if (hide) {
    return <>{children}</>;
  }

  const shell = (
    <div className="flex min-h-screen bg-slate-50">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-64 shrink-0 border-r bg-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <img src="/logo.png" alt="RailEats" className="h-8 w-8" />
          <div>
            <div className="font-semibold">RailEats Admin</div>
            <div className="text-xs text-gray-500">Operations</div>
          </div>
        </div>

        <nav className="px-4 py-4 space-y-1 text-sm">
          <SidebarLink href="/admin/home" label="Dashboard" />
          <SidebarLink href="/admin/orders" label="Orders" />
          <SidebarLink href="/admin/restros" label="Restro Master" />
          <SidebarLink href="/admin/menu" label="Menu" />
          <SidebarLink href="/admin/trains" label="Trains" />
          <SidebarLink href="/admin/stations" label="Stations" />
          <SidebarLink href="/admin/users" label="Users" />

          <div className="pt-4 mt-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="flex flex-1 flex-col">
        {/* TOP BAR */}
        <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
          <div className="font-semibold text-lg">Admin Panel</div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {currentUser.name ??
                      currentUser.mobile ??
                      currentUser.email}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-blue-600 underline"
                  >
                    Logout
                  </button>
                </div>

                {currentUser.photo_url ? (
                  <img
                    src={currentUser.photo_url}
                    alt="avatar"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    {(currentUser.name || "U")[0]}
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/admin/login"
                className="text-sm text-blue-600 underline"
              >
                Login
              </Link>
            )}
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );

  return requireAuth ? <AuthGuard>{shell}</AuthGuard> : shell;
}

/* ===== SMALL HELPER ===== */
function SidebarLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 hover:bg-slate-100 text-gray-800"
    >
      {label}
    </Link>
  );
}
