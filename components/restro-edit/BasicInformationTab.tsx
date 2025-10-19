// components/restro-edit/BasicInformationTab.tsx
import React from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Select, Toggle } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({ local, updateField, stationDisplay }: Props) {
  const imagePrefix = process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "";

  return (
    <div style={{ maxWidth: 1200, margin: "8px auto", padding: 8 }}>
      <h3 style={{ textAlign: "center", marginTop: 0, fontSize: 18, fontWeight: 700 }}>
        Basic Information
      </h3>

      <div style={{ marginTop: 12 }}>
        <FormRow cols={3} gap={16} className="basic-info-row">
          <FormField label="Station">
            <div style={{ padding: 8, borderRadius: 6, background: "#fafafa", border: "1px solid #f0f0f0" }}>
              {stationDisplay || "—"}
            </div>
          </FormField>

          <FormField label="Restro Code">
            <div style={{ padding: 8, borderRadius: 6, background: "#fafafa", border: "1px solid #f0f0f0" }}>
              {local?.RestroCode ?? "—"}
            </div>
          </FormField>

          <FormField label="Restro Name" required>
            <input
              value={local?.RestroName ?? ""}
              onChange={(e) => updateField("RestroName", e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid #e3e3e3",
                fontSize: 14,
              }}
            />
          </FormField>

          <FormField label="Brand Name">
            <input
              value={local?.BrandName ?? ""}
              onChange={(e) => updateField("BrandName", e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Raileats Status">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Toggle
                checked={!!local?.Raileats}
                onChange={(v: boolean) => updateField("Raileats", v)}
                label={local?.Raileats ? "On" : "Off"}
              />
            </div>
          </FormField>

          <FormField label="Is IRCTC Approved">
            <Select
              value={local?.IsIrctcApproved ? "1" : "0"}
              onChange={(v: string) => updateField("IsIrctcApproved", v === "1")}
              options={[
                { label: "Yes", value: "1" },
                { label: "No", value: "0" },
              ]}
              name="is_irctc"
            />
          </FormField>

          <FormField label="Restro Rating">
            <input
              type="number"
              step="0.1"
              value={local?.RestroRating ?? ""}
              onChange={(e) => updateField("RestroRating", e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Restro Display Photo (path)">
            <input
              value={local?.RestroDisplayPhoto ?? ""}
              onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Display Preview">
            {local?.RestroDisplayPhoto ? (
              <img
                src={imagePrefix + local.RestroDisplayPhoto}
                alt="display"
                style={{ height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            ) : (
              <div style={{ padding: 8, borderRadius: 6, background: "#fafafa", border: "1px solid #f0f0f0" }}>
                No image
              </div>
            )}
          </FormField>

          <FormField label="Owner Name">
            <input
              value={local?.OwnerName ?? ""}
              onChange={(e) => updateField("OwnerName", e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Owner Email">
            <input
              value={local?.OwnerEmail ?? ""}
              onChange={(e) => updateField("OwnerEmail", e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Owner Phone">
            <input
              value={local?.OwnerPhone ?? ""}
              onChange={(e) => updateField("OwnerPhone", e.target.value)}
              inputMode="numeric"
              maxLength={10}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Restro Email">
            <input
              value={local?.RestroEmail ?? ""}
              onChange={(e) => updateField("RestroEmail", e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Restro Phone">
            <input
              value={local?.RestroPhone ?? ""}
              onChange={(e) => updateField("RestroPhone", e.target.value)}
              inputMode="numeric"
              maxLength={10}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          {/* FSSAI fields removed per your request */}
        </FormRow>
      </div>
    </div>
  );
}
