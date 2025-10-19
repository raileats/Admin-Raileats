"use client";
import React from "react";
import UI from "@/components/AdminUI";
const { Toggle, SubmitButton } = UI;

type Props = {
  local: any;
  updateField: (key: string, value: any) => void;
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
        <h1 className="text-center text-3xl font-bold mb-3">Address &amp; Documents</h1>

        {/* ADDRESS area */}
        <div className="mb-6 border rounded overflow-hidden">
          <div className="bg-amber-100 py-4 text-center font-semibold">Address</div>

          <div className="grid grid-cols-12">
            {/* left label column */}
            <div className="col-span-2 bg-white border-r">
              <div className="py-6 px-3 text-sm font-medium border-b">Restro Address</div>
              <div className="py-6 px-3 text-sm font-medium border-b">City / Village</div>
              <div className="py-6 px-3 text-sm font-medium">Pin Code</div>
            </div>

            {/* center grey content */}
            <div className="col-span-8 bg-slate-200 p-6">
              <div className="text-center mb-6 text-sm">{restroAddress || "—"}</div>

              <div className="grid grid-cols-6 gap-4 items-center">
                <div className="col-span-2">
                  <div className="text-xs font-semibold mb-1">City</div>
                  <div className="bg-white border rounded p-2 h-10 flex items-center">{city || "—"}</div>
                </div>

                <div className="col-span-1">
                  <div className="text-xs font-semibold mb-1">State</div>
                  <div className="bg-white border rounded p-2 h-10 flex items-center">{stateVal || "—"}</div>
                </div>

                <div className="col-span-1">
                  <div className="text-xs font-semibold mb-1">District</div>
                  <div className="bg-white border rounded p-2 h-10 flex items-center">{district || "—"}</div>
                </div>

                <div className="col-span-1">
                  <div className="text-xs font-semibold mb-1">Latitude</div>
                  <div className="bg-white border rounded p-2 h-10 flex items-center">{lat || "—"}</div>
                </div>

                <div className="col-span-1">
                  <div className="text-xs font-semibold mb-1">Longitude</div>
                  <div className="bg-white border rounded p-2 h-10 flex items-center">{lng || "—"}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold mb-1">Pin Code</div>
                <div className="bg-white border rounded p-2 w-40">{pin || "—"}</div>
              </div>
            </div>

            {/* right action column */}
            <div className="col-span-2 bg-white border-l">
              <div className="py-6 px-3 text-sm font-medium border-b">Actions</div>
              <div className="p-3">
                <button
                  type="button"
                  className="w-full bg-sky-600 text-white rounded py-2"
                  onClick={() => {
                    /* optional: open inline editor modal */
                  }}
                >
                  Edit Address
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS table */}
        <div className="mb-6 border rounded overflow-hidden">
          <div className="bg-sky-100 py-3 text-center font-semibold">Documents</div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="text-sm">
                <th className="w-[20%] border px-2 py-3 bg-white" />
                <th className="w-[20%] border px-2 py-3 bg-white">Number / Notes</th>
                <th className="w-[20%] border px-2 py-3 bg-white">Expiry / Type</th>
                <th className="w-[25%] border px-2 py-3 bg-white">Upload</th>
                <th className="w-[15%] border px-2 py-3 bg-white">Action</th>
              </tr>
            </thead>

            <tbody className="text-sm">
              {/* FSSAI row */}
              <tr className="h-14">
                <td className="border px-2 py-2 align-top">FSSAI Number</td>
                <td className="border px-2 py-2">
                  <input
                    name="FSSAINumber"
                    value={fssai}
                    onChange={(e) => updateField("FSSAINumber", e.target.value)}
                    placeholder="14-digit FSSAI Number"
                    maxLength={20}
                    className="w-full p-2 rounded border"
                  />
                </td>
                <td className="border px-2 py-2">
                  <input
                    type="date"
                    name="FSSAIExpiry"
                    value={fssaiExpiry ?? ""}
                    onChange={(e) => updateField("FSSAIExpiry", e.target.value)}
                    className="w-full p-2 rounded border"
                  />
                </td>
                <td className="border px-2 py-2">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          // TODO: upload to Supabase -> updateField("FSSAICopyUrl", url)
                        }
                      }}
                    />
                    <div className="text-xs">Brows File PDF / JPG</div>
                  </div>
                </td>
                <td className="border px-2 py-2">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="w-full bg-sky-500 text-white rounded py-2"
                      onClick={() => {
                        // trigger add FSSAI entry modal/RPC
                      }}
                    >
                      Add New FSSAI Entry
                    </button>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">Status</div>
                      <div className="bg-green-200 p-1 rounded">
                        <Toggle
                          checked={Boolean(local?.FSSAIStatus)}
                          onChange={(v: boolean) => updateField("FSSAIStatus", v)}
                          label={local?.FSSAIStatus ? "ON" : "OFF"}
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* GST row */}
              <tr className="h-14">
                <td className="border px-2 py-2 align-top">GST Number</td>
                <td className="border px-2 py-2">
                  <input
                    name="GSTNumber"
                    value={gst}
                    onChange={(e) => updateField("GSTNumber", e.target.value)}
                    placeholder="15 Letters or Digits"
                    maxLength={20}
                    className="w-full p-2 rounded border"
                  />
                </td>
                <td className="border px-2 py-2">
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
                  <div className="text-xs mt-1">Regular / Composition / NA</div>
                </td>
                <td className="border px-2 py-2">
                  <div className="grid grid-cols-2 gap-2 items-center">
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
                    <div className="text-xs">Brows File PDF / JPG</div>
                  </div>
                </td>
                <td className="border px-2 py-2">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="w-full bg-sky-500 text-white rounded py-2"
                      onClick={() => {
                        // add new GST entry flow
                      }}
                    >
                      Add New GST Entry
                    </button>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">Status</div>
                      <div className="bg-green-200 p-1 rounded">
                        <Toggle checked={Boolean(local?.GSTStatus)} onChange={(v: boolean) => updateField("GSTStatus", v)} label={local?.GSTStatus ? "ON" : "OFF"} />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              {/* PAN row */}
              <tr className="h-14">
                <td className="border px-2 py-2 align-top">PAN Number</td>
                <td className="border px-2 py-2">
                  <input
                    name="PANNumber"
                    value={pan}
                    onChange={(e) => updateField("PANNumber", e.target.value)}
                    placeholder="10 Letters or Digits"
                    maxLength={10}
                    className="w-full p-2 rounded border"
                  />
                </td>
                <td className="border px-2 py-2">
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
                  <div className="text-xs mt-1">Individual / Company</div>
                </td>
                <td className="border px-2 py-2">
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          // TODO: upload -> updateField("PANCopyUrl", url)
                        }
                      }}
                    />
                    <div className="text-xs">Brows File PDF / JPG</div>
                  </div>
                </td>
                <td className="border px-2 py-2">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      className="w-full bg-sky-500 text-white rounded py-2"
                      onClick={() => {
                        // add new PAN entry
                      }}
                    >
                      Add New PAN Entry
                    </button>

                    <div className="flex items-center justify-between">
                      <div className="text-xs">Status</div>
                      <div className="bg-green-200 p-1 rounded">
                        <Toggle checked={Boolean(local?.PANStatus)} onChange={(v: boolean) => updateField("PANStatus", v)} label={local?.PANStatus ? "ON" : "OFF"} />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-sm text-slate-500 mb-4">
          Note: "Add New" buttons should create history rows via your RPCs (add_fssai_atomic, add_gst_atomic, add_pan_atomic). File inputs are placeholders — wire Supabase signed uploads and call <code>updateField</code> with stored URLs.
        </div>

        <div className="flex justify-center">
          <SubmitButton onClick={() => { /* parent modal Save handles final persist */ }}>Save Address &amp; Docs</SubmitButton>
        </div>
      </div>
    </div>
  );
}
