// components/AddOutletModal.jsx
"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

// dynamic import of StationSearch (ssr:false) to avoid server-side import-time issues
const StationSearch = dynamic(() => import("./StationSearch"), { ssr: false });

export default function AddOutletModal({ stations = [], onClose = () => {}, onCreate = () => {} }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const [basic, setBasic] = useState({
    outletId: "",
    outletName: "",
    stationId: "",
    stationObj: null,
    ownerName: "",
    outletLat: "",
    outletLong: "",
    ownerMobile: "",
    ownerEmail: "",
    outletMobile: "",
    outletStatus: true,
  });

  const [stationSettings, setStationSettings] = useState({
    openTime: "",
    closeTime: "",
    minOrder: "",
    cutOffMinutes: "",
  });

  const [documents, setDocuments] = useState({
    fssai: "",
    licenceFile: null,
  });

  function resetAll() {
    setBasic({
      outletId: "",
      outletName: "",
      stationId: "",
      stationObj: null,
      ownerName: "",
      outletLat: "",
      outletLong: "",
      ownerMobile: "",
      ownerEmail: "",
      outletMobile: "",
      outletStatus: true,
    });
    setStationSettings({ openTime: "", closeTime: "", minOrder: "", cutOffMinutes: "" });
    setDocuments({ fssai: "", licenceFile: null });
    setTab(0);
  }

  async function handleBasicSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();

    // validation
    if (!basic.outletName || !basic.stationId || !basic.ownerMobile) {
      alert("Please fill required fields: Outlet Name, Station and Owner Mobile.");
      return;
    }

    setLoading(true);
    try {
      // TODO: replace with server API that creates outlet and returns id
      const fakeId = "OUT" + Math.floor(Math.random() * 900000 + 100000);
      setBasic((b) => ({ ...b, outletId: fakeId }));
      setTab(1);
    } catch (err) {
      console.error("handleBasicSubmit:", err);
      alert("Error creating outlet (basic)");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        basic: {
          ...basic,
          station: basic.stationObj ? {
            id: basic.stationObj.StationId,
            code: basic.stationObj.StationCode,
            name: basic.stationObj.StationName,
            state: basic.stationObj.State,
            district: basic.stationObj.District,
            lat: basic.stationObj.Lat,
            long: basic.stationObj.Long,
          } : null
        },
        stationSettings,
        documents: { fssai: documents.fssai }
      };

      // TODO: call your API to save
      // const res = await fetch("/api/outlets", { method: "PUT", headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      // const json = await res.json();

      // Simulate success:
      const json = { success: true, outlet: { ...basic, ...stationSettings } };
      onCreate(json.outlet);
      resetAll();
    } catch (err) {
      console.error("handleFinalSubmit:", err);
      alert("Error finalizing outlet");
    } finally {
      setLoading(false);
    }
  }

  // Fallback: if StationSearch fails for some reason, you can still use static stations prop
  const fallbackStationOptions = Array.isArray(stations) ? stations : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={() => { onClose(); resetAll(); }} />
      <div className="w-full max-w-3xl bg-white rounded shadow p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Outlet</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => { onClose(); resetAll(); }} className="px-3 py-1 rounded border">Close</button>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-auto">
          {["Basic Info", "Station Settings", "Documents", "Future Holiday", "Bank", "Address", "Menu"].map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`px-3 py-1 rounded ${tab === i ? "bg-gray-100 border" : "bg-white"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tab === 0 && (
            <form onSubmit={handleBasicSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Outlet ID</label>
                <input value={basic.outletId} readOnly placeholder="Will be generated" className="w-full border rounded p-2 bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm">Outlet Status</label>
                <div className="mt-1">
                  <label className="inline-flex items-center">
                    <input type="checkbox" checked={basic.outletStatus} onChange={(e) => setBasic(b => ({ ...b, outletStatus: e.target.checked }))} />
                    <span className="ml-2 text-sm">{basic.outletStatus ? "On" : "Off"}</span>
                  </label>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm">Outlet Name *</label>
                <input required value={basic.outletName} onChange={e => setBasic(b => ({ ...b, outletName: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Station (Code - Name) *</label>

                {/* Primary: StationSearch (client-side) */}
                <StationSearch
                  value={basic.stationObj}
                  onChange={(s) => {
                    setBasic(b => ({
                      ...b,
                      stationId: s ? s.StationId : "",
                      stationObj: s ? s : null
                    }));
                  }}
                />

                {/* Fallback: static select (will be visible if StationSearch SSR not available or you want fallback)
                    Uncomment below block if you prefer the fallback dropdown instead of StationSearch.
                */}
                {/* <div className="mt-2">
                  <select
                    required
                    value={basic.stationId}
                    onChange={e => {
                      const val = e.target.value;
                      setBasic(b => ({ ...b, stationId: val, stationObj: { StationId: val, StationName: e.target.selectedOptions[0]?.text || "" } }));
                    }}
                    className="w-full border rounded p-2"
                  >
                    <option value="">Select station</option>
                    {fallbackStationOptions.map(s => (
                      <option key={s.StationId ?? s.id ?? s.code} value={s.StationId ?? s.id ?? s.code}>
                        {(s.StationCode ?? s.code ?? "")} - {(s.StationName ?? s.name ?? "")}
                      </option>
                    ))}
                  </select>
                </div> */}

              </div>

              <div>
                <label className="block text-sm">Owner Name</label>
                <input value={basic.ownerName} onChange={e => setBasic(b => ({ ...b, ownerName: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Owner Mobile *</label>
                <input required value={basic.ownerMobile} onChange={e => setBasic(b => ({ ...b, ownerMobile: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Owner Email</label>
                <input type="email" value={basic.ownerEmail} onChange={e => setBasic(b => ({ ...b, ownerEmail: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Outlet Mobile</label>
                <input value={basic.outletMobile} onChange={e => setBasic(b => ({ ...b, outletMobile: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Latitude</label>
                <input value={basic.outletLat} onChange={e => setBasic(b => ({ ...b, outletLat: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Longitude</label>
                <input value={basic.outletLong} onChange={e => setBasic(b => ({ ...b, outletLong: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div className="col-span-2 flex gap-2 justify-end">
                <button type="button" onClick={() => { onClose(); resetAll(); }} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-yellow-400 rounded">{loading ? "Please wait..." : "Save & Next"}</button>
              </div>
            </form>
          )}

          {tab === 1 && (
            <form onSubmit={handleFinalSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Station (auto)</label>
                <input value={(() => {
                  const s = basic.stationObj;
                  return s ? `${s.StationCode || ""} - ${s.StationName}` : "";
                })()} readOnly className="w-full border rounded p-2 bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm">Minimum Order</label>
                <input value={stationSettings.minOrder} onChange={e => setStationSettings(s => ({ ...s, minOrder: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Outlet Open Time</label>
                <input type="time" value={stationSettings.openTime} onChange={e => setStationSettings(s => ({ ...s, openTime: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Outlet Close Time</label>
                <input type="time" value={stationSettings.closeTime} onChange={e => setStationSettings(s => ({ ...s, closeTime: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div>
                <label className="block text-sm">Cut-off Time (minutes)</label>
                <input type="number" value={stationSettings.cutOffMinutes} onChange={e => setStationSettings(s => ({ ...s, cutOffMinutes: e.target.value }))} className="w-full border rounded p-2" />
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setTab(0)} className="px-4 py-2 border rounded">Back</button>
                <button type="button" onClick={handleFinalSubmit} className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>{loading ? "Saving..." : "Submit All"}</button>
              </div>
            </form>
          )}

          {tab === 2 && (
            <div>
              <p className="mb-2">Documents form (FSSAI etc.)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm">FSSAI Number</label>
                  <input value={documents.fssai} onChange={e => setDocuments(d => ({ ...d, fssai: e.target.value }))} className="w-full border rounded p-2" />
                </div>

                <div>
                  <label className="block text-sm">Upload Licence</label>
                  <input type="file" onChange={e => setDocuments(d => ({ ...d, licenceFile: e.target.files && e.target.files[0] }))} className="w-full" />
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button onClick={() => setTab(1)} className="px-4 py-2 border rounded">Back</button>
                  <button onClick={() => setTab(3)} className="px-4 py-2 bg-gray-200 rounded">Next</button>
                </div>
              </div>
            </div>
          )}

          {tab >= 3 && (
            <div>
              <p className="text-sm italic">Further tabs (Future Holiday, Bank, Address, Menu) — content to be added later.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
