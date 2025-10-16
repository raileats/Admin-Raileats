"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/admin" || pathname === "/admin/login";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout failed", err);
    } finally {
      router.replace("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            {/* Constrain logo size strictly so it never grows huge */}
            <img
              src="/logo.png"
              alt="Raileats"
              style={{ width: 40, height: 40, objectFit: "contain" }}
              className="w-10 h-10"
            />
            <span className="font-semibold hidden sm:inline">RailEats Admin</span>
          </Link>
        </div>

        <div>
          {!isLoginPage && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">ops@raileats.in</span>
              <button
                onClick={handleLogout}
                className="text-sm underline text-blue-600"
                title="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        {!isLoginPage && (
          <aside className="w-56 bg-white border-r min-h-[calc(100vh-64px)] p-4">
            <nav className="space-y-3">
              <Link href="/admin/home" className="block p-2 rounded hover:bg-gray-100">Dashboard</Link>
              <Link href="/admin/orders" className="block p-2 rounded hover:bg-gray-100">Orders</Link>
              <Link href="/admin/restros" className="block p-2 rounded hover:bg-gray-100">Restro Master</Link>
              <Link href="/admin/menu" className="block p-2 rounded hover:bg-gray-100">Menu</Link>
              <Link href="/admin/trains" className="block p-2 rounded hover:bg-gray-100">Trains</Link>
              <Link href="/admin/stations" className="block p-2 rounded hover:bg-gray-100">Stations</Link>
              <Link href="/admin/users" className="block p-2 rounded hover:bg-gray-100">Users</Link>
              <button onClick={handleLogout} className="w-full mt-4 p-2 border rounded text-left">Logout</button>
            </nav>
          </aside>
        )}

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
