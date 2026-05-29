// app/admin/restros/new/station-settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import AdminCard from "@/components/admin/AdminCard";
import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import StationSettingsClient from "@/components/restro-route-tabs/StationSettingsClient";

function readBasicFromStorage(code: string) {
  try {
    const raw = localStorage.getItem("new_restro_basic");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (String(parsed?.RestroCode ?? "") !== String(code)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function StationSettingsLoader({ code }: { code: string }) {
  const [restro, setRestro] = useState<any>(() => readBasicFromStorage(code) ?? { RestroCode: code });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const cached = readBasicFromStorage(code);
      if (cached && mounted) {
        setRestro((prev: any) => ({ ...prev, ...cached }));
      }

      setLoading(true);
      try {
        // /api/restrosmaster?q=CODE can miss numeric RestroCode on some schemas, so load list and match exactly.
        const res = await fetch(`/api/restrosmaster?t=${Date.now()}`, { cache: "no-store" });
        const json = await res.json().catch(() => []);
        const rows = Array.isArray(json) ? json : json?.rows ?? json?.data ?? [];
        const found = rows.find((row: any) => String(row?.RestroCode ?? "") === String(code));

        if (found && mounted) {
          const merged = { ...(cached ?? {}), ...found, RestroCode: code };
          setRestro(merged);
          try {
            localStorage.setItem("new_restro_basic", JSON.stringify(merged));
          } catch {}
        } else if (cached && mounted) {
          setRestro({ ...cached, RestroCode: code });
        }
      } catch {
        if (cached && mounted) {
          setRestro({ ...cached, RestroCode: code });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [code]);

  if (loading && !restro?.StationCode && !restro?.StationName) {
    return (
      <AdminCard title="Station Settings">
        <p className="text-sm font-semibold text-slate-500">Loading station settings...</p>
      </AdminCard>
    );
  }

  return <StationSettingsClient initialData={restro ?? { RestroCode: code }} restroCode={code} mode="new" />;
}

export default function NewStationSettingsPage() {
  return <NewRestroCodeGate>{(code) => <StationSettingsLoader code={code} />}</NewRestroCodeGate>;
}
