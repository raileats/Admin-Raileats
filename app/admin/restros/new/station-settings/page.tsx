// app/admin/restros/new/station-settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import StationSettingsClient from "@/components/restro-route-tabs/StationSettingsClient";

function StationSettingsLoader({ code }: { code: string }) {
  const [restro, setRestro] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/restrosmaster?q=${encodeURIComponent(code)}`, { cache: "no-store" });
        const json = await res.json().catch(() => []);
        const rows = Array.isArray(json) ? json : json?.rows ?? json?.data ?? [];
        const found = rows.find((row: any) => String(row.RestroCode) === String(code)) ?? rows[0] ?? { RestroCode: code };
        if (mounted) setRestro(found);
      } catch {
        if (mounted) setRestro({ RestroCode: code });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [code]);

  if (loading) {
    return <AdminCard title="Station Settings"><p className="text-sm font-semibold text-slate-500">Loading station settings...</p></AdminCard>;
  }

  return <StationSettingsClient initialData={restro ?? { RestroCode: code }} restroCode={code} mode="new" />;
}

export default function NewStationSettingsPage() {
  return <NewRestroCodeGate>{(code) => <StationSettingsLoader code={code} />}</NewRestroCodeGate>;
}
