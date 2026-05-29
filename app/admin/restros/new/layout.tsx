// app/admin/restros/new/layout.tsx
import React from "react";
import Link from "next/link";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import Tabs from "@/components/ui/Tabs";

const tabs = [
  { label: "Basic Information", href: "./basic" },
  { label: "Station Settings", href: "./station-settings" },
  { label: "Address & Documents", href: "./address-docs" },
  { label: "Contacts", href: "./contacts" },
  { label: "Bank", href: "./bank" },
  { label: "Future Closed", href: "./future-closed" },
  { label: "Menu", href: "./menu" },
  { label: "Restro User & Password", href: "./restro-user-password" },
];

export default function NewRestroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Add New Restro</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Create restaurant setup step by step</p>
          </div>
          <Link href="/admin/restros">
            <AdminButton variant="secondary">Close</AdminButton>
          </Link>
        </div>
      </AdminCard>
      <AdminCard>
        <Tabs tabs={tabs} />
        <div className="mt-5">{children}</div>
      </AdminCard>
    </div>
  );
}
