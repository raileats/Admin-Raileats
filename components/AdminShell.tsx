"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

type Props = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: Props) {
  const pathname = usePathname() || "";

  /**
   * Routes (or prefixes) where we want to HIDE the admin chrome (sidebar/topbar).
   * Add other public auth routes here if needed (e.g. "/admin/forgot", "/admin/reset", etc).
   */
  const hideAdminShellFor = ["/admin/login", "/admin/login/"];
  const shouldHideShell = hideAdminShellFor.some((p) =>
    pathname === p || pathname.startsWith(p)
  );

  if (shouldHideShell) {
    // Render children directly (no sidebar/topbar) for login route
    return <>{children}</>;
  }

  // Full admin shell (sidebar + topbar + content)
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r shadow-sm">
        <div className="p-4 flex items-center gap-3 border-b">
          <div className="w-10 h-10 relative">
            {/* Update src if your logo path differs */}
            <Image src="/logo.png" alt="RailEats" fill sizes="40px" />
          </div>
          <div className="text-sm font-semibold">RailEats Admin</div>
        </div>

        <nav className="p-3">
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Link href="/admin" className="block px-3 py-2 rounded hover:bg-gray-100">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/orders" className="block px-3 py-2 rounded hover:bg-gray-100">
                Orders
              </Link>
            </li>
            <li>
              <Link href="/admin/restros" className="block px-3 py-2 rounded hover:bg-gray-100">
                Restro Master
              </Link>
            </li>
            <li>
              <Link href="/admin/menu" className="block px-3 py-2 rounded hover:bg-gray-100">
                Menu
              </Link>
            </li>
            <li>
              <Link href="/admin/trains" className="block px-3 py-2 rounded hover:bg-gray-100">
                Trains
              </Link>
            </li>
            <li>
              <Link href="/admin/stations" className="block px-3 py-2 rounded hover:bg-gray-100">
                Stations
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="block px-3 py-2 rounded hover:bg-gray-100">
                Users
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-14 bg-white border-b px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              aria-label="Toggle sidebar"
              className="p-2 rounded hover:bg-gray-100 hidden"
            >
              {/* If you have a hamburger icon, put here */}
              ☰
            </button>
            <div className="text-sm font-medium">RailEats Admin</div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {/* Example right-side area: you probably render signed-in user here */}
            <div>Not signed in</div>
            <Link href="/admin/login" className="text-xs underline">
              Login
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
