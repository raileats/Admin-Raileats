// components/VendorEditModal.jsx
"use client";
import React, { useEffect, useState } from "react";

export default function VendorEditModal({ vendor, onClose, onSaved }) {
  const [form, setForm] = useState({
    outlet_id: "",
    outlet_name: "",
    station_code: "",
    station_name: "",
    owner_name: "",
    owner_mobile: "",
    owner_email: "",
    fssai_no: "",
    fssai_expiry: "",
    status: "inactive",
    min_order_value: 0,
    delivery_charges: 0,
    start_time: "",
    end_time: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      setForm(prev => ({ ...prev, ...vendor }));
    }
  }, [vendor]);

  if (!vendor) return null;

  function setField(key, val) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      const res = await fetch(`/api/vendors/${encodeURIComponent(vendor.outlet_id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(()=>({}));
      if (!res.ok) {
        console.error("Save failed", j);
        alert("Save failed: " + (j?.error || res.statusText));
        setSaving(false);
        return;
      }
      // success
      onSaved && onSaved();
      setSaving(false);
      onClose && onClose();
    } catch (err) {
      console.error("Save error", err);
      alert("Save error: " + String(err));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-white rounded shadow p-6 overflow-auto max-h-[90vh]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Edit Outlet — {vendor.outlet_id}</h3>
            <div className="text-sm text-slate-500">{vendor.outlet_name}</div>
          </div>
          <div>
            <button onClick={onClose} className="px-2 py-1 rounded border">Close</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Outlet Name</div>
            <input className="w-full border p-2 rounded" value={form.outlet_name || ""} onChange={e=>setField("outlet_name", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Outlet ID</div>
            <input className="w-full border p-2 rounded bg-gray-50" value={form.outlet_id || ""} readOnly />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Station Code</div>
            <input className="w-full border p-2 rounded" value={form.station_code || ""} onChange={e=>setField("station_code", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Station Name</div>
            <input className="w-full border p-2 rounded" value={form.station_name || ""} onChange={e=>setField("station_name", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Owner Name</div>
            <input className="w-full border p-2 rounded" value={form.owner_name || ""} onChange={e=>setField("owner_name", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Owner Mobile</div>
            <input className="w-full border p-2 rounded" value={form.owner_mobile || ""} onChange={e=>setField("owner_mobile", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Owner Email</div>
            <input className="w-full border p-2 rounded" value={form.owner_email || ""} onChange={e=>setField("owner_email", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Status</div>
            <select className="w-full border p-2 rounded" value={form.status || "inactive"} onChange={e=>setField("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">FSSAI No.</div>
            <input className="w-full border p-2 rounded" value={form.fssai_no || ""} onChange={e=>setField("fssai_no", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">FSSAI Expiry</div>
            <input type="date" className="w-full border p-2 rounded" value={form.fssai_expiry ? form.fssai_expiry.split("T")[0] : ""} onChange={e=>setField("fssai_expiry", e.target.value)} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Min Order Value</div>
            <input type="number" className="w-full border p-2 rounded" value={form.min_order_value || 0} onChange={e=>setField("min_order_value", Number(e.target.value))} />
          </label>

          <label className="block">
            <div className="text-sm text-slate-600 mb-1">Delivery Charges</div>
            <input type="number" className="w-full border p-2 rounded" value={form.delivery_charges || 0} onChange={e=>setField("delivery_charges", Number(e.target.value))} />
          </label>

          <label className="block col-span-1 md:col-span-2">
            <div className="text-sm text-slate-600 mb-1">AM - PM Time (eg. 09:00 - 21:00)</div>
            <input className="w-full border p-2 rounded" placeholder="09:00 - 21:00" value={`${form.start_time || ""} ${form.end_time ? "- " + form.end_time : ""}`} onChange={e=>{
              // basic parse: split on '-'
              const txt = e.target.value;
              const parts = txt.split("-");
              setField("start_time", parts[0]?.trim() || "");
              setField("end_time", parts[1]?.trim() || "");
            }} />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-amber-400">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
