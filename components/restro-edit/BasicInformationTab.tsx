// components/restro-edit/BasicInformationTab.tsx
"use client";
import React from "react";
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
            <Toggle
              checked={Boolean(local?.Raileats)}
              onChange={(v: boolean) => updateField("Raileats", v)}
              label={local?.Raileats ? "On" : "Off"}
            />
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

          {/* FSSAI fields removed from Basic Information as requested */}
        </FormRow>
      </div>
    </div>
  );
}
