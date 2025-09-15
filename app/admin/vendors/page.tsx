// app/admin/vendors/page.tsx (server component)
import dynamic from "next/dynamic";
import React from "react";

// correct relative path from this file to components folder
const VendorsAdminShell = dynamic(() => import("../../../components/VendorsAdminShell"), { ssr: false });

export const metadata = {
  title: "Admin • Vendors",
};

export default function AdminVendorsPage() {
  return (
    <div style={{ minHeight: "80vh" }}>
      <VendorsAdminShell />
    </div>
  );
}
