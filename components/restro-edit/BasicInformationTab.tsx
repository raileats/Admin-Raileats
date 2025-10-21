"use client";
import React, { useState } from "react";
import UI from "@/components/AdminUI";
const { FormRow, FormField, Toggle } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({ local, updateField, stationDisplay }: Props) {
  const [saving, setSaving] = useState(false);

  const isActive = Number(local?.RaileatsStatus ?? 0) === 1;

  // wrapper that calls server API
  const doToggle = async (newValue: boolean) => {
    const newStatus = newValue ? 1 : 0;
    // optimistic UI update
    updateField("RaileatsStatus", newStatus);

    try {
      setSaving(true);
      const code = local?.RestroCode;
      if (!code) throw new Error("RestroCode missing");

      const resp = await fetch(`/api/admin/restros/${encodeURIComponent(code)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raileatsStatus: newStatus }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        console.error("status update failed", json);
        // revert UI if failed
        updateField("RaileatsStatus", newStatus ? 0 : 1);
        alert("Failed to update status: " + (json?.error || resp.statusText));
      } else {
        // success
        console.log("RaileatsStatus updated on server", json);
      }
    } catch (e: any) {
      console.error("toggle error", e);
      updateField("RaileatsStatus", newValue ? 0 : 1);
      alert("Unexpected error updating status");
    } finally {
      setSaving(false);
    }
  };

  // onChange wrapper for Toggle: keep sync return
  const handleToggle = (v: boolean) => {
    void doToggle(v);
  };

  return (
    <div className="px-4 py-2">
      <h3 className="text-center text-lg font-bold mb-4">Basic Information</h3>
      <div className="max-w-6xl mx-auto bg-white rounded shadow-sm p-6">
        <FormRow cols={3} gap={6}>
          {/* ... other fields unchanged ... */}
          <FormField label="Raileats Status">
            <div className="flex items-center gap-3">
              <Toggle checked={isActive} onChange={handleToggle} label={isActive ? "On" : "Off"} />
              {saving && <span className="text-xs text-gray-500">Updating...</span>}
            </div>
          </FormField>
          {/* ... rest fields ... */}
        </FormRow>
      </div>
    </div>
  );
}
