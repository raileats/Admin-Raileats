// app/admin/restros/new/basic/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";
import NewRestroTabs from "@/components/restro-route-tabs/NewRestroTabs";

type StationRow = {
  StationCode?: string;
  StationName?: string;
  State?: string;
  District?: string;
};

type StationOption = {
  label: string;
  value: string;
  name: string;
  state: string;
};

function stationLabel(station: StationRow) {
  const name = String(station?.StationName ?? "").trim();
  const code = String(station?.StationCode ?? "").trim();
  const state = String(station?.State ?? "").trim();
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`.trim();
}

export default function NewRestroBasicPage() {
  const router = useRouter();
  const stationBoxRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<any>({ IsIrctcApproved: "No", RaileatsStatus: 0 });
  const [stations, setStations] = useState<StationOption[]>([]);
  const [stationQuery, setStationQuery] = useState("");
  const [stationOpen, setStationOpen] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStations() {
      setLoadingStations(true);
      try {
        const res = await fetch("/api/stations", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json) ? json : json?.rows ?? json?.data ?? [];

        const seen = new Set<string>();
        const mapped = rows
          .map((row: StationRow) => {
            const code = String(row?.StationCode ?? "").trim();
            const name = String(row?.StationName ?? "").trim();
            const state = String(row?.State ?? "").trim();
            if (!code || !name || seen.has(code)) return null;
            seen.add(code);
            return { value: code, name, state, label: stationLabel(row) };
          })
          .filter(Boolean) as StationOption[];

        if (mounted) setStations(mapped);
      } catch (error) {
        console.error("Stations fetch error", error);
        if (mounted) setStations([]);
      } finally {
        if (mounted) setLoadingStations(false);
      }
    }

    loadStations();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (stationBoxRef.current && !stationBoxRef.current.contains(event.target as Node)) {
        setStationOpen(false);
      }
    }

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filteredStations = useMemo(() => {
    const q = stationQuery.trim().toLowerCase();
    const list = q
      ? stations.filter(
          (station) =>
            station.label.toLowerCase().includes(q) ||
            station.value.toLowerCase().includes(q) ||
            station.name.toLowerCase().includes(q) ||
            station.state.toLowerCase().includes(q)
        )
      : stations;

    return list.slice(0, 50);
  }, [stationQuery, stations]);

  function updateField(key: string, value: any) {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }

  function selectStation(station: StationOption) {
    setStationQuery(station.label);
    setStationOpen(false);
    setForm((prev: any) => ({
      ...prev,
      StationCode: station.value,
      StationName: station.name,
      State: station.state,
    }));
  }

  function updateStationQuery(value: string) {
    const upperValue = value.toUpperCase();
    setStationQuery(upperValue);
    setStationOpen(true);

    const exact = stations.find((station) => station.value.toUpperCase() === upperValue.trim());
    if (exact) {
      setForm((prev: any) => ({ ...prev, StationCode: exact.value, StationName: exact.name, State: exact.state }));
      return;
    }

    setForm((prev: any) => ({ ...prev, StationCode: upperValue, StationName: "", State: "" }));
  }

  async function saveAndNext() {
    setSaving(true);
    setMsg(null);

    try {
      if (!form.RestroName || !form.StationCode || !form.StationName) {
        throw new Error("RestroName, StationCode and StationName are required");
      }

      const payload = {
        StationCode: form.StationCode || null,
        StationName: form.StationName || null,
        State: form.State || null,
        RestroName: form.RestroName || null,
        BrandNameifAny: form.BrandNameifAny || null,
        OwnerName: form.OwnerName || null,
        OwnerEmail: form.OwnerEmail || null,
        OwnerPhone: form.OwnerPhone || null,
        RestroEmail: form.RestroEmail || null,
        RestroPhone: form.RestroPhone || null,
        IsIrctcApproved: form.IsIrctcApproved || "No",
        RaileatsStatus: Number(form.RaileatsStatus || 0),
        RestroRating: form.RestroRating || null,
        RestroDisplayPhoto: form.RestroDisplayPhoto || null,
      };

      const res = await fetch("/api/restrosmaster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false || data?.error) {
        throw new Error(data?.error || "Create failed");
      }

      const code = data?.RestroCode ?? data?.row?.RestroCode ?? data?.restro_code ?? data?.id;
      if (!code) throw new Error("Restro created but RestroCode not returned");

      localStorage.setItem("new_restro_code", String(code));
      window.dispatchEvent(new Event("new-restro-code-changed"));
      router.push("/admin/restros/new/station-settings");
    } catch (error: any) {
      setMsg(error?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Add New Restro</h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Create restaurant setup step by step</p>
          </div>
          <Link href="/admin/restros"><AdminButton variant="secondary">Close</AdminButton></Link>
        </div>
      </AdminCard>

      <AdminCard>
        <NewRestroTabs />
        <div className="mt-5">
          <AdminCard
            title="Basic Information"
            actions={<AdminButton onClick={saveAndNext} disabled={saving}>{saving ? "Saving..." : "Save & Next"}</AdminButton>}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <AdminField label="Station Code">
                <div ref={stationBoxRef} className="relative">
                  <AdminInput value={stationQuery || form.StationCode || ""} onChange={(event) => updateStationQuery(event.target.value)} onFocus={() => setStationOpen(true)} placeholder="Type station code or name" />
                  {stationOpen && (
                    <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                      {loadingStations ? <div className="px-3 py-2 text-sm text-slate-500">Loading stations...</div> : null}
                      {!loadingStations && filteredStations.length === 0 ? <div className="px-3 py-2 text-sm text-slate-500">No station found</div> : null}
                      {!loadingStations && filteredStations.map((station) => (
                        <button key={station.value} type="button" onClick={() => selectStation(station)} className="block w-full px-3 py-2 text-left text-sm hover:bg-blue-50">
                          <span className="font-semibold text-slate-900">{station.value}</span>
                          <span className="ml-2 text-slate-700">{station.name}</span>
                          {station.state ? <span className="ml-2 text-slate-500">- {station.state}</span> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </AdminField>

              <AdminField label="Station Name"><AdminInput value={form.StationName ?? ""} readOnly /></AdminField>
              <AdminField label="State"><AdminInput value={form.State ?? ""} readOnly /></AdminField>
              <AdminField label="Restro Name"><AdminInput value={form.RestroName ?? ""} onChange={(event) => updateField("RestroName", event.target.value)} /></AdminField>
              <AdminField label="Brand Name"><AdminInput value={form.BrandNameifAny ?? ""} onChange={(event) => updateField("BrandNameifAny", event.target.value)} /></AdminField>
              <AdminField label="Raileats Status"><AdminSelect value={String(form.RaileatsStatus ?? 0)} onChange={(event) => updateField("RaileatsStatus", Number(event.target.value))}><option value="1">On</option><option value="0">Off</option></AdminSelect></AdminField>
              <AdminField label="IRCTC Approved"><AdminSelect value={form.IsIrctcApproved ?? "No"} onChange={(event) => updateField("IsIrctcApproved", event.target.value)}><option>Yes</option><option>No</option></AdminSelect></AdminField>
              <AdminField label="Restro Rating"><AdminInput value={form.RestroRating ?? ""} onChange={(event) => updateField("RestroRating", event.target.value)} /></AdminField>
              <AdminField label="Display Photo"><AdminInput value={form.RestroDisplayPhoto ?? ""} onChange={(event) => updateField("RestroDisplayPhoto", event.target.value)} /></AdminField>
              <AdminField label="Owner Name"><AdminInput value={form.OwnerName ?? ""} onChange={(event) => updateField("OwnerName", event.target.value)} /></AdminField>
              <AdminField label="Owner Email"><AdminInput value={form.OwnerEmail ?? ""} onChange={(event) => updateField("OwnerEmail", event.target.value)} /></AdminField>
              <AdminField label="Owner Phone"><AdminInput value={form.OwnerPhone ?? ""} onChange={(event) => updateField("OwnerPhone", event.target.value)} /></AdminField>
              <AdminField label="Restro Email"><AdminInput value={form.RestroEmail ?? ""} onChange={(event) => updateField("RestroEmail", event.target.value)} /></AdminField>
              <AdminField label="Restro Phone"><AdminInput value={form.RestroPhone ?? ""} onChange={(event) => updateField("RestroPhone", event.target.value)} /></AdminField>
            </div>
            {msg ? <div className="mt-4 text-sm font-semibold text-red-600">{msg}</div> : null}
          </AdminCard>
        </div>
      </AdminCard>
    </div>
  );
}
