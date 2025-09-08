// components/VendorsAdminShell.jsx
"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

// dynamic import small child components (they will be created later / or replaced)
const VendorsList = dynamic(() => import("./VendorsList"), { ssr: false });

export default function VendorsAdminShell() {
  // local state for search inputs
  const [outletId, setOutletId] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [stationName, setStationName] = useState("");
  const [fssai, setFssai] = useState("");
  const [ownerMobile, setOwnerMobile] = useState("");
  const [status, setStatus] = useState("");
  const [searchKey, setSearchKey] = useState(0); // bump to tell list to refresh
  const [showAdd, setShowAdd] = useState(false);

  function doSearch() {
    // bump searchKey so child VendorsList can refetch using these values (we'll pass them later)
    setSearchKey(k => k + 1);
    // later: we'll pass the actual filter values to VendorsList via props
  }

  function openAddOutlet() {
    setShowAdd(true);
  }

  function closeAddOutlet() {
    setShowAdd(false);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-3">Outlets / Vendors</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-slate-600">Search by Outlet ID</label>
            <input value={outletId} onChange={e=>setOutletId(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. RST123" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-600">Search by Station Code</label>
            <input value={stationCode} onChange={e=>setStationCode(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. NDLS" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-600">Search by Station Name</label>
            <input value={stationName} onChange={e=>setStationName(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. New Delhi" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-600">Search by FSSAI</label>
            <input value={fssai} onChange={e=>setFssai(e.target.value)} className="w-full border p-2 rounded" placeholder="FSSAI number" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-600">Search by Owner Mobile</label>
            <input value={ownerMobile} onChange={e=>setOwnerMobile(e.target.value)} className="w-full border p-2 rounded" placeholder="Owner mobile" />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-600">Search by Outlet Status</label>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full border p-2 rounded">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div>
            <button onClick={doSearch} className="px-4 py-2 bg-amber-400 rounded font-medium">Search</button>
          </div>
          <div>
            <button onClick={openAddOutlet} className="px-4 py-2 bg-green-600 text-white rounded">+ Add Outlet</button>
          </div>
        </div>
      </div>

      {/* Vendors list placeholder. We'll pass filters and searchKey in next steps */}
      <div>
        <VendorsList />
      </div>

      {/* Add outlet modal placeholder — we will implement modal later */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeAddOutlet} />
          <div className="bg-white rounded p-6 z-10 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-3">Add Outlet (placeholder)</h3>
            <p className="text-sm text-slate-600">Form will be implemented in next step.</p>
            <div className="mt-4 flex justify-end">
              <button onClick={closeAddOutlet} className="px-3 py-2 border rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
