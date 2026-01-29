"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Toggle } = UI;

type StationRow = {
  id: number;
  station_name: string;
  station_code: string;
  state?: string;
};

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
};

export default function BasicInformationTab({
  local,
  updateField,
}: Props) {
  /* ---------------- Station Search (LIVE) ---------------- */
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [stations, setStations] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* preload selected station */
  useEffect(() => {
    if (local?.StationName && local?.StationCode) {
      setQuery(
        `${local.StationName} (${local.StationCode})${
          local.State ? ` - ${local.State}` : ""
        }`
      );
    }
  }, [local?.StationName, local?.StationCode, local?.State]);

  /* close dropdown on outside click */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* live search */
  useEffect(() => {
    if (!query || query.length < 2) {
      setStations([]);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/stations/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        setStations(Array.isArray(j?.rows) ? j.rows : []);
      })
      .catch(() => {
        if (active) setStations([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  function handleSelectStation(st: StationRow) {
    setQuery(
      `${st.station_name} (${st.station_code})${
        st.state ? ` - ${st.state}` : ""
      }`
    );
    setOpen(false);

    updateField("StationName", st.station_name);
    updateField("StationCode", st.station_code);
    updateField("State", st.state ?? "");
    updateField("station_id", st.id);
  }

  /* ---------------- Raileats Status (UNCHANGED) ---------------- */
  const isActive = Number(local?.RaileatsStatus ?? 0) === 1;
  const [savingStatus, setSavingStatus] = useState(false);

  async function toggleStatus(value: boolean) {
    const newStatus = value ? 1 : 0;
    const prev = local?.RaileatsStatus;

    updateField("RaileatsStatus", newStatus);

    try {
      setSavingStatus(true);
      const code = local?.RestroCode;
      if (!code) return;

      const res = await fetch(
        `/api/admin/restros/${encodeURIComponent(code)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raileatsStatus: newStatus }),
        }
      );

      if (!res.ok) {
        updateField("RaileatsStatus", prev ?? 0);
        alert("Failed to update Raileats status");
      }
    } catch {
      updateField("RaileatsStatus", prev ?? 0);
    } finally {
      setSavingStatus(false);
    }
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="px-6 py-4">
      <h3 className="text-center text-xl font-semibold mb-6">
        Basic Information
      </h3>

      <div className="max-w-6xl mx-auto bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-10">

        {/* ===== RESTRO DETAILS ===== */}
        <section>
          <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-4">
            Restaurant Details
          </h4>

          <FormRow cols={3} gap={6}>
            <FormField label="Station" required>
              <div ref={wrapperRef} className="relative">
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  placeholder="Search station name or code"
                  className="w-full h-11 px-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-sky-200"
                />

                {open && (
                  <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
                    {loading && (
                      <div className="p-3 text-sm text-gray-500">
                        Searching…
                      </div>
                    )}

                    {!loading && stations.length === 0 && (
                      <div className="p-3 text-sm text-gray-400">
                        No stations found
                      </div>
                    )}

                    {!loading &&
                      stations.map((st) => (
                        <div
                          key={st.id}
                          onClick={() => handleSelectStation(st)}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-sky-50"
                        >
                          <div className="font-medium">
                            {st.station_name} ({st.station_code})
                          </div>
                          {st.state && (
                            <div className="text-xs text-slate-500">
                              {st.state}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField label="Restro Code">
              <div className="h-11 flex items-center px-3 rounded-md bg-slate-50 border text-sm text-slate-600">
                {local?.RestroCode ?? "Auto Generated"}
              </div>
            </FormField>

            <FormField label="Restro Name" required>
              <input
                value={local?.RestroName ?? ""}
                onChange={(e) => updateField("RestroName", e.target.value)}
                className="w-full h-11 px-3 rounded-md border"
              />
            </FormField>

            <FormField label="Brand Name">
              <input
                value={local?.BrandName ?? ""}
                onChange={(e) => updateField("BrandName", e.target.value)}
                className="w-full h-11 px-3 rounded-md border"
              />
            </FormField>
          </FormRow>
        </section>

        {/* ===== STATUS & APPROVAL ===== */}
        <section>
          <h4 className="text-xs font-semibold tracking-wide text-slate-500 uppercase mb-4">
            Status & Approval
          </h4>

          <FormRow cols={3} gap={6}>
            <FormField label="Raileats Status">
              <div className="flex items-center gap-4">
                <Toggle
                  checked={isActive}
                  onChange={toggleStatus}
                  label={isActive ? "On" : "Off"}
                />
                {savingStatus && (
                  <span className="text-xs text-gray-400">Updating…</span>
                )}
              </div>
            </FormField>

            <FormField label="IRCTC Approved">
              <select
                value={local?.IsIrctcApproved ? "1" : "0"}
                onChange={(e) =>
                  updateField("IsIrctcApproved", e.target.value === "1")
                }
                className="w-full h-11 px-3 rounded-md border"
              >
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </FormField>

            <FormField label="Restro Rating">
              <input
                type="number"
                step="0.1"
                value={local?.RestroRating ?? ""}
                onChange={(e) =>
                  updateField("RestroRating", e.target.value)
                }
                className="w-full h-11 px-3 rounded-md border"
              />
            </FormField>
          </FormRow>
        </section>
      </div>
    </div>
  );
}
