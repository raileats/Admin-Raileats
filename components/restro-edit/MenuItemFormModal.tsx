"use client";
import React, { useState, useMemo } from "react";

type Props = {
  open: boolean;
  restroCode: string | number;
  onClose: () => void;
  onSaved: () => void;
};

export default function MenuItemFormModal({ open, restroCode, onClose, onSaved }: Props) {
  const [item_code, setItemCode] = useState("");
  const [item_name, setItemName] = useState("");
  const [item_description, setItemDescription] = useState("");
  const [item_category, setItemCategory] = useState("Veg");
  const [item_cuisine, setItemCuisine] = useState("North Indian");
  const [start_time, setStartTime] = useState("10:00");
  const [end_time, setEndTime] = useState("22:00");
  const [base_price, setBasePrice] = useState<number | "">("");
  const [gst_percent, setGstPercent] = useState<number | "">(7);
  const [restro_price, setRestroPrice] = useState<number | "">("");
  const [status, setStatus] = useState<"ON" | "OFF">("ON");

  const selling_price = useMemo(() => {
    const base = Number(base_price || 0);
    const gst = Number(gst_percent || 0);
    if (Number.isNaN(base)) return 0;
    return Math.round(base * (1 + gst / 100) * 100) / 100;
  }, [base_price, gst_percent]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return null;

  async function save() {
    try {
      setSaving(true);
      setErr(null);
      if (!item_code || !item_name) throw new Error("Item Code & Name required");

      const payload = {
        item_code, item_name,
        item_description: item_description.trim() || null,
        item_category, item_cuisine,
        start_time, end_time,
        base_price: base_price === "" ? null : Number(base_price),
        restro_price: restro_price === "" ? null : Number(restro_price),
        gst_percent: gst_percent === "" ? 0 : Number(gst_percent),
        status,
      };

      const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}/menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.ok) throw new Error(j?.error || `Save failed (${res.status})`);
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose()}
        aria-label="Close"
      />
      {/* modal */}
      <div className="relative z-10 w-[980px] max-w-[96vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Item</h2>
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => !saving && onClose()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className="text-sm">Item Code</label>
            <input className="w-full rounded border px-3 py-2" value={item_code} onChange={e=>setItemCode(e.target.value)} />
          </div>
          <div className="md:col-span-2"><label className="text-sm">Item Name</label>
            <input className="w-full rounded border px-3 py-2" value={item_name} onChange={e=>setItemName(e.target.value)} />
          </div>
          <div className="md:col-span-3"><label className="text-sm">Item Description</label>
            <input className="w-full rounded border px-3 py-2" value={item_description} onChange={e=>setItemDescription(e.target.value)} />
          </div>

          <div><label className="text-sm">Item Category</label>
            <input className="w-full rounded border px-3 py-2" value={item_category} onChange={e=>setItemCategory(e.target.value)} />
          </div>
          <div><label className="text-sm">Cuisine</label>
            <input className="w-full rounded border px-3 py-2" value={item_cuisine} onChange={e=>setItemCuisine(e.target.value)} />
          </div>
          <div><label className="text-sm">Status</label>
            <select className="w-full rounded border px-3 py-2" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="ON">On</option>
              <option value="OFF">Off</option>
            </select>
          </div>

          <div><label className="text-sm">Item Start Time</label>
            <input type="time" className="w-full rounded border px-3 py-2" value={start_time} onChange={e=>setStartTime(e.target.value)} />
          </div>
          <div><label className="text-sm">Item Closed Time</label>
            <input type="time" className="w-full rounded border px-3 py-2" value={end_time} onChange={e=>setEndTime(e.target.value)} />
          </div>

          <div><label className="text-sm">Base Price</label>
            <input type="number" className="w-full rounded border px-3 py-2" value={base_price} onChange={e=>setBasePrice(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div><label className="text-sm">GST %</label>
            <input type="number" className="w-full rounded border px-3 py-2" value={gst_percent} onChange={e=>setGstPercent(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div><label className="text-sm">Selling Price (auto)</label>
            <input className="w-full rounded border px-3 py-2 bg-gray-50" value={selling_price} readOnly />
          </div>

          <div className="md:col-span-3"><label className="text-sm">Restro Price (internal)</label>
            <input type="number" className="w-full rounded border px-3 py-2" value={restro_price} onChange={e=>setRestroPrice(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="rounded-md border px-4 py-2" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
