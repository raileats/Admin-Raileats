// components/AddOutletModal.jsx
"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import so StationSearch only runs on client (avoid SSR issues)
const StationSearch = dynamic(() => import("./StationSearch"), { ssr: false });

export default function AddOutletModal({ stations = [], onClose = () => {}, onCreate = () => {} }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    setErrorMsg("");
  }

  async function handleBasicSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");

    // validation
    if (!basic.outletName || !basic.stationId || !basic.ownerMobile) {
      setErrorMsg("Please fill required fields: Outlet Name, Station and Owner Mobile.");
      return;
    }

    setLoading(true);
    try {
      // Replace with server API that creates outlet and returns id if you want.
      // For now, generate a temporary id to continue flow.
      const fakeId = "OUT" + Math.floor(Math.random() * 900000 + 100000);
      setBasic((b) => ({ ...b, outletId: fakeId }));
      setTab(1);
    } catch (err) {
      console.error("handleBasicSubmit:", err);
      setErrorMsg("Error creating outlet (basic). See console.");
    } finally {
      setLoading(false);
    }
  }

  // Replaces previous simulate-only function: calls server API /api/outlets (POST)
  async function handleFinalSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const payload = {
        basic: {
          ...basic
        },
        stationSettings,
        documents: { fssai: documents.fssai }
      };

      const res = await fetch("/api/outlets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json;
      try {
        json = await res.json();
      } catch (err) {
        // non-json response
        const text = await res.text();
        throw new Error(`Server returned non-JSON: ${text}`);
      }

      if (!res.ok) {
        console.error("/api/outlets error:", json);
        const msg = json?.error?.message || json?.error || JSON.stringify(json);
        setErrorMsg("Error saving outlet: " + msg);
        setLoading(false);
        return;
      }

      // success: json.data likely contains inserted row (because API uses Prefer=return=representation)
      const inserted = Array.isArray(json.data) && json.data.length ? json.data[0] : null;
      onCreate(inserted || { ...basic, ...stationSettings });
      resetAll();
      // close modal optionally
      onClose();
    } catch (err) {
      console.error("handleFinalSubmit:", err);
      setErrorMsg("Error finalizing outlet: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  }

  // fallback options if StationSearch not available
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

        {errorMsg && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

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

                {/* Primary: StationSearch client-side autocomplete */}
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

                {/* Fallback static select (uncomment to use fallback dropdown instead of StationSearch)
                <div className="mt-2">
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
                    {fallbackStationOptions.map
