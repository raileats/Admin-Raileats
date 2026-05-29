// components/restro-route-tabs/NewRestroCodeGate.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminCard from "@/components/admin/AdminCard";

function readCode() {
  try {
    return localStorage.getItem("new_restro_code") || "";
  } catch {
    return "";
  }
}

export default function NewRestroCodeGate({ children }: { children: (code: string) => React.ReactNode }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const current = readCode();
    setCode(current);
    setChecked(true);
    if (!current) {
      router.replace("/admin/restros/new/basic");
    }
  }, [router]);

  if (!checked) {
    return (
      <AdminCard title="Loading">
        <p className="text-sm font-semibold text-slate-500">Checking new RestroCode...</p>
      </AdminCard>
    );
  }

  if (!code) {
    return (
      <AdminCard title="Basic Information required">
        <p className="text-sm font-semibold text-amber-700">Please save Basic Information first.</p>
      </AdminCard>
    );
  }

  return <>{children(code)}</>;
}
