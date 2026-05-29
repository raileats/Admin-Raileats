// app/admin/restros/new/layout.tsx
import React from "react";
import AdminCard from "@/components/admin/AdminCard";
import NewRestroHeader from "@/components/restro-route-tabs/NewRestroHeader";
import NewRestroTabs from "@/components/restro-route-tabs/NewRestroTabs";

export default function NewRestroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <AdminCard>
        <NewRestroHeader />
      </AdminCard>

      <AdminCard>
        <NewRestroTabs />
        <div className="mt-5">{children}</div>
      </AdminCard>
    </div>
  );
}
