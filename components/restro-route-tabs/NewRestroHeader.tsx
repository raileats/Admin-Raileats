// components/restro-route-tabs/NewRestroHeader.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";

function readBasic() {
  try {
    const code = localStorage.getItem("new_restro_code") || "";
    const raw = localStorage.getItem("new_restro_basic");
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...parsed, RestroCode: parsed?.RestroCode ?? code };
  } catch {
    return {};
  }
}

function stationLine(data: any) {
  const name = String(data?.StationName ?? "").trim();
  const code = String(data?.StationCode ?? "").trim();
  const state = String(data?.State ?? "").trim();
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`.trim();
}

export default function NewRestroHeader() {
  const pathname = usePathname();
  const [data, setData] = useState<any>({});
  const isBasicPage = pathname === "/admin/restros/new/basic" || pathname === "/admin/restros/new";

  useEffect(() => {
    function refresh() {
      setData(readBasic());
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("new-restro-code-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("new-restro-code-changed", refresh);
    };
  }, []);

  const title = useMemo(() => {
    if (isBasicPage) return "Add New Restro";
    const code = String(data?.RestroCode ?? "").trim();
    const name = String(data?.RestroName ?? "").trim();
    if (code && name) return `${code} / ${name}`;
    if (code) return `${code} / Add New Restro`;
    return "Add New Restro";
  }, [data, isBasicPage]);

  const subtitle = isBasicPage
    ? "Create restaurant setup step by step"
    : stationLine(data) || "Create restaurant setup step by step";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-1 text-sm font-semibold text-slate-600">{subtitle}</p>
      </div>
      <Link href="/admin/restros">
        <AdminButton variant="secondary">Close</AdminButton>
      </Link>
    </div>
  );
}
