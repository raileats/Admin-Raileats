// app/admin/restros/new/basic/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type StationRow = { StationCode?: string; StationName?: string; State?: string; District?: string };
type StationOption = { label: string; value: string; name: string; state: string };

const DEFAULT_FORM = {
  IsIrctcApproved: "",
  IsPureVeg: "",
  RaileatsStatus: "",
};

function stationLabel(station: StationRow) {
  
  const name = String(station?.StationName ?? "").trim();
  const code = String(station?.StationCode ?? "").trim();
  const state = String(station?.State ?? "").trim();
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`.trim();
}

function phoneDigits(value: any) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

export default function NewRestroBasicPage() {
  const router = useRouter();
  const stationBoxRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<any>(DEFAULT_FORM);
  const [stations, setStations] = useState<StationOption[]>([]);
  const [stationQuery, setStationQuery] = useState("");
  const [stationOpen, setStationOpen] = useState(false);
  const [loadingStations, setLoadingStations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("new_restro_basic");
      if (!saved) return;

      const parsed = JSON.parse(saved);
      setForm((prev: any) => ({
        ...prev,
        ...parsed,
        IsIrctcApproved: parsed.IsIrctcApproved ?? "",
        IsPureVeg: parsed.IsPureVeg ?? "",
        RaileatsStatus: parsed.RaileatsStatus ?? "",
      }));

      const code = String(parsed?.StationCode ?? "").trim();
      const name = String(parsed?.StationName ?? "").trim();
      const state = String(parsed?.State ?? "").trim();
      if (code || name || state) {
        setStationQuery(`${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`.trim());
      }
    } catch (error) {
      console.error("Failed to load new restro basic draft", error);
    }
  }, []);

  useEffect(() => {
  let mounted = true;

  async function loadStations() {
    setLoadingStations(true);

    try {
      const { data, error } = await supabase
        .from("Stations")
        .select("StationCode, StationName, State, District")
        .order("StationName", { ascending: true })
        .limit(5000);

      if (error) throw error;

      const seen = new Set<string>();
      const mapped = (data || [])
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
      if (stationBoxRef.current && !stationBoxRef.current.contains(event.target as Node)) setStationOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filteredStations = useMemo(() => {
    const q = stationQuery.trim().toLowerCase();
    const list = q ? stations.filter((s) => s.label.toLowerCase().includes(q) || s.value.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.state.toLowerCase().includes(q)) : stations;
    return list.slice(0, 8500);
  }, [stationQuery, stations]);

  function updateField(key: string, value: any) { setForm((prev: any) => ({ ...prev, [key]: value })); }

  function selectStation(station: StationOption) {
    setStationQuery(station.label);
    setStationOpen(false);
    setForm((prev: any) => ({ ...prev, StationCode: station.value, StationName: station.name, State: station.state }));
  }

  function updateStationQuery(value: string) {
    const upperValue = value.toUpperCase();
    setStationQuery(upperValue);
    setStationOpen(true);
    const exact = stations.find((s) => s.value.toUpperCase() === upperValue.trim());
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
      if (!form.RestroName || !form.StationCode || !form.StationName) throw new Error("RestroName, StationCode and StationName are required");
      const payload = {
        StationCode: form.StationCode || null,
        StationName: form.StationName || null,
        State: form.State || null,
        RestroName: form.RestroName || null,
        BrandNameifAny: form.BrandNameifAny || null,
        OwnerName: form.OwnerName || null,
        OwnerEmail: form.OwnerEmail || null,
        OwnerPhone: phoneDigits(form.OwnerPhone) || null,
        RestroEmail: form.RestroEmail || null,
        RestroPhone: phoneDigits(form.RestroPhone) || null,
        IsIrctcApproved: form.IsIrctcApproved || null,
        RaileatsStatus: form.RaileatsStatus === "" ? null : Number(form.RaileatsStatus),
        RestroRating: form.RestroRating || null,
        IsPureVeg: form.IsPureVeg === "" ? null : Number(form.IsPureVeg),
        RestroDisplayPhoto: form.RestroDisplayPhoto || null,
      };

      const existingCode =
        form.RestroCode ||
        (() => {
          try {
            return localStorage.getItem("new_restro_code") || "";
          } catch {
            return "";
          }
        })();

      const res = existingCode
        ? await fetch(`/api/restros/${encodeURIComponent(String(existingCode))}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/restrosmaster", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false || data?.error) throw new Error(data?.error || "Create failed");
      const code = existingCode || data?.RestroCode || data?.row?.RestroCode || data?.restro_code || data?.id;
      if (!code) throw new Error("Restro created but RestroCode not returned");
            localStorage.setItem("new_restro_code", String(code));
      localStorage.setItem("new_restro_basic", JSON.stringify({
        ...payload,
        ...(data?.row ?? data),
        RestroCode: code,
        StationCode: data?.row?.StationCode ?? data?.StationCode ?? payload.StationCode,
        StationName: data?.row?.StationName ?? data?.StationName ?? payload.StationName,
        State: data?.row?.State ?? data?.State ?? payload.State,
        IsIrctcApproved: data?.row?.IsIrctcApproved ?? data?.IsIrctcApproved ?? payload.IsIrctcApproved,
        RaileatsStatus: data?.row?.RaileatsStatus ?? data?.RaileatsStatus ?? payload.RaileatsStatus,
        IsPureVeg: data?.row?.IsPureVeg ?? data?.IsPureVeg ?? payload.IsPureVeg,
      }));
      window.dispatchEvent(new Event("new-restro-code-changed"));
      router.push("/admin/restros/new/station-settings");
    } catch (error: any) {
      setMsg(error?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard title="Basic Information" actions={<AdminButton onClick={saveAndNext} disabled={saving}>{saving ? "Saving..." : "Save & Next"}</AdminButton>}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminField label="Station Code">
          <div ref={stationBoxRef} className="relative">
            <AdminInput value={stationQuery || form.StationCode || ""} onChange={(e) => updateStationQuery(e.target.value)} onFocus={() => setStationOpen(true)} placeholder="Type station code or name" />
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
        <AdminField label="Restro Name"><AdminInput value={form.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} /></AdminField>
        <AdminField label="Brand Name"><AdminInput value={form.BrandNameifAny ?? ""} onChange={(e) => updateField("BrandNameifAny", e.target.value)} /></AdminField>
        <AdminField label="Raileats Status"><AdminSelect value={String(form.RaileatsStatus ?? "")} onChange={(e) => updateField("RaileatsStatus", e.target.value === "" ? "" : Number(e.target.value))}><option value="">-- Select --</option><option value="1">On</option><option value="0">Off</option></AdminSelect></AdminField>
        <AdminField label="IRCTC Approved"><AdminSelect value={form.IsIrctcApproved ?? ""} onChange={(e) => updateField("IsIrctcApproved", e.target.value)}><option value="">-- Select --</option><option value="Yes">Yes</option><option value="No">No</option></AdminSelect></AdminField>
        <AdminField label="Restro Rating"><AdminInput value={form.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} /></AdminField>
        <AdminField label="Pure Veg"><AdminSelect value={String(form.IsPureVeg ?? "")} onChange={(e) => updateField("IsPureVeg", e.target.value === "" ? "" : Number(e.target.value))}><option value="">-- Select --</option><option value="1">Yes</option><option value="0">No</option></AdminSelect></AdminField>
        <AdminField label="Display Photo"><AdminInput value={form.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} /></AdminField>
        <AdminField label="Owner Name"><AdminInput value={form.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} /></AdminField>
        <AdminField label="Owner Email"><AdminInput value={form.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} /></AdminField>
        <AdminField label="Owner Phone"><AdminInput inputMode="numeric" maxLength={10} value={phoneDigits(form.OwnerPhone)} onChange={(e) => updateField("OwnerPhone", phoneDigits(e.target.value))} /></AdminField>
        <AdminField label="Restro Email"><AdminInput value={form.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} /></AdminField>
        <AdminField label="Restro Phone"><AdminInput inputMode="numeric" maxLength={10} value={phoneDigits(form.RestroPhone)} onChange={(e) => updateField("RestroPhone", phoneDigits(e.target.value))} /></AdminField>
      </div>
      {msg ? <div className="mt-4 text-sm font-semibold text-red-600">{msg}</div> : null}
    </AdminCard>
  );
}
