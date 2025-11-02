"use client";
import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import MenuItemFormModal from "./MenuItemFormModal";

type Row = {
  id: number;
  restro_code: string;
  item_code: string;
  item_name: string;
  item_description?: string | null;
  item_category?: string | null;
  item_cuisine?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  restro_price?: number | null;
  base_price?: number | null;
  gst_percent?: number | null;
  selling_price?: number | null;
  status: "ON" | "OFF" | "DELETED";
};

export default function MenuTab({ restroCode }: { restroCode?: string }) {
  const code = String(restroCode ?? "");

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "ON" | "OFF" | "DELETED">("");
  const [openModal, setOpenModal] = useState(false);

  async function load() {
    if (!code) return;
    setLoading(true);

    try {
      let query = supabase
        .from("RestroMenuItems")
        .select("*")
        .eq("restro_code", code);

      if (status === "ON" || status === "OFF" || status === "DELETED") {
        query = query.eq("status", status);
      }

      const { data, error } = await query.order("id", { ascending: false });

      if (error) throw error;
      setRows(data ?? []);
    } catch (err) {
      console.error(err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [code, status]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.item_name?.toLowerCase().includes(s) ||
        r.item_code?.toLowerCase().includes(s) ||
        r.item_category?.toLowerCase().includes(s) ||
        r.item_cuisine?.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      on: rows.filter((r) => r.status === "ON").length,
      off: rows.filter((r) => r.status === "OFF").length,
      deleted: rows.filter((r) => r.status === "DELETED").length,
    }),
    [rows]
  );

  async function toggleStatus(row: Row, to: "ON" | "OFF") {
    await supabase
      .from("RestroMenuItems")
      .update({ status: to })
      .eq("id", row.id);

    load();
  }

  async function deleteItem(row: Row) {
    if (!confirm(`Delete "${row.item_name}"?`)) return;
    await supabase
      .from("RestroMenuItems")
      .update({ status: "DELETED" })
      .eq("id", row.id);

    load();
  }

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <input
            placeholder="Search..."
            className="border px-3 py-2 rounded-md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border px-3 py-2 rounded-md"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="">All</option>
            <option value="ON">On</option>
            <option value="OFF">Off</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>

        <button
          className="bg-orange-600 text-white px-4 py-2 rounded-md"
          onClick={() => setOpenModal(true)}
        >
          Add New Item
        </button>
      </div>

      {/* Table */}
      <div className="border rounded overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2">Item Code</th>
              <th className="p-2">Item Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Cuisine</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-3">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-3">
                  No items
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.item_code}</td>
                  <td className="p-2">{r.item_name}</td>
                  <td className="p-2">{r.item_category}</td>
                  <td className="p-2">{r.item_cuisine}</td>
                  <td className="p-2 text-right">{r.selling_price}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2 flex gap-2">
                    <button className="underline" onClick={() => toggleStatus(r, r.status === "ON" ? "OFF" : "ON")}>
                      Toggle
                    </button>
                    <button className="text-red-600 underline" onClick={() => deleteItem(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MenuItemFormModal
        open={openModal}
        restroCode={code}
        onClose={() => setOpenModal(false)}
        onSaved={load}
      />
    </div>
  );
}
