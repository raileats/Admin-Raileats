// app/admin/login/layout.tsx
import React from "react";

export const metadata = {
  title: "Admin Login - RailEats",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-6">
        <img src="/logo.png" alt="RailEats" className="h-11 w-11 rounded-md object-contain" />
        <div>
          <div className="text-lg font-bold text-slate-950">RailEats</div>
          <div className="text-xs font-medium text-slate-500">Admin access</div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
