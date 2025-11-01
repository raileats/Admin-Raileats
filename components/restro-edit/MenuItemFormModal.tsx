"use client";
import React, { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  restroCode: string | number;
  onClose: () => void;
  onSaved: () => void;
};

const CATEGORY_OPTIONS = ["Veg", "Jain", "Non-Veg"] as const;
const CUISINE_OPTIONS = [
  "North Indian",
  "South Indian",
  "Chinese",
  "Multicuisine",
  "Italian",
  "Mughlai",
  "Continental",
  "Bengali",
  "Gujarati",
  "Maharashtrian",
] as const;
const MENU_TYPE_OPTIONS = [
  "Thalis",
  "Combos",
  "Breakfast",
  "Rice And Biryani",
  "Roti Paratha",
  "Pizza and Sandwiches",
  "Fast Food",
  "Burger",
  "Starters and Snacks",
  "Sweets",
  "Beverages",
  "Restro Specials",
] as const;

export default function MenuItemFormModal({ open, restroCode, onClose, onSaved }: Props) {
  // FORM STATE (blank by default)
  const [item_name, setItemName] = useState("");
  const [item_description, setItemDescription] = useState("");
  const [item_category, setItemCategory] = useState<string>("");
  const [item_cuisine, setItemCuisine] = useState<string>("");
  const [menu_type, setMenuType] = useState<string>("");
  const [start_time, setStartTime] = useState<string>("");
  const [end_time, setEndTime] = useState<string>("");
  const [base_price, setBasePrice] = useState<number | "">("");
  const [gst_percent, setGstPercent] = useState<number | "">("");
  const [restro_price, setRestroPrice] = useState<number | "">("");
  const [status, setStatus] = useState<"ON" | "OFF">("ON");

  // reset form every time modal opens
  useEffect(() => {
    if (open) {
      setItemName("");
      setItemDescription("");
      setItemCategory("");
      setItemCuisine("");
      setMenuType("");
      setStartTime("");
      setEndTime("");
      setBasePrice("");
      setGstPercent("");
      setRestroPrice("");
      setStatus("ON");
    }
  }, [open]);

  const selling_price = useMemo(() => {
    const base = Number(base_price || 0);
    const gst = Number(gst_percent || 0);
    if (!base || Number.isNaN(base)) return 0;
    return Math.round(base * (1 + gst / 100) * 100) / 100;
  }, [base_price, gst_percent]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  async function save() {
    try {
      setSaving(true);
      setErr(null);

      if (!item_name.trim()) throw new Error("Item Name required");

      const payload = {
        item_code: null, // auto / ignored by API
        item_name: item_name.trim(),
        item_description: item_description.trim() || null,
        item_category: item_category || null,
        item_cuisine: item_cuisine || null,
        menu_type: menu_type || null,
        start_time: start_time || null,
        end_time: end_time || null,
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
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose()}
        aria-label="Close"
      />
      {/* Modal */}
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
          {/* Name */}
          <div className="md:col-span-3">
            <label className="text-sm">Item Name</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={item_name}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Veg Mini Thali"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-3">
            <label className="text-sm">Item Description</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={item_description}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Short description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm">Item Category</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={item_category}
              onChange={(e) => setItemCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Cuisine */}
          <div>
            <label className="text-sm">Cuisine</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={item_cuisine}
              onChange={(e) => setItemCuisine(e.target.value)}
            >
              <option value="">Select cuisine</option>
              {CUISINE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Menu Type */}
          <div>
            <label className="text-sm">Menu Type</label>
            <select
              className="w-full rounded border px-3 py-2"
              value={menu_type}
              onChange={(e) => setMenuType(e.target.value)}
            >
              <option value="">Select menu type</option>
              {MENU_TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div>
            <label className="text-sm">Item Start Time</label>
            <input
              type="time"
              className="w-full rounded border px-3 py-2"
              value={start_time}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Item Closed Time</label>
            <input
              type="time"
              className="w-full rounded border px-3 py-2"
              value={end_time}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          {/* Prices */}
          <div>
            <label className="text-sm">Base Price</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={base_price}
              onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g., 100"
            />
          </div>
          <div>
            <label className="text-sm">GST %</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={gst_percent}
              onChange={(e) => setGstPercent(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="e.g., 7"
            />
          </div>
          <div>
            <label className="text-sm">Selling Price (auto)</label>
            <input className="w-full rounded border px-3 py-2 bg-gray-50" value={selling_price} readOnly />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm">Restro Price (internal)</label>
            <input
              type="number"
              className="w-full rounded border px-3 py-2"
              value={restro_price}
              onChange={(e) => setRestroPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="optional"
            />
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
