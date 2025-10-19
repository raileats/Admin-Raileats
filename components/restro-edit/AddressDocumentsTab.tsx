"use client";
import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";
const { Toggle, SubmitButton } = UI;

type DocRow = {
  id: number | string;
  number?: string | null;
  type?: string | null;
  expiry?: string | null; // ISO date
  copy_url?: string | null;
  active?: boolean | null;
  created_at?: string | null;
};

type DocsResponse = {
  fssai: DocRow[];
  gst: DocRow[];
  pan: DocRow[];
};

type Props = {
  local: any; // restro object with at least Code, RestroAddress, City, State, District...
  updateField: (k: string, v: any) => void;
};

export default function AddressDocumentsTab({ local, updateField }: Props) {
  const restroCode = local?.Code ?? local?.RestroCode ?? "";
  const [docs, setDocs] = useState<DocsResponse>({ fssai: [], gst: [], pan: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // address / display fields
  const restroAddress = local?.RestroAddress ?? "";
  const city = local?.City ?? "";
  const stateVal = local?.State ?? "";
  const district = local?.District ?? "";
  const pin = local?.PinCode ?? "";
  const lat = local?.RestroLatitude ?? local?.Latitude ?? "";
  const lng = local?.RestroLongitude ?? local?.Longitude ?? "";

  useEffect(() => {
    if (!restroCode) return;
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restroCode]);

  async function fetchDocs() {
    if (!restroCode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/restros/${encodeURIComponent(restroCode)}/docs`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data: DocsResponse = await res.json();
      setDocs(data);
    } catch (err: any) {
      console.error("fetchDocs error", err);
      setError("Failed to load documents. Check server logs / API.");
    } finally {
      setLoading(false);
    }
  }

  // simple prompt-based add flows (keeps UI lightweight). Replace with modal if you prefer.
  async function handleAddFssai() {
    if (!restroCode) return alert("Missing restro code");
    const number = window.prompt("Enter FSSAI number (14 digits):", "");
    if (!number) return;
    const expiry = window.prompt("Expiry date (YYYY-MM-DD):", "");
    if (!expiry) return;
    await postAdd("add_fssai", { number: number.trim(), expiry: expiry.trim() });
  }

  async function handleAddGst() {
    if (!restroCode) return alert("Missing restro code");
    const number = window.prompt("Enter GST number (15 chars):", "");
    if (!number) return;
    const gstType = window.prompt("GST Type (Regular / Composition / NotApplicable):", "Regular");
    if (!gstType) return;
    await postAdd("add_gst", { number: number.trim(), gst_type: gstType.trim() });
  }

  async function handleAddPan() {
    if (!restroCode) return alert("Missing PAN number:");
    const number = window.prompt("Enter PAN (10 chars):", "");
    if (!number) return;
    const panType = window.prompt("PAN Type (Individual / Company):", "Individual");
    if (!panType) return;
    await postAdd("add_pan", { number: number.trim(), pan_type: panType.trim() });
  }

  async function postAdd(action: string, payload: Record<string, any>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/restros/${encodeURIComponent(restroCode)}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText} ${txt}`);
      }
      // server returns updated docs
      const data: DocsResponse = await res.json();
      setDocs(data);
    } catch (err: any) {
      console.error("postAdd error", err);
      setError("Failed to add entry. See console or server logs.");
    } finally {
      setSaving(false);
    }
  }

  // helper to format date
  function formatDate(d?: string | null) {
    if (!d) return "—";
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      // DD-MM-YYYY format to match screenshot
      const dd = String(dt.getDate()).padStart(2, "0");
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const yyyy = dt.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return d;
    }
  }

  return (
    <div className="px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-center text-3xl font-bold mb-3">Address &amp; Documents</h1>

        {/* ADDRESS block (read-only look) */}
        <div className="mb-6 border rounded overflow-hidden">
          <div className="bg-amber-100 py-4 text-center font-semibold">Address</div>

          <div className="grid grid-cols-12">
            <div className="col-span-2 bg-white border-r">
              <div className="py-6 px-3 text-sm font-medium border-b">Restro Address</div>
              <div className="py-6 px-3 text-sm font-medium border-b">City / Village</div>
              <div className="py-6 px-3 text-sm font-medium">Pin Code</div>
            </div>

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

            <div className="col-span-2 bg-white border-l">
              <div className="py-6 px-3 text-sm font-medium border-b">Actions</div>
              <div className="p-3">
                <button className="w-full bg-sky-600 text-white rounded py-2" onClick={() => alert("Address editing handled elsewhere")}>
                  Edit Address
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="mb-6 border rounded overflow-hidden">
          <div className="bg-sky-100 py-3 text-center font-semibold">Documents</div>

          <div className="p-2">
            {loading ? (
              <div className="text-center py-8">Loading documents...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-4">{error}</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-sm">
                    <th className="w-[18%] border px-2 py-3 bg-white" />
                    <th className="w-[22%] border px-2 py-3 bg-white">Number / Notes</th>
                    <th className="w-[18%] border px-2 py-3 bg-white">Expiry / Type</th>
                    <th className="w-[30%] border px-2 py-3 bg-white">Upload</th>
                    <th className="w-[12%] border px-2 py-3 bg-white">Action</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {/* FSSAI list (show latest active first) */}
                  <tr className="h-14">
                    <td className="border px-2 py-2">FSSAI Number</td>
                    <td className="border px-2 py-2">
                      {/* show latest active or placeholder */}
                      <div className="mb-1">Latest: {docs.fssai[0]?.number ?? "—"}</div>
                      <div className="text-xs text-slate-500">14-digit FSSAI Number</div>
                    </td>
                    <td className="border px-2 py-2">{formatDate(docs.fssai[0]?.expiry) ?? "—"}</td>
                    <td className="border px-2 py-2">
                      {docs.fssai[0]?.copy_url ? (
                        <a href={docs.fssai[0].copy_url} target="_blank" rel="noreferrer" className="text-sky-600 underline">
                          View Copy
                        </a>
                      ) : (
                        <div className="text-xs">No copy uploaded</div>
                      )}
                    </td>
                    <td className="border px-2 py-2">
                      <div className="flex flex-col gap-2">
                        <button className="w-full bg-sky-500 text-white rounded py-2" onClick={handleAddFssai} disabled={saving}>
                          Add New FSSAI Entry
                        </button>
                        <div className="flex items-center justify-between">
                          <div className="text-xs">Status</div>
                          <div>
                            <Toggle checked={Boolean(docs.fssai.find((r) => r.active))} onChange={() => {}} label={docs.fssai.find((r) => r.active) ? "ON" : "OFF"} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* GST */}
                  <tr className="h-14">
                    <td className="border px-2 py-2">GST Number</td>
                    <td className="border px-2 py-2">
                      <div className="mb-1">Latest: {docs.gst[0]?.number ?? "—"}</div>
                      <div className="text-xs text-slate-500">15 Letters or Digits mix</div>
                    </td>
                    <td className="border px-2 py-2">{docs.gst[0]?.type ?? "—"}</td>
                    <td className="border px-2 py-2">
                      {docs.gst[0]?.copy_url ? (
                        <a href={docs.gst[0].copy_url} target="_blank" rel="noreferrer" className="text-sky-600 underline">
                          View Copy
                        </a>
                      ) : (
                        <div className="text-xs">No copy uploaded</div>
                      )}
                    </td>
                    <td className="border px-2 py-2">
                      <div className="flex flex-col gap-2">
                        <button className="w-full bg-sky-500 text-white rounded py-2" onClick={handleAddGst} disabled={saving}>
                          Add New GST Entry
                        </button>
                        <div className="flex items-center justify-between">
                          <div className="text-xs">Status</div>
                          <div>
                            <Toggle checked={Boolean(docs.gst.find((r) => r.active))} onChange={() => {}} label={docs.gst.find((r) => r.active) ? "ON" : "OFF"} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* PAN */}
                  <tr className="h-14">
                    <td className="border px-2 py-2">PAN Number</td>
                    <td className="border px-2 py-2">
                      <div className="mb-1">Latest: {docs.pan[0]?.number ?? "—"}</div>
                      <div className="text-xs text-slate-500">10 Letters or Digits</div>
                    </td>
                    <td className="border px-2 py-2">{docs.pan[0]?.type ?? "—"}</td>
                    <td className="border px-2 py-2">
                      {docs.pan[0]?.copy_url ? (
                        <a href={docs.pan[0].copy_url} target="_blank" rel="noreferrer" className="text-sky-600 underline">
                          View Copy
                        </a>
                      ) : (
                        <div className="text-xs">No copy uploaded</div>
                      )}
                    </td>
                    <td className="border px-2 py-2">
                      <div className="flex flex-col gap-2">
                        <button className="w-full bg-sky-500 text-white rounded py-2" onClick={handleAddPan} disabled={saving}>
                          Add New PAN Entry
                        </button>
                        <div className="flex items-center justify-between">
                          <div className="text-xs">Status</div>
                          <div>
                            <Toggle checked={Boolean(docs.pan.find((r) => r.active))} onChange={() => {}} label={docs.pan.find((r) => r.active) ? "ON" : "OFF"} />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-500 mb-4">Note: "Add New" calls server RPCs and creates history rows. File uploads are handled separately (Supabase signed uploads recommended).</div>

        <div className="flex justify-center">
          <SubmitButton onClick={() => alert("Parent Save (persist) should be handled by modal parent")}>Save Address &amp; Docs</SubmitButton>
        </div>
      </div>
    </div>
  );
}
