// app/admin/layout.tsx  (DEV temporary)
import dynamic from "next/dynamic";
import React from "react";

// dynamically import client shell (no SSR)
const AdminShell = dynamic(() => import("../../components/AdminShell"), { ssr: false });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // ALWAYS render AdminShell (temporary for dev/testing)
  return <AdminShell>{children}</AdminShell>;
}
