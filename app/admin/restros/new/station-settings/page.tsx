// app/admin/restros/new/station-settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import StationSettingsClient from "@/components/restro-route-tabs/StationSettingsClient";

function readCachedBasic(code: string) {
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
  const [initialData, setInitialData] = useState<any>(() => readCachedBasic(code) ?? { RestroCode: code });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRestro() {
      setLoading(true);
      try {
        const cached = readCachedBasic(code);
        if (cached && mounted) {
          setInitialData((prev: any) => ({ ...prev, ...cached, RestroCode: code }));
        }

        const res = await fetch(`/api/restrosmaster?t=${Date.now()}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json) ? json : json?.rows ?? json?.data ?? [];
        const row = rows.find((r: any) => String(r?.RestroCode ?? "") === String(code));

        if (mounted && row) {
          const next = { ...(cached ?? {}), ...row, RestroCode: code };
          setInitialData(next);
          localStorage.setItem("new_restro_basic", JSON.stringify(next));
        }
      } catch (error) {
        console.error("New restro station settings load failed", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRestro();
    return () => {
      mounted = false;
    };
  }, [code]);

  return (
    <>
      {loading ? <div className="mb-3 text-sm font-semibold text-slate-500">Loading saved basic details...</div> : null}
      <StationSettingsClient
        mode="new"
        restroCode={code}
        initialData={initialData}
        nextHref="/admin/restros/new/address-docs"
      />
    </>
  );
}

export default function NewStationSettingsPage() {
  return <NewRestroCodeGate>{(code) => <StationSettingsLoader code={code} />}</NewRestroCodeGate>;
}
