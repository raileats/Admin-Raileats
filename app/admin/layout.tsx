// app/admin/layout.tsx  (server component)
import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import React from "react";

// dynamically import client shell (no SSR)
const AdminShell = dynamic(() => import("../../components/AdminShell"), { ssr: false });

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_auth")?.value;

  // not logged in -> render only child (login)
  if (!token) return <>{children}</>;

  // logged in -> render client AdminShell and pass children
  return <AdminShell>{children}</AdminShell>;
}
