"use client";
import React, { useState, useEffect } from "react";

export default function VendorsList() {
  const [vendors, setVendors] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [alpha, setAlpha] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchList();
  }, [q, status, alpha, page]);

  async function fetchList() {
    const params = new URLSearchParams({
      q, status, alpha,
      page: page.toString(),
      pageSize: "20"
    });
    const res = await fetch("/api/vendors?" + params.toString());
    const json = await res.json();
    setVendors(json.data || []);
    setCount(json.count || 0);
  }

  async function toggleOnline(v) {
    const newStatus = v.status === "active" ? "inactive" : "active";
    await fetch(`/api/vendors/${v.outlet_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    fetchList();
  }

  function openEdit(v) {
    alert("Open edit modal for " + v.outlet_name);
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <input
          className="border p-2 rounded flex-1"
          placeholder="Search by Outlet ID / Name / Owner Mobile"
          value={q}
          onChange={(e) => setQ(e.target.value)}
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
            className={`px-2 py-1 rounded ${alpha===ltr ? "bg-amber-400" : "bg-gray-100"}`}
          >
            {ltr}
          </button>
        ))}
        <button onClick={() => setAlpha("")} className="px-2 py-1 bg-gray-200 rounded">Clear</button>
      </div>

      {/* Table */}
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Outlet Id</th>
            <th className="p-2 border">Station</th>
            <th className="p-2 border">Owner</th>
            <th className="p-2 border">Mobile</th>
            <th className="p-2 border">FSSAI</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.outlet_id}>
              <td className="p-2 border">{v.outlet_id}</td>
              <td className="p-2 border">{v.station_code}</td>
              <td className="p-2 border">{v.owner_name}</td>
              <td className="p-2 border">{v.owner_mobile}</td>
              <td className="p-2 border">{v.fssai_no}</td>
              <td className="p-2 border">{v.status}</td>
              <td className="p-2 border">
                <button
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded mr-1"
                  onClick={() => toggleOnline(v)}
                >
                  Toggle
                </button>
                <button
                  className="px-2 py-1 text-xs bg-amber-400 rounded"
                  onClick={() => openEdit(v)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex gap-2 items-center">
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2 py-1 border rounded">Prev</button>
        <span>Page {page} / {Math.ceil(count/20) || 1}</span>
        <button disabled={page*20>=count} onClick={()=>setPage(p=>p+1)} className="px-2 py-1 border rounded">Next</button>
      </div>
    </div>
  );
}
