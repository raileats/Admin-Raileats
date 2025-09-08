// app/admin/page.tsx  (server component)
import dynamic from "next/dynamic";
import React from "react";

// NOTE: correct relative path from app/admin/page.tsx -> components/VendorsAdminShell.jsx
const VendorsAdminShell = dynamic(() => import("../../components/VendorsAdminShell"), { ssr: false });

export const metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-2xl font-semibold mb-4">Admin</h1>
      <VendorsAdminShell />
    </div>
  );
}
