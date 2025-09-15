// components/AdminLayout.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Home, ShoppingCart, Users, Settings, Bell, Moon, Sun, MoreHorizontal } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("raileats-theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (dark) root.classList.add("dark");
      else root.classList.remove("dark");
      localStorage.setItem("raileats-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  return (
    <div className="min-h-screen flex bg-[var(--bg)] dark:bg-[#071018] text-[var(--text)]">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-[#03141a] border-r border-slate-100 dark:border-[#042027] p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-amber-400 flex items-center justify-center font-bold text-black">R</div>
          <div>
            <div className="text-lg font-semibold">Raileats Admin</div>
            <div className="text-xs text-slate-400">Orders & Operations</div>
          </div>
        </div>

        <nav className="space-y-1">
          <a href="/admin" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#041827]">
            <Home size={18}/> <span className="font-medium">Dashboard</span>
          </a>
          <a href="/admin/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#041827]">
            <ShoppingCart size={18}/> <span className="font-medium">Orders</span>
          </a>
          <a href="/admin/menu" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#041827]">
            <Home size={18}/> <span className="font-medium">Menu</span>
          </a>
          <a href="/admin/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#041827]">
            <Users size={18}/> <span className="font-medium">Users</span>
          </a>
          <a href="/admin/vendors" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-[#041827]">
            <Settings size={18}/> <span className="font-medium">Settings</span>
          </a>
        </nav>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-[#042026]">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/40" alt="admin" className="w-10 h-10 rounded-full"/>
            <div>
              <div className="font-medium">Admin Name</div>
              <div className="text-xs text-slate-400">ops@raileats.in</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="p-4 border-b border-slate-100 dark:border-[#05121a] bg-transparent">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="text-lg font-semibold">Admin Panel</div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-[#04121a]"><Bell size={18}/></button>
              <div className="w-8 h-8 rounded-full overflow-hidden"><img alt="avatar" src="https://i.pravatar.cc/40" /></div>
              <button onClick={() => setDark(!dark)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-[#04121a]">
                {dark ? <Sun size={16}/> : <Moon size={16}/>}
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
