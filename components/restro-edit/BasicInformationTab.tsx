"use client";

import React, { useMemo, useState } from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Toggle } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({
  local,
  updateField,
  stationDisplay,
  stations = [],
  loadingStations = false,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [stationSearch, setStationSearch] = useState("");

  // helpers
  const getIsActive = () => Number(local?.RaileatsStatus ?? 0) === 1;

  // searchable station list
  const filteredStations = useMemo(() => {
    if (!stationSearch) return stations;
    const q = stationSearch.toLowerCase();
    return stations.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.value.toLowerCase().includes(q)
    );
  }, [stationSearch, stations]);

  function onSelectStation(code: string) {
    const st = stations.find((s) => s.value === code);
    if (!st) return;

    // label format: "Ambala Cant Jn (UMB) - Haryana"
    const match = st.label.match(/^(.*)\s+\((.*)\)\s+-\s+(.*)$/);

    updateField("StationCode", code);
    updateField("StationName", match ? match[1] : "");
    updateField("State", match ? match[3] : "");
  }

  // call server API to set RaileatsStatus (0 or 1)
  async function doToggleStatus(newValue: boolean) {
    const newStatus = newValue ? 1 : 0;

    const prev = local?.RaileatsStatus;
    updateField("RaileatsStatus", newStatus);

    try {
      setSaving(true);
      const code = local?.RestroCode;
      if (!code) throw new Error("RestroCode missing");

      const resp = await fetch(
        `/api/admin/restros/${encodeURIComponent(code)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raileatsStatus: newStatus }),
        }
      );

      const json = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        updateField("RaileatsStatus", prev ?? 0);
        alert("Status update failed: " + (json?.error || "Unknown error"));
      }
    } catch {
      updateField("RaileatsStatus", prev ?? 0);
      alert("Unexpected error updating status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 py-2">
      <h3 className="text-center text-lg font-bold mb-4">Basic Information</h3>

      <div className="max-w-6xl mx-auto bg-white rounded shadow-sm p-6">
        <FormRow cols={3} gap={6}>
          {/* STATION SEARCH + SELECT */}
          <FormField label="Station">
            <input
              placeholder="Type station name or code"
              value={stationSearch}
              onChange={(e) => setStationSearch(e.target.value)}
              className="w-full mb-2 p-2 rounded border border-slate-200"
            />

            <select
              value={local?.StationCode ?? ""}
              onChange={(e) => onSelectStation(e.target.value)}
              className="w-full p-2 rounded border border-slate-200"
              disabled={loadingStations}
            >
              <option value="">
                {loadingStations ? "Loading stations..." : "Select station"}
              </option>
              {filteredStations.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {local?.StationCode && (
              <div className="mt-2 rounded border border-slate-100 bg-slate-50 p-2 text-sm">
                {stationDisplay}
              </div>
            )}
          </FormField>

          <FormField label="Restro Code">
            <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm">
              {local?.RestroCode ?? "—"}
            </div>
          </FormField>

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
                checked={getIsActive()}
                onChange={(v: boolean) => void doToggleStatus(v)}
                label={getIsActive() ? "On" : "Off"}
              />
              {saving && (
                <span className="text-xs text-gray-500">Updating...</span>
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
                alt="display"
                className="h-20 object-cover rounded border"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            ) : (
              <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm">
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
