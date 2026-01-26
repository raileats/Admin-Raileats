"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Toggle } = UI;

type StationOption = {
  label: string;
  value: string;
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
  /* ---------------- Station Search ---------------- */
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (local?.StationName && local?.StationCode) {
      setQuery(
        `${local.StationName} (${local.StationCode})${
          local.State ? ` - ${local.State}` : ""
        }`
      );
    }
  }, [local?.StationName, local?.StationCode, local?.State]);

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
    setQuery(opt.label);
    setOpen(false);

    const match = opt.label.match(/^(.*?)\s*\((.*?)\)\s*(?:-\s*(.*))?$/);
    updateField("StationName", match?.[1]?.trim() ?? "");
    updateField("StationCode", opt.value);
    updateField("State", match?.[3]?.trim() ?? "");
  }

  /* ---------------- Raileats Status ---------------- */
  const isActive = Number(local?.RaileatsStatus ?? 0) === 1;
  const [savingStatus, setSavingStatus] = useState(false);

  async function toggleStatus(v: boolean) {
    const newStatus = v ? 1 : 0;
    const prev = local?.RaileatsStatus;

    updateField("RaileatsStatus", newStatus);

    try {
      setSavingStatus(true);
      if (!local?.RestroCode) return;

      const res = await fetch(
        `/api/admin/restros/${encodeURIComponent(local.RestroCode)}/status`,
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

      <div className="max-w-6xl mx-auto bg-white rounded-xl border shadow-sm p-8 space-y-8">
        {/* SECTION 1 */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-4 uppercase">
            Restaurant Details
          </h4>

          <FormRow cols={3} gap={6}>
            {/* Station */}
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
                  className="w-full p-2.5 rounded-md border border-slate-200 focus:ring-2 focus:ring-sky-200"
                />

                {open && (
                  <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-white shadow-lg">
                    {loadingStations && (
                      <div className="p-3 text-sm text-gray-500">
                        Loading stations…
                      </div>
                    )}

                    {!loadingStations &&
                      filteredStations.map((opt) => (
                        <div
                          key={opt.value}
                          onClick={() => handleSelectStation(opt)}
                          className="px-3 py-2 cursor-pointer text-sm hover:bg-sky-50"
                        >
                          {opt.label}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </FormField>

            {/* Restro Code */}
            <FormField label="Restro Code">
              <div className="h-[42px] flex items-center px-3 rounded-md bg-slate-50 border text-sm text-slate-600">
                {local?.RestroCode ?? "Auto Generated"}
              </div>
            </FormField>

            {/* Restro Name */}
            <FormField label="Restro Name" required>
              <input
                value={local?.RestroName ?? ""}
                onChange={(e) => updateField("RestroName", e.target.value)}
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>
          </FormRow>
        </div>

        {/* SECTION 2 */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-4 uppercase">
            Status & Rating
          </h4>

          <FormRow cols={3} gap={6}>
            <FormField label="Brand Name">
              <input
                value={local?.BrandName ?? ""}
                onChange={(e) => updateField("BrandName", e.target.value)}
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>

            <FormField label="Raileats Status">
              <div className="flex items-center gap-3">
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

            <FormField label="Is IRCTC Approved">
              <select
                value={local?.IsIrctcApproved ? "1" : "0"}
                onChange={(e) =>
                  updateField("IsIrctcApproved", e.target.value === "1")
                }
                className="w-full p-2.5 rounded-md border"
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
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>
          </FormRow>
        </div>

        {/* SECTION 3 */}
        <div>
          <h4 className="text-sm font-semibold text-slate-600 mb-4 uppercase">
            Contact & Media
          </h4>

          <FormRow cols={3} gap={6}>
            <FormField label="Display Photo Path">
              <input
                value={local?.RestroDisplayPhoto ?? ""}
                onChange={(e) =>
                  updateField("RestroDisplayPhoto", e.target.value)
                }
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>

            <FormField label="Preview">
              {local?.RestroDisplayPhoto ? (
                <img
                  src={
                    (process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") +
                    local.RestroDisplayPhoto
                  }
                  className="h-20 rounded-md border object-cover"
                />
              ) : (
                <div className="h-20 flex items-center justify-center text-sm bg-slate-50 rounded-md border">
                  No Image
                </div>
              )}
            </FormField>

            <div />

            <FormField label="Owner Name">
              <input
                value={local?.OwnerName ?? ""}
                onChange={(e) => updateField("OwnerName", e.target.value)}
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>

            <FormField label="Owner Email">
              <input
                value={local?.OwnerEmail ?? ""}
                onChange={(e) => updateField("OwnerEmail", e.target.value)}
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>

            <FormField label="Owner Phone">
              <input
                value={local?.OwnerPhone ?? ""}
                onChange={(e) => updateField("OwnerPhone", e.target.value)}
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>

            <FormField label="Restro Email">
              <input
                value={local?.RestroEmail ?? ""}
                onChange={(e) => updateField("RestroEmail", e.target.value)}
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>

            <FormField label="Restro Phone">
              <input
                value={local?.RestroPhone ?? ""}
                onChange={(e) => updateField("RestroPhone", e.target.value)}
                className="w-full p-2.5 rounded-md border"
              />
            </FormField>
          </FormRow>
        </div>
      </div>
    </div>
  );
}
