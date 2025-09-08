// components/VendorEditModal.jsx
"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const storageBucket = "vendor-docs"; // create this bucket in Supabase console

const supabase = createClient(SUPA_URL, SUPA_ANON);

export default function VendorEditModal({ vendor, onClose, onSaved }) {
  const [active, setActive] = useState("basic");
  const [form, setForm] = useState(vendor || {});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    setForm(vendor || {});
  }, [vendor]);

  if (!vendor) return null;

  function setField(path, value) {
    setForm(prev => ({ ...prev, [path]: value }));
  }

  async function uploadFile(fieldKey, file) {
    if (!file) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      const filename = `${vendor.outlet_id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .upload(filename, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;
      const { data: urlData } = supabase.storage.from(storageBucket).getPublicUrl(data.path);
      setField(fieldKey, urlData.publicUrl);
    } catch (err) {
      console.error("Upload error", err);
      alert("Upload failed: " + (err?.message || err));
    } finally {
      setUploading(false);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 800);
    }
  }

  async function saveChanges() {
    try {
      const res = await fetch(`/api/vendors/${vendor.outlet_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Save failed");
      onSaved && onSaved();
      alert("Saved");
      onClose && onClose();
    } catch (err) {
      console.error(err);
      alert("Save failed: " + (err?.message || err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="ml-auto w-full max-w-4xl bg-white dark:bg-[#071824] p-6 overflow-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">Edit Outlet — {vendor.outlet_id}</h3>
            <div className="text-sm text-slate-500">{vendor.outlet_name}</div>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-[#06121a]"><X /></button>
        </div>

        <div className="mt-4 flex gap-6">
          <nav className="w-48">
            <TabButton label="Basic Info" active={active==="basic"} onClick={()=>setActive("basic")} />
            <TabButton label="Station Settings" active={active==="station"} onClick={()=>setActive("station")} />
            <TabButton label="Documents" active={active==="docs"} onClick={()=>setActive("docs")} />
            <TabButton label="Menu" active={active==="menu"} onClick={()=>setActive("menu")} />
            <TabButton label="Bank Details" active={active==="bank"} onClick={()=>setActive("bank")} />
            <TabButton label="Address" active={active==="addr"} onClick={()=>setActive("addr")} />
          </nav>

          <div className="flex-1">
            {active==="basic" && (
              <div className="space-y-3">
                <Input label="Outlet ID" value={form.outlet_id || ""} onChange={v=>setField("outlet_id", v)} disabled />
                <Input label="Outlet Name" value={form.outlet_name || ""} onChange={v=>setField("outlet_name", v)} />
                <Input label="Station Code" value={form.station_code || ""} onChange={v=>setField("station_code", v)} />
                <Input label="Station Name" value={form.station_name || ""} onChange={v=>setField("station_name", v)} />
                <Input label="Owner Name" value={form.owner_name || ""} onChange={v=>setField("owner_name", v)} />
                <Input label="Owner Mobile" value={form.owner_mobile || ""} onChange={v=>setField("owner_mobile", v)} />
                <Input label="Owner Email" value={form.owner_email || ""} onChange={v=>setField("owner_email", v)} />
                <div className="flex gap-2">
                  <Input label="Rating" value={form.rating || ""} onChange={v=>setField("rating", v)} />
                  <Select label="Status" value={form.status || "inactive"} onChange={v=>setField("status", v)} options={[{v:"active",t:"Active"},{v:"inactive",t:"Inactive"},{v:"pending",t:"Pending"}]} />
                </div>
              </div>
            )}

            {active==="station" && (
              <div className="space-y-3">
                <Input label="Start Time (HH:MM)" value={form.start_time || ""} onChange={v=>setField("start_time", v)} />
                <Input label="End Time (HH:MM)" value={form.end_time || ""} onChange={v=>setField("end_time", v)} />
                <Input label="Cutoff Minutes" type="number" value={form.cut_off_minutes || ""} onChange={v=>setField("cut_off_minutes", v)} />
                <Input label="Min Order Value" type="number" value={form.min_order_value || 0} onChange={v=>setField("min_order_value", v)} />
                <Input label="Delivery Charges" type="number" value={form.delivery_charges || 0} onChange={v=>setField("delivery_charges", v)} />
              </div>
            )}

            {active==="docs" && (
              <div className="space-y-4">
                <Input label="FSSAI No." value={form.fssai_no || ""} onChange={v=>setField("fssai_no", v)} />
                <div>
                  <label className="text-sm block mb-1">Upload FSSAI Copy</label>
                  <input type="file" onChange={e=>uploadFile("fssai_file", e.target.files?.[0])} />
                  {form.fssai_file && <a className="text-sm text-blue-600 block mt-1" href={form.fssai_file} target="_blank" rel="noreferrer">View uploaded</a>}
                </div>

                <Input label="GST No." value={form.gst_no || ""} onChange={v=>setField("gst_no", v)} />
                <div>
                  <label className="text-sm block mb-1">Upload GST Copy</label>
                  <input type="file" onChange={e=>uploadFile("gst_file", e.target.files?.[0])} />
                  {form.gst_file && <a className="text-sm text-blue-600 block mt-1" href={form.gst_file} target="_blank" rel="noreferrer">View uploaded</a>}
                </div>

                <Input label="PAN No." value={form.pan_no || ""} onChange={v=>setField("pan_no", v)} />
                <div>
                  <label className="text-sm block mb-1">Upload PAN Copy</label>
                  <input type="file" onChange={e=>uploadFile("pan_file", e.target.files?.[0])} />
                  {form.pan_file && <a className="text-sm text-blue-600 block mt-1" href={form.pan_file} target="_blank" rel="noreferrer">View uploaded</a>}
                </div>

                <div>
                  <label className="text-sm block mb-1">Kitchen Photos (up to 3)</label>
                  <input type="file" onChange={e=>uploadFile("kitchen_photo_1", e.target.files?.[0])} />
                  <input type="file" onChange={e=>uploadFile("kitchen_photo_2", e.target.files?.[0])} />
                  <input type="file" onChange={e=>uploadFile("kitchen_photo_3", e.target.files?.[0])} />
                </div>

                {uploading && <div>Uploading... {uploadProgress}%</div>}
              </div>
            )}

            {active==="menu" && (
              <div>
                <p className="text-sm text-slate-500">Menu editor placeholder — items are in separate table. Implement item list & item editor in a follow-up step.</p>
              </div>
            )}

            {active==="bank" && (
              <div className="space-y-3">
                <Input label="Account Holder" value={form.account_holder || ""} onChange={v=>setField("account_holder", v)} />
                <Select label="Bank" value={form.bank_name || ""} onChange={v=>setField("bank_name", v)} options={[
                  {v:"State Bank of India", t:"State Bank of India"},
                  {v:"HDFC Bank", t:"HDFC Bank"},
                  {v:"ICICI Bank", t:"ICICI Bank"},
                  {v:"Axis Bank", t:"Axis Bank"},
                  {v:"Other", t:"Other"}
                ]} />
                <Input label="Account Number" value={form.account_no || ""} onChange={v=>setField("account_no", v)} />
                <Input label="IFSC" value={form.ifsc || ""} onChange={v=>setField("ifsc", v)} />
                <Input label="Branch" value={form.branch || ""} onChange={v=>setField("branch", v)} />
              </div>
            )}

            {active==="addr" && (
              <div className="space-y-3">
                <Input label="Address Line 1" value={form.address_line1 || ""} onChange={v=>setField("address_line1", v)} />
                <Input label="Address Line 2" value={form.address_line2 || ""} onChange={v=>setField("address_line2", v)} />
                <Input label="City" value={form.city || ""} onChange={v=>setField("city", v)} />
                <Input label="Pincode" value={form.pincode || ""} onChange={v=>setField("pincode", v)} />
              </div>
            )}

            <div className="mt-6 flex gap-2">
              <button className="px-4 py-2 rounded bg-amber-400 text-black" onClick={saveChanges}>Save</button>
              <button className="px-4 py-2 rounded border" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* helpers */
function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-2 rounded ${active ? "bg-amber-100 dark:bg-[#06202a]" : "hover:bg-slate-50 dark:hover:bg-[#041827]"}`}>
      {label}
    </button>
  );
}
function Input({ label, value, onChange, disabled=false, type="text" }) {
  return (
    <label className="block">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <input disabled={disabled} value={value} onChange={e=>onChange(e.target.value)} className="w-full border p-2 rounded" type={type} />
    </label>
  );
}
function Select({ label, value, onChange, options=[] }) {
  return (
    <label className="block">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)} className="w-full border p-2 rounded">
        <option value="">Select</option>
        {options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </label>
  );
}
