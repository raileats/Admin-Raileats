"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type BaseRow = {
  id: number;
  restro_code: string;
  item_code: string;
  item_name: string;
  item_description?: string | null;
  item_category?: string | null;
  item_cuisine?: string | null;
  menu_type?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  restro_price?: number | null;
  base_price?: number | null;
  gst_percent?: number | null;
  selling_price?: number | null;
  status: "ON" | "OFF" | "DELETED";
  created_at?: string | null;
  updated_at?: string | null;
};

type Props = {
  open: boolean;
  restroCode: string | number;
  onClose: () => void;
  onSaved: () => void;
  mode?: "create" | "edit";
  initial?: Partial<BaseRow> | null;
  supabase?: SupabaseClient;
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
  "Bakery",
] as const;

export default function MenuItemFormModal({
  open,
  restroCode,
  onClose,
  onSaved,
  mode = "create",
  initial = null,
  supabase: sbFromParent,
}: Props) {
  const supabase =
    sbFromParent ??
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

  const [item_name, setItemName] = useState("");
  const [item_description, setItemDescription] = useState("");
  const [item_category, setItemCategory] = useState<string>("");
  const [item_cuisine, setItemCuisine] = useState<string>("");
  const [menu_type, setMenuType] = useState<string>("");
  const [start_time, setStartTime] = useState<string>("");
  const [end_time, setEndTime] = useState<string>("");
  const [restro_price, setRestroPrice] = useState<number | "">("");
  const [base_price, setBasePrice] = useState<number | "">("");
  const [gst_percent, setGstPercent] = useState<number | "">(5);
  const [status, setStatus] = useState<"ON" | "OFF">("ON");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setItemName(initial.item_name ?? "");
      setItemDescription(initial.item_description ?? "");
      setItemCategory(initial.item_category ?? "");
      setItemCuisine(initial.item_cuisine ?? "");
      setMenuType(initial.menu_type ?? "");
      setStartTime((initial.start_time ?? "").slice(0, 5));
      setEndTime((initial.end_time ?? "").slice(0, 5));
      setRestroPrice(initial.restro_price == null ? "" : Number(initial.restro_price));
      setBasePrice(initial.base_price == null ? "" : Number(initial.base_price));
      setGstPercent(
        (initial.gst_percent == null ? 5 : Number(initial.gst_percent)) as number
      );
      setStatus((initial.status as any) === "OFF" ? "OFF" : "ON");
    } else {
      setItemName("");
      setItemDescription("");
      setItemCategory("");
      setItemCuisine("");
      setMenuType("");
      setStartTime("");
      setEndTime("");
      setRestroPrice("");
      setBasePrice("");
      setGstPercent(5);
      setStatus("ON");
    }
  }, [open, mode, initial]);

  const selling_price = useMemo(() => {
    const base = Number(base_price || 0);
    const gst = Number(gst_percent || 0);
    if (!base || Number.isNaN(base)) return 0;
    return Math.round(base * (1 + gst / 100) * 100) / 100;
  }, [base_price, gst_percent]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return null;

  function toNumOrEmpty(val: string) {
    const cleaned = val.replace(/[^\d.]/g, "");
    if (cleaned === "") return "";
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : "";
  }

  async function handleSave() {
    try {
      setSaving(true);
      setErr(null);
      if (!item_name.trim()) throw new Error("Item Name required");

      // base payload (shared)
      const basePayload = {
        item_name: item_name.trim(),
        item_description: item_description.trim() || null,
        item_category: item_category || null,
        item_cuisine: item_cuisine || null,
        menu_type: menu_type || null,
        start_time: start_time || null,
        end_time: end_time || null,
        restro_price: restro_price === "" ? null : Number(restro_price),
        base_price: base_price === "" ? null : Number(base_price),
        gst_percent: gst_percent === "" ? 0 : Number(gst_percent),
        selling_price, // keep computed price updated
        status,
      };

      if (mode === "edit" && initial?.id) {
        // EDIT: DO NOT send item_code -> keeps NOT NULL column intact
        const { error } = await supabase
          .from("RestroMenuItems")
          .update(basePayload as any)
          .eq("id", initial.id);
        if (error) throw error;
      } else {
        // CREATE: route handles auto item_code
        const payloadCreate = { ...basePayload, item_code: null };
        const res = await fetch(
          `/api/restros/${encodeURIComponent(String(restroCode))}/menu`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadCreate),
          }
        );
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j?.ok)
          throw new Error(j?.error || `Save failed (${res.status})`);
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const smallInput = "w-full md:w-40 rounded border px-2 py-1.5";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[1000] flex items-center justify-center">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={() => !saving && onClose()} aria-label="Close" />
      <div className="relative z-10 w-[980px] max-w-[96vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{mode === "edit" ? "Edit Item" : "Add New Item"}</h2>
          <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => !saving && onClose()} aria-label="Close">✕</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="text-sm">Item Name</label>
            <input className="w-full rounded border px-3 py-2" value={item_name} onChange={(e) => setItemName(e.target.value)} placeholder="e.g., Veg Mini Thali" />
          </div>

          <div className="md:col-span-3">
            <label className="text-sm">Item Description</label>
            <input className="w-full rounded border px-3 py-2" value={item_description} onChange={(e) => setItemDescription(e.target.value)} placeholder="Short description" />
          </div>

          <div>
            <label className="text-sm">Item Category</label>
            <select className="w-full rounded border px-3 py-2" value={item_category} onChange={(e) => setItemCategory(e.target.value)}>
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm">Cuisine</label>
            <select className="w-full rounded border px-3 py-2" value={item_cuisine} onChange={(e) => setItemCuisine(e.target.value)}>
              <option value="">Select cuisine</option>
              {CUISINE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm">Menu Type</label>
            <select className="w-full rounded border px-3 py-2" value={menu_type} onChange={(e) => setMenuType(e.target.value)}>
              <option value="">Select menu type</option>
              {MENU_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm">Item Start Time</label>
            <input type="time" className="w-full rounded border px-3 py-2" value={start_time} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="text-sm">Item Closed Time</label>
            <input type="time" className="w-full rounded border px-3 py-2" value={end_time} onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <div className="md:col-span-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-sm">Restro Price (internal)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  className={smallInput}
                  value={restro_price === "" ? "" : String(restro_price)}
                  onChange={(e) => setRestroPrice(toNumOrEmpty(e.target.value))}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-sm">Base Price</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  className={smallInput}
                  value={base_price === "" ? "" : String(base_price)}
                  onChange={(e) => setBasePrice(toNumOrEmpty(e.target.value))}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="text-sm">GST %</label>
                <select className={smallInput} value={String(gst_percent === "" ? "" : gst_percent)} onChange={(e) => setGstPercent(e.target.value === "" ? "" : Number(e.target.value))}>
                  <option value="5">5</option>
                  <option value="12">12</option>
                  <option value="18">18</option>
                </select>
              </div>
              <div>
                <label className="text-sm">Selling Price (auto)</label>
                <input className={smallInput + " bg-gray-50"} value={selling_price} readOnly />
              </div>
              <div>
                <label className="text-sm">Status</label>
                <select className={smallInput} value={status} onChange={(e) => setStatus(e.target.value as "ON" | "OFF")}>
                  <option value="ON">On</option>
                  <option value="OFF">Off</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="rounded-md border px-4 py-2" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className="rounded-md bg-blue-600 px-4 py-2 text-white" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : mode === "edit" ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
