"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Toggle } = UI;

type StationOption = {
  label: string;
  value: string; // StationCode
};

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stations?: StationOption[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({
  local,
  updateField,
  stations = [],
  loadingStations = false,
}: Props) {
  /* ---------------- Station Search Dropdown ---------------- */
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // when station already selected (edit mode), show it in input
  useEffect(() => {
    if (local?.StationName && local?.StationCode) {
      const label = `${local.StationName} (${local.StationCode})${local.State ? ` - ${local.State}` : ""}`;
      setQuery(label);
    }
  }, [local?.StationName, local?.StationCode, local?.State]);

  // close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStations = useMemo(() => {
    if (!query) return stations;
    const q = query.toLowerCase();
    return stations.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.value.toLowerCase().includes(q)
    );
  }, [query, stations]);

  function handleSelectStation(opt: StationOption) {
    // label format already: Station Name (CODE) - STATE
    setQuery(opt.label);
    setOpen(false);

    // extract values safely
    const match = opt.label.match(/^(.*?)\s*\((.*?)\)\s*(?:-\s*(.*))?$/);

    updateField("StationName", match?.[1]?.trim() ?? "");
    updateField("StationCode", opt.value);
    updateField("State", match?.[3]?.trim() ?? "");
  }

  /* ---------------- Raileats Status ---------------- */
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
    <div className="px-4 py-2">
      <h3 className="text-center text-lg font-bold mb-4">Basic Information</h3>

      <div className="max-w-6xl mx-auto bg-white rounded shadow-sm p-6">
        <FormRow cols={3} gap={6}>
          {/* STATION SEARCH DROPDOWN */}
          <FormField label="Station" required>
            <div ref={wrapperRef} className="relative">
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Type station name or code"
                className="w-full p-2 rounded border border-slate-200"
              />

              {open && (
                <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded border bg-white shadow">
                  {loadingStations && (
                    <div className="p-2 text-sm text-gray-500">
                      Loading stations…
                    </div>
                  )}

                  {!loadingStations && filteredStations.length === 0 && (
                    <div className="p-2 text-sm text-gray-500">
                      No station found
                    </div>
                  )}

                  {!loadingStations &&
                    filteredStations.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => handleSelectStation(opt)}
                        className="cursor-pointer px-3 py-2 text-sm hover:bg-sky-50"
                      >
                        {opt.label}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </FormField>

          {/* RESTRO CODE */}
          <FormField label="Restro Code">
            <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm">
              {local?.RestroCode ?? "—"}
            </div>
          </FormField>

          {/* RESTRO NAME */}
          <FormField label="Restro Name" required>
            <input
              value={local?.RestroName ?? ""}
              onChange={(e) => updateField("RestroName", e.target.value)}
              className="w-full p-2 rounded border border-slate-200"
            />
          </FormField>

          <FormField label="Brand Name">
            <input
              value={local?.BrandName ?? ""}
              onChange={(e) => updateField("BrandName", e.target.value)}
              className="w-full p-2 rounded border border-slate-200"
            />
          </FormField>

          <FormField label="Raileats Status">
            <div className="flex items-center gap-3">
              <Toggle
                checked={isActive}
                onChange={(v) => toggleStatus(v)}
                label={isActive ? "On" : "Off"}
              />
              {savingStatus && (
                <span className="text-xs text-gray-500">Updating…</span>
              )}
            </div>
          </FormField>

          <FormField label="Is IRCTC Approved">
            <select
              value={local?.IsIrctcApproved ? "1" : "0"}
              onChange={(e) =>
                updateField("IsIrctcApproved", e.target.value === "1")
              }
              className="w-full p-2 rounded border border-slate-200"
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
              onChange={(e) => updateField("RestroRating", e.target.value)}
              className="w-full p-2 rounded border border-slate-200"
            />
          </FormField>

          <FormField label="Restro Display Photo (path)">
            <input
              value={local?.RestroDisplayPhoto ?? ""}
              onChange={(e) =>
                updateField("RestroDisplayPhoto", e.target.value)
              }
              className="w-full p-2 rounded border border-slate-200"
            />
          </FormField>

          <FormField label="Display Preview">
            {local?.RestroDisplayPhoto ? (
              <img
                src={
                  (process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") +
                  local.RestroDisplayPhoto
                }
                className="h-20 rounded border object-cover"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            ) : (
              <div className="rounded border bg-slate-50 p-2 text-sm">
                No image
              </div>
            )}
          </FormField>

          <FormField label="Owner Name">
            <input
              value={local?.OwnerName ?? ""}
              onChange={(e) => updateField("OwnerName", e.target.value)}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Owner Email">
            <input
              value={local?.OwnerEmail ?? ""}
              onChange={(e) => updateField("OwnerEmail", e.target.value)}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Owner Phone">
            <input
              value={local?.OwnerPhone ?? ""}
              onChange={(e) => updateField("OwnerPhone", e.target.value)}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Restro Email">
            <input
              value={local?.RestroEmail ?? ""}
              onChange={(e) => updateField("RestroEmail", e.target.value)}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Restro Phone">
            <input
              value={local?.RestroPhone ?? ""}
              onChange={(e) => updateField("RestroPhone", e.target.value)}
              className="w-full p-2 rounded border"
            />
          </FormField>
        </FormRow>
      </div>
    </div>
  );
}
