import React from "react";
import UI from "@/components/AdminUI";
const { AdminForm, FormRow, FormField, SubmitButton, Toggle, Select } = UI;

type StationOption = { label: string; value: string };

type Props = {
  local: any;
  updateField: (key: string, value: any) => void;
  stationDisplay?: string;
  stations?: StationOption[];
  loadingStations?: boolean;
};

export default function AddressDocumentsTab({ local, updateField }: Props) {
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

  return (
    <AdminForm>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Address & Documents</h3>

      <div style={{ maxWidth: 1200, margin: "12px auto" }}>
        {/* Address block */}
        <div style={{ background: "#eef8ff", padding: 16, borderRadius: 10, border: "1px solid #d6eaf8", marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#083d77" }}>Address</h4>

          <FormRow cols={3} gap={12}>
            <FormField label="Restro Address" className="col-span-3">
              <textarea name="RestroAddress" value={restroAddress} onChange={(e) => updateField("RestroAddress", e.target.value)} style={{ width: "100%", minHeight: 100, padding: 10, borderRadius: 6, border: "1px solid #e6eef6" }} />
            </FormField>

            <FormField label="City / Village">
              <input name="City" value={city} onChange={(e) => updateField("City", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="State">
              <input name="State" value={stateVal} onChange={(e) => updateField("State", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="District">
              <input name="District" value={district} onChange={(e) => updateField("District", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Pin Code">
              <input name="PinCode" value={pin} onChange={(e) => updateField("PinCode", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Latitude">
              <input name="RestroLatitude" value={lat} onChange={(e) => updateField("RestroLatitude", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Longitude">
              <input name="RestroLongitude" value={lng} onChange={(e) => updateField("RestroLongitude", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>
          </FormRow>
        </div>

        {/* Documents block */}
        <div style={{ background: "#eef8ff", padding: 16, borderRadius: 10, border: "1px solid #d6eaf8", marginBottom: 8 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#083d77" }}>Documents</h4>

          {/* FSSAI row */}
          <FormRow cols={4} gap={12}>
            <FormField label="FSSAI Number">
              <input name="FSSAINumber" value={fssai} onChange={(e) => updateField("FSSAINumber", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="FSSAI Expiry">
              <input type="date" name="FSSAIExpiry" value={fssaiExpiry} onChange={(e) => updateField("FSSAIExpiry", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Upload Copy">
              <input type="file" name="FSSAICopy" onChange={() => { /* implement upload flow separately */ }} />
            </FormField>

            <FormField label="Status">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Toggle checked={String(local?.FSSAIStatus ?? "OFF") === "ON"} onChange={(ch) => updateField("FSSAIStatus", ch ? "ON" : "OFF")} />
                <div>{String(local?.FSSAIStatus ?? "OFF")}</div>
              </div>
            </FormField>
          </FormRow>

          {/* GST row */}
          <FormRow cols={4} gap={12}>
            <FormField label="GST Number">
              <input name="GSTNumber" value={gst} onChange={(e) => updateField("GSTNumber", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="GST Type">
              <select name="GSTType" value={gstType} onChange={(e) => updateField("GSTType", e.target.value)} className="w-full p-2 rounded border">
                <option value="">-- Select --</option>
                <option value="Regular">Regular</option>
                <option value="Composition">Composition</option>
                <option value="NotApplicable">Not Applicable</option>
              </select>
            </FormField>

            <FormField label="Upload Copy">
              <input type="file" name="GSTCopy" onChange={() => {}} />
            </FormField>

            <FormField label="Status">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Toggle checked={String(local?.GSTStatus ?? "OFF") === "ON"} onChange={(ch) => updateField("GSTStatus", ch ? "ON" : "OFF")} />
                <div>{String(local?.GSTStatus ?? "OFF")}</div>
              </div>
            </FormField>
          </FormRow>

          {/* PAN row */}
          <FormRow cols={4} gap={12}>
            <FormField label="PAN Number">
              <input name="PANNumber" value={pan} onChange={(e) => updateField("PANNumber", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="PAN Type">
              <select name="PANType" value={panType} onChange={(e) => updateField("PANType", e.target.value)} className="w-full p-2 rounded border">
                <option value="">-- Select --</option>
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
              </select>
            </FormField>

            <FormField label="Upload Copy">
              <input type="file" name="PANCopy" onChange={() => {}} />
            </FormField>

            <FormField label="Status">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Toggle checked={String(local?.PANStatus ?? "OFF") === "ON"} onChange={(ch) => updateField("PANStatus", ch ? "ON" : "OFF")} />
                <div>{String(local?.PANStatus ?? "OFF")}</div>
              </div>
            </FormField>
          </FormRow>
        </div>

        <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
          Note: File upload controls are placeholders. Implement Supabase storage signed uploads (or server endpoint) to persist files.
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <SubmitButton onClick={() => {}} label="Save Address & Docs" />
        </div>
      </div>
    </AdminForm>
  );
}
