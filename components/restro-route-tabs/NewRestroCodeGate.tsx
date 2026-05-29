// components/restro-route-tabs/NewRestroCodeGate.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";

export default function NewRestroCodeGate({ children }: { children: (code: string) => React.ReactNode }) {
  const [code, setCode] = useState("");

  useEffect(() => {
    try {
      setCode(localStorage.getItem("new_restro_code") || "");
    } catch {
      setCode("");
    }
  }, []);

  if (!code) {
    return (
      <AdminCard title="Restro code missing">
        <p className="text-sm font-semibold text-red-600">Please save Basic Information first, then continue this tab.</p>
      </AdminCard>
    );
  }

  return <>{children(code)}</>;
}
