"use client";
import React, { useState } from "react";
import UI from "@/components/AdminUI";
import { createClient } from "@supabase/supabase-js";

const { FormRow, FormField, Toggle } = UI;

// Using PUBLIC keys here (safe for client-side updates in your admin app).
// Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({ local, updateField, stationDisplay }: Props) {
  const [saving, setSaving] = useState(false);

  // actual async update to Supabase
  async function doUpdateStatus(newValue: boolean) {
    const newStatus = newValue ? 1 : 0;
    // update local UI state immediately
    updateField("RaileatsStatus", newStatus);

    try {
      setSaving(true);
      const { error } = await supabase
        .from("RestroMaster")
        .update({ RaileatsStatus: newStatus })
        .eq("RestroCode", local?.RestroCode);

      if (error) {
        // revert local if you want; here we notify and log
        console.error("Failed to update RaileatsStatus:", error.message);
        alert("Failed to update status: " + error.message);
      } else {
        // success - you may show a toast instead of alert
        console.log("RaileatsStatus updated");
      }
    } catch (err) {
      console.error("Unexpected error updating status", err);
      alert("Unexpected error updating status");
    } finally {
      setSaving(false);
    }
  }

  // onChange must return void -> call doUpdateStatus but keep wrapper synchronous
  const handleToggle = (v: boolean) => {
    void doUpdateStatus(v);
  };

  // derive checked state (prefer numeric RaileatsStatus)
  const isActive = Number(local?.RaileatsStatus ?? 0) === 1;

  return (
    <div className="px-4 py-2">
      <h3 className="text-center text-lg font-bold mb-4">Basic Information</h3>

      <div className="max-w-6xl mx-auto bg-white rounded shadow-sm p-6">
        <FormRow cols={3} gap={6}>
          <FormField label="Station">
            <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm">{stationDisplay}</div>
          </FormField>

          <FormField label="Restro Code">
            <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm">{local?.RestroCode ?? "—"}</div>
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
                checked={isActive}
                onChange={handleToggle}
                label={isActive ? "On" : "Off"}
              />
              {saving ? <span className="text-xs text-gray-500">Updating...</span> : null}
            </div>
          </FormField>

          <FormField label="Is IRCTC Approved">
            <select
              value={local?.IsIrctcApproved ? "1" : "0"}
              onChange={(e) => updateField("IsIrctcApproved", e.target.value === "1")}
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
              onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)}
              className="w-full p-2 rounded border border-slate-200"
            />
          </FormField>

          <FormField label="Display Preview">
            {local?.RestroDisplayPhoto ? (
              <img
                src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto}
                alt="display"
                className="h-20 object-cover rounded border"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm">No image</div>
            )}
          </FormField>

          <FormField label="Owner Name">
            <input value={local?.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Owner Email">
            <input value={local?.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Owner Phone">
            <input value={local?.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Restro Email">
            <input value={local?.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Restro Phone">
            <input value={local?.RestroPhone ?? ""} onChange={(e) => updateField("RestroPhone", e.target.value)} className="w-full p-2 rounded border" />
          </FormField>
        </FormRow>
      </div>
    </div>
  );
}
