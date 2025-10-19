// components/restro-edit/AddressDocumentsTab.tsx
import React from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Select, Toggle } = UI;

type StationOption = { label: string; value: string };

type Props = {
  local: any;
  updateField: (key: string, value: any) => void;
  stationDisplay?: string;
  stations?: StationOption[];
  loadingStations?: boolean;
};

export default function AddressDocumentsTab({
  local,
  updateField,
  stationDisplay,
  stations,
  loadingStations,
}: Props) {
  // data fallbacks (same keys you used)
  const restroAddress = local?.RestroAddress ?? "";
  const city = local?.City ?? "";
  const stateVal = local?.State ?? "";
  const district = local?.District ?? "";
  const pin = local?.PinCode ?? "";
  const lat = local?.RestroLatitude ?? local?.Latitude ?? "";
  const lng = local?.RestroLongitude ?? local?.Longitude ?? "";

  const fssai = local?.FSSAINumber ?? "";
  const fssaiExpiry = local?.FSSAIExpiry ?? "";
  const gst = local?.GSTNumber ?? "";
  const gstType = local?.GSTType ?? "";
  const pan = local?.PANNumber ?? "";
  const panType = local?.PANType ?? "";

  // shared inline styles
  const sectionBox: React.CSSProperties = {
    background: "#f6fbff",
    padding: 18,
    borderRadius: 10,
    border: "1px solid #e6f2fb",
    marginBottom: 16,
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #e6eef6",
    boxSizing: "border-box",
  };

  const noteStyle: React.CSSProperties = { color: "#666", fontSize: 13 };

  return (
    <div style={{ padding: "6px 10px 30px 10px" }}>
      {/* Address section */}
      <div style={sectionBox}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, color: "#083d77", fontWeight: 700 }}>
          Address
        </h3>

        <FormRow cols={3} gap={14}>
          {/* gridColumn applied to inner wrapper (not FormField) to avoid style prop on FormField */}
          <FormField label="Restro Address">
            <div style={{ gridColumn: "1 / span 3" }}>
              <textarea
                name="RestroAddress"
                value={restroAddress}
                onChange={(e) => updateField("RestroAddress", e.target.value)}
                style={{ ...inputBase, minHeight: 96, resize: "vertical" }}
              />
            </div>
          </FormField>

          <FormField label="City / Village">
            <input
              name="City"
              value={city}
              onChange={(e) => updateField("City", e.target.value)}
              style={inputBase}
            />
          </FormField>

          <FormField label="State">
            <input
              name="State"
              value={stateVal}
              onChange={(e) => updateField("State", e.target.value)}
              style={inputBase}
            />
          </FormField>

          <FormField label="District">
            <input
              name="District"
              value={district}
              onChange={(e) => updateField("District", e.target.value)}
              style={inputBase}
            />
          </FormField>

          <FormField label="Pin Code">
            <input
              name="PinCode"
              value={pin}
              onChange={(e) => updateField("PinCode", e.target.value)}
              style={inputBase}
            />
          </FormField>

          <FormField label="Latitude">
            <input
              name="RestroLatitude"
              value={lat}
              onChange={(e) => updateField("RestroLatitude", e.target.value)}
              style={inputBase}
            />
          </FormField>

          <FormField label="Longitude">
            <input
              name="RestroLongitude"
              value={lng}
              onChange={(e) => updateField("RestroLongitude", e.target.value)}
              style={inputBase}
            />
          </FormField>
        </FormRow>
      </div>

      {/* Documents section */}
      <div style={sectionBox}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 20, color: "#083d77", fontWeight: 700 }}>
          Documents
        </h3>

        <div style={{ display: "grid", gap: 12 }}>
          {/* FSSAI */}
          <FormRow cols={4} gap={12}>
            <FormField label="FSSAI Number">
              <input
                name="FSSAINumber"
                value={fssai}
                onChange={(e) => updateField("FSSAINumber", e.target.value)}
                style={inputBase}
              />
            </FormField>

            <FormField label="FSSAI Expiry">
              <input
                type="date"
                name="FSSAIExpiry"
                value={fssaiExpiry}
                onChange={(e) => updateField("FSSAIExpiry", e.target.value)}
                style={{ ...inputBase, padding: 8 }}
              />
            </FormField>

            <FormField label="Upload Copy">
              <input
                type="file"
                name="FSSAICopy"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  // keep upload flow external: send filename placeholder to local state if you want
                  updateField("FSSAICopyName", f ? f.name : null);
                }}
              />
            </FormField>

            <FormField label="Status">
              <Toggle checked={!!local?.FSSAIStatus} onChange={(v: boolean) => updateField("FSSAIStatus", v)} />
            </FormField>
          </FormRow>

          {/* GST */}
          <FormRow cols={4} gap={12}>
            <FormField label="GST Number">
              <input
                name="GSTNumber"
                value={gst}
                onChange={(e) => updateField("GSTNumber", e.target.value)}
                style={inputBase}
              />
            </FormField>

            <FormField label="GST Type">
              <Select
                name="GSTType"
                value={gstType ?? ""}
                onChange={(v: string) => updateField("GSTType", v)}
                options={[
                  { label: "-- Select --", value: "" },
                  { label: "Regular", value: "Regular" },
                  { label: "Composition", value: "Composition" },
                  { label: "Not Applicable", value: "NotApplicable" },
                ]}
              />
            </FormField>

            <FormField label="Upload Copy">
              <input
                type="file"
                name="GSTCopy"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  updateField("GSTCopyName", f ? f.name : null);
                }}
              />
            </FormField>

            <FormField label="Status">
              <Toggle checked={!!local?.GSTStatus} onChange={(v: boolean) => updateField("GSTStatus", v)} />
            </FormField>
          </FormRow>

          {/* PAN */}
          <FormRow cols={4} gap={12}>
            <FormField label="PAN Number">
              <input
                name="PANNumber"
                value={pan}
                onChange={(e) => updateField("PANNumber", e.target.value)}
                style={inputBase}
              />
            </FormField>

            <FormField label="PAN Type">
              <Select
                name="PANType"
                value={panType ?? ""}
                onChange={(v: string) => updateField("PANType", v)}
                options={[
                  { label: "-- Select --", value: "" },
                  { label: "Individual", value: "Individual" },
                  { label: "Company", value: "Company" },
                ]}
              />
            </FormField>

            <FormField label="Upload Copy">
              <input
                type="file"
                name="PANCopy"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  updateField("PANCopyName", f ? f.name : null);
                }}
              />
            </FormField>

            <FormField label="Status">
              <Toggle checked={!!local?.PANStatus} onChange={(v: boolean) => updateField("PANStatus", v)} />
            </FormField>
          </FormRow>
        </div>
      </div>

      <div style={noteStyle}>
        Note: file inputs are placeholders. Use Supabase Storage signed uploads or a server endpoint to store files,
        then call <code>updateField("FSSAICopy", url)</code> (or whichever key you persist).
      </div>
    </div>
  );
}
