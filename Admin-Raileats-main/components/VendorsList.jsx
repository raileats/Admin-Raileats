// components/VendorsList.jsx
"use client";
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// relative import for modal inside components folder
const VendorEditModal = dynamic(() => import("./VendorEditModal"), { ssr: false });

export default function VendorsList({ refreshKey = 0 }) {
  const [vendors, setVendors] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [alpha, setAlpha] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [editingVendor, setEditingVendor] = useState(null);
  const pageSize = 20;

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, alpha, page, refreshKey]);

  async function fetchList() {
    try {
      const params = new URLSearchParams({
        q: q || "",
        status: status || "",
        alpha: alpha || "",
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      const res = await fetch("/api/vendors?" + params.toString());
      if (!res.ok) {
        const txt = await res.text();
        console.error("Vendors fetch failed:", res.status, txt);
        setVendors([]);
        setCount(0);
        return;
      }
      const json = await res.json();
      setVendors(json.data || []);
      setCount(json.count || 0);
    } catch (err) {
      console.error("Vendors fetch error:", err);
      setVendors([]);
      setCount(0);
    }
  }

  async function toggleOnline(v) {
    try {
      const newStatus = v.status === "active" ? "inactive" : "active";
      const res = await fetch(`/api/vendors/${encodeURIComponent(v.outlet_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const txt = await res.text();
        alert("Update failed: " + txt);
      }
      fetchList();
    } catch (err) {
      console.error("toggleOnline error:", err);
      alert("Update failed");
    }
  }

  function openEdit(v) {
    setEditingVendor(v);
  }

  function onSavedCallback() {
    fetchList();
    setEditingVendor(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Search by Outlet ID / Name / Owner Mobile"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <select
          className="border p-2 rounded"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex gap-1 flex-wrap">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((ltr) => (
          <button
            key={ltr}
            onClick={() => { setAlpha(ltr); setPage(1); }}
            className={`px-2 py-1 rounded ${alpha === ltr ? "bg-amber-400" : "bg-gray-100"}`}
          >
            {ltr}
          </button>
        ))}
        <button onClick={() => { setAlpha(""); setPage(1); }} className="px-2 py-1 bg-gray-200 rounded">Clear</button>
      </div>

      <div className="overflow-auto bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Outlet Id</th>
              <th className="p-2 border">Outlet Name</th>
              <th className="p-2 border">Station (Code - Name)</th>
              <th className="p-2 border">FSSAI (Expiry)</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td className="p-4 text-center text-sm text-slate-500" colSpan={6}>No vendors found</td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.outlet_id} className="odd:bg-white even:bg-slate-50">
                  <td className="p-2 border">{v.outlet_id}</td>
                  <td className="p-2 border">{v.outlet_name}</td>
                  <td className="p-2 border">{v.station_code} - {v.station_name}</td>
                  <td className="p-2 border">{v.fssai_no}{v.fssai_expiry ? ` (${v.fssai_expiry.split("T")[0]})` : ""}</td>
                  <td className="p-2 border">
                    <button onClick={() => toggleOnline(v)} className={`px-2 py-1 rounded ${v.status==="active" ? "bg-green-500 text-white" : "bg-gray-200"}`}>
                      {v.status === "active" ? "On" : "Off"}
                    </button>
                  </td>
                  <td className="p-2 border">
                    <button
                      className="px-2 py-1 text-xs bg-amber-400 rounded"
                      onClick={() => openEdit(v)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 items-center">
        <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2 py-1 border rounded">Prev</button>
        <span>Page {page} / {Math.max(1, Math.ceil(count / pageSize))}</span>
        <button disabled={page * pageSize >= count} onClick={() => setPage(p => p + 1)} className="px-2 py-1 border rounded">Next</button>
      </div>

      {editingVendor && (
        <VendorEditModal
          vendor={editingVendor}
          onClose={() => setEditingVendor(null)}
          onSaved={onSavedCallback}
        />
      )}
    </div>
  );
}
