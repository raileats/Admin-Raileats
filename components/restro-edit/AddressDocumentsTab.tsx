"use client";
import React from "react";
import UI from "@/components/AdminUI";
const { FormField, Toggle, SubmitButton } = UI;

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
    <div className="px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-center text-2xl font-extrabold mb-6">Address &amp; Documents</h2>

        {/* ---------- ADDRESS SECTION ---------- */}
        <div className="bg-white rounded shadow-sm overflow-hidden mb-6">
          <div className="bg-amber-50 py-3 text-center font-semibold">Address</div>

          {/* address panel: left label column + grey center area */}
          <div className="grid grid-cols-12">
            {/* left labels column */}
            <div className="col-span-2 border-r border-slate-200 bg-white">
              <div className="py-4 px-3 text-sm font-medium">Restro Address</div>
              <div className="py-6 px-3 text-sm font-medium">City / Village</div>
              <div className="py-6 px-3 text-sm font-medium">Pin Code</div>
            </div>

            {/* grey center content (spans many cols) */}
            <div className="col-span-8 bg-slate-200 p-6">
              <div className="mb-4">
                {/* Large centered address text (non-edit text area appearance like screenshot) */}
                <div className="text-center text-sm leading-relaxed px-8">
                  {restroAddress || "—"}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center mt-6">
                <div>
                  <div className="text-xs text-slate-600 mb-1">City / Village</div>
                  <div className="bg-white p-3 rounded border h-10">{city || "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-600 mb-1">State</div>
                  {/* state must be non-editable */}
                  <div className="bg-white p-3 rounded border h-10">{stateVal || "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-600 mb-1">District</div>
                  {/* district non-editable */}
                  <div className="bg-white p-3 rounded border h-10">{district || "—"}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 items-center mt-6">
                <div>
                  <div className="text-xs text-slate-600 mb-1">Pin Code</div>
                  <div className="bg-white p-3 rounded border h-10">{pin || "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-600 mb-1">Restro Latitude</div>
                  <div className="bg-white p-3 rounded border h-10">{lat || "—"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-600 mb-1">Restro Longitude</div>
                  <div className="bg-white p-3 rounded border h-10">{lng || "—"}</div>
                </div>

                {/* an empty spacer cell to match wide layout */}
                <div />
              </div>
            </div>

            {/* rightmost action column */}
            <div className="col-span-2 border-l border-slate-200 bg-white">
              <div className="py-4 px-3 text-sm font-medium">Actions</div>
              <div className="px-3">
                <button
                  type="button"
                  onClick={() => {
                    // example: focus address editing — you can change behavior to open inline editor/modal
                    // fallback: allow editing by copying existing values into inputs via updateField if you want
                  }}
                  className="w-full bg-sky-500 text-white rounded py-2 mb-3"
                >
                  Edit Address
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- DOCUMENTS SECTION ---------- */}
        <div className="bg-white rounded shadow-sm p-0 mb-6">
          <div className="bg-sky-100 py-3 text-center font-semibold">Documents</div>

          {/* documents header row (table-like) */}
          <div className="grid grid-cols-12 gap-0 border-t">
            <div className="col-span-8">
              {/* table header */}
              <div className="grid grid-cols-12 text-xs">
                <div className="col-span-3 border-r border-slate-200 p-2 font-semibold">Document</div>
                <div className="col-span-3 border-r border-slate-200 p-2 font-semibold">Number / Type</div>
                <div className="col-span-3 border-r border-slate-200 p-2 font-semibold">Expiry / Dropdown</div>
                <div className="col-span-3 p-2 font-semibold">Copy Upload / Status</div>
              </div>

              {/* FSSAI row */}
              <div className="grid grid-cols-12 text-sm items-center border-t">
                <div className="col-span-3 border-r border-slate-200 p-3">FSSAI Number</div>

                <div className="col-span-3 border-r border-slate-200 p-3">
                  <input
                    name="FSSAINumber"
                    value={fssai}
                    onChange={(e) => updateField("FSSAINumber", e.target.value)}
                    className="w-full p-2 rounded border"
                    maxLength={20}
                    placeholder="14-digit FSSAI Number"
                  />
                </div>

                <div className="col-span-3 border-r border-slate-200 p-3">
                  <input
                    type="date"
                    name="FSSAIExpiry"
                    value={fssaiExpiry ?? ""}
                    onChange={(e) => updateField("FSSAIExpiry", e.target.value)}
                    className="w-full p-2 rounded border"
                  />
                </div>

                <div className="col-span-3 p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          // TODO: upload to Supabase and set updateField("FSSAICopyUrl", url)
                        }
                      }}
                    />
                  </div>

                  <div className="w-28">
                    <Toggle checked={Boolean(local?.FSSAIStatus)} onChange={(v: boolean) => updateField("FSSAIStatus", v)} label={local?.FSSAIStatus ? "ON" : "OFF"} />
                  </div>
                </div>
              </div>

              {/* GST row */}
              <div className="grid grid-cols-12 text-sm items-center border-t">
                <div className="col-span-3 border-r border-slate-200 p-3">GST Number</div>

                <div className="col-span-3 border-r border-slate-200 p-3">
                  <input
                    name="GSTNumber"
                    value={gst}
                    onChange={(e) => updateField("GSTNumber", e.target.value)}
                    className="w-full p-2 rounded border"
                    maxLength={20}
                    placeholder="15 letters / digits"
                  />
                </div>

                <div className="col-span-3 border-r border-slate-200 p-3">
                  <select
                    name="GSTType"
                    value={gstType ?? ""}
                    onChange={(e) => updateField("GSTType", e.target.value)}
                    className="w-full p-2 rounded border"
                  >
                    <option value="">-- Select --</option>
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                    <option value="NotApplicable">Not Applicable</option>
                  </select>
                </div>

                <div className="col-span-3 p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          // TODO: upload -> updateField("GSTCopyUrl", url)
                        }
                      }}
                    />
                  </div>

                  <div className="w-28">
                    <Toggle checked={Boolean(local?.GSTStatus)} onChange={(v: boolean) => updateField("GSTStatus", v)} label={local?.GSTStatus ? "ON" : "OFF"} />
                  </div>
                </div>
              </div>

              {/* PAN row */}
              <div className="grid grid-cols-12 text-sm items-center border-t">
                <div className="col-span-3 border-r border-slate-200 p-3">PAN Number</div>

                <div className="col-span-3 border-r border-slate-200 p-3">
                  <input
                    name="PANNumber"
                    value={pan}
                    onChange={(e) => updateField("PANNumber", e.target.value)}
                    className="w-full p-2 rounded border"
                    maxLength={10}
                    placeholder="10 letters/digits"
                  />
                </div>

                <div className="col-span-3 border-r border-slate-200 p-3">
                  <select
                    name="PANType"
                    value={panType ?? ""}
                    onChange={(e) => updateField("PANType", e.target.value)}
                    className="w-full p-2 rounded border"
                  >
                    <option value="">-- Select --</option>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                  </select>
                </div>

                <div className="col-span-3 p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          // TODO: upload -> updateField("PANCpoyUrl", url)
                        }
                      }}
                    />
                  </div>

                  <div className="w-28">
                    <Toggle checked={Boolean(local?.PANStatus)} onChange={(v: boolean) => updateField("PANStatus", v)} label={local?.PANStatus ? "ON" : "OFF"} />
                  </div>
                </div>
              </div>
            </div>

            {/* right action column with Add New buttons */}
            <div className="col-span-4 border-l border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // ideally call add_fssai_atomic backend RPC - placeholder here
                    // e.g. open Add FSSAI modal or call updateField('addFSSAI', true)
                  }}
                  className="w-full bg-sky-500 text-white rounded py-2"
                >
                  Add New FSSAI Entry
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // open GST add flow
                  }}
                  className="w-full bg-sky-500 text-white rounded py-2"
                >
                  Add New GST Entry
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // open PAN add flow
                  }}
                  className="w-full bg-sky-500 text-white rounded py-2"
                >
                  Add New PAN Entry
                </button>

                {/* explanatory note */}
                <div className="text-xs text-slate-500 mt-4">
                  Add new entries create history rows. Use server RPCs (add_fssai_atomic / add_gst_atomic / add_pan_atomic) when saving.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer note */}
        <div className="text-sm text-slate-500 mb-4 max-w-3xl mx-auto">
          Note: file inputs are placeholders — wire Supabase signed uploads and call <code>updateField</code> with stored URLs. State &amp; District are non-editable (populated from station data).
        </div>

        <div className="flex justify-center">
          <SubmitButton onClick={() => { /* parent modal Save handles final persist */ }}>
            Save Address &amp; Docs
          </SubmitButton>
        </div>
      </div>
    </div>
  );
}
