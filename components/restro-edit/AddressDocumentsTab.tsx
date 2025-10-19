"use client";

import React from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Toggle, SubmitButton } = UI;

type StationOption = { label: string; value: string };

type Props = {
  // these mirror the 'common' object spread from RestroEditModal
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
  // fallbacks (keep keys identical to what you persist in Supabase)
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
    <div className="px-2 pb-8">
      {/* Page heading */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-xl md:text-2xl font-bold mb-6">Address &amp; Documents</h2>

        {/* ADDRESS SECTION */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Address</h3>

          <FormRow cols={3} gap={6}>
            {/* full width textarea spans all 3 cols */}
            <div className="col-span-3">
              <FormField label="Restro Address" className="col-span-3">
                <textarea
                  name="RestroAddress"
                  value={restroAddress}
                  onChange={(e) => updateField("RestroAddress", e.target.value)}
                  className="w-full min-h-[80px] p-3 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-300"
                />
              </FormField>
            </div>

            <FormField label="City / Village">
              <input
                name="City"
                value={city}
                onChange={(e) => updateField("City", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
            </FormField>

            <FormField label="State">
              <input
                name="State"
                value={stateVal}
                onChange={(e) => updateField("State", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
            </FormField>

            <FormField label="District">
              <input
                name="District"
                value={district}
                onChange={(e) => updateField("District", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
            </FormField>

            <FormField label="Pin Code">
              <input
                name="PinCode"
                value={pin}
                onChange={(e) => updateField("PinCode", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
            </FormField>

            <FormField label="Latitude">
              <input
                name="RestroLatitude"
                value={lat}
                onChange={(e) => updateField("RestroLatitude", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
            </FormField>

            <FormField label="Longitude">
              <input
                name="RestroLongitude"
                value={lng}
                onChange={(e) => updateField("RestroLongitude", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
            </FormField>
          </FormRow>
        </div>

        {/* DOCUMENTS SECTION */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Documents</h3>

          {/* FSSAI Row */}
          <FormRow cols={4} gap={6} className="items-end">
            <FormField label="FSSAI Number">
              <input
                name="FSSAINumber"
                value={fssai}
                onChange={(e) => updateField("FSSAINumber", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
                maxLength={20}
              />
            </FormField>

            <FormField label="FSSAI Expiry">
              <input
                type="date"
                name="FSSAIExpiry"
                value={fssaiExpiry ?? ""}
                onChange={(e) => updateField("FSSAIExpiry", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
            </FormField>

            <FormField label="FSSAI Copy">
              {/* placeholder — integrate your signed upload flow here */}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    // implement your upload and call updateField("FSSAICopyUrl", uploadedUrl) as needed
                    // e.g. uploadToSupabaseAndSetField(f, "FSSAICopy")
                  }
                }}
              />
            </FormField>

            <FormField label="FSSAI Status">
              <div>
                <Toggle
                  checked={Boolean(local?.FSSAIStatus)}
                  onChange={(v: boolean) => updateField("FSSAIStatus", v)}
                  label={local?.FSSAIStatus ? "On" : "Off"}
                />
              </div>
            </FormField>
          </FormRow>

          {/* GST Row */}
          <FormRow cols={4} gap={6} className="items-end mt-4">
            <FormField label="GST Number">
              <input
                name="GSTNumber"
                value={gst}
                onChange={(e) => updateField("GSTNumber", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
                maxLength={20}
              />
            </FormField>

            <FormField label="GST Type">
              <select
                name="GSTType"
                value={gstType ?? ""}
                onChange={(e) => updateField("GSTType", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              >
                <option value="">-- Select --</option>
                <option value="Regular">Regular</option>
                <option value="Composition">Composition</option>
                <option value="NotApplicable">Not Applicable</option>
              </select>
            </FormField>

            <FormField label="GST Copy">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    // handle upload then updateField("GSTCopyUrl", uploadedUrl)
                  }
                }}
              />
            </FormField>

            <FormField label="GST Status">
              <Toggle
                checked={Boolean(local?.GSTStatus)}
                onChange={(v: boolean) => updateField("GSTStatus", v)}
                label={local?.GSTStatus ? "On" : "Off"}
              />
            </FormField>
          </FormRow>

          {/* PAN Row */}
          <FormRow cols={4} gap={6} className="items-end mt-4">
            <FormField label="PAN Number">
              <input
                name="PANNumber"
                value={pan}
                onChange={(e) => updateField("PANNumber", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
                maxLength={15}
              />
            </FormField>

            <FormField label="PAN Type">
              <select
                name="PANType"
                value={panType ?? ""}
                onChange={(e) => updateField("PANType", e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              >
                <option value="">-- Select --</option>
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
              </select>
            </FormField>

            <FormField label="PAN Copy">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    // handle upload then updateField("PANCopyUrl", uploadedUrl)
                  }
                }}
              />
            </FormField>

            <FormField label="PAN Status">
              <Toggle
                checked={Boolean(local?.PANStatus)}
                onChange={(v: boolean) => updateField("PANStatus", v)}
                label={local?.PANStatus ? "On" : "Off"}
              />
            </FormField>
          </FormRow>
        </div>

        {/* small note */}
        <div className="text-sm text-slate-500 mb-6 max-w-3xl mx-auto">
          Note: file inputs are placeholders — implement Supabase storage signed uploads or a server upload endpoint and call `updateField` with the resulting stored URL (e.g. `updateField("FSSAICopyUrl", url)`).
        </div>

        {/* single-row Save button (this is page-level; you can remove or keep) */}
        <div className="flex justify-center">
          <SubmitButton onClick={() => { /* parent handles save; keep empty if you use modal Save */ }} label="Save Address & Docs" />
        </div>
      </div>
    </div>
  );
}
