"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import UI from "@/components/AdminUI";
import MenuItemFormModal from "./MenuItemFormModal";

const { AdminForm } = UI;

type Row = {
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
  const [editRow, setEditRow] = useState<Row | null>(null);

  const t = (s?: string | null) => (s ? s.slice(0, 5) : "—");
  const n = (x?: number | null) =>
    typeof x === "number" ? x.toFixed(2).replace(/\.00$/, "") : "—";
  const dt = (s?: string | null) => (s ? new Date(s).toLocaleString() : "—");

  async function load() {
    if (!code) return;
    setLoading(true);
    try {
      let query = supabase
        .from("RestroMenuItems")
        .select("*")
        .eq("restro_code", code);

      if (status) query = query.eq("status", status);

      const { data, error } = await query.order("id", { ascending: false });
      if (error) throw error;

      setRows((data as Row[]) ?? []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [code, status]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.item_name?.toLowerCase().includes(s) ||
        r.item_code?.toLowerCase().includes(s) ||
        r.item_category?.toLowerCase().includes(s) ||
        r.item_cuisine?.toLowerCase().includes(s) ||
        r.menu_type?.toLowerCase().includes(s)
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
    const { error } = await supabase
      .from("RestroMenuItems")
      .update({ status: to })
      .eq("id", row.id);

    if (!error) load();
    else alert(error.message);
  }

  async function deleteItem(row: Row) {
    if (!confirm(`Delete "${row.item_name}"?`)) return;

    const { error } = await supabase
      .from("RestroMenuItems")
      .update({ status: "DELETED" })
      .eq("id", row.id);

    if (!error) load();
    else alert(error.message);
  }

  return (
    <AdminForm>
      {/* 🔵 SKY CARD WRAPPER */}
      <div className="border rounded-md p-3 bg-sky-50 mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="font-semibold text-sm">Menu</h4>
            <p className="text-xs text-gray-500">
              Manage restaurant menu items
            </p>
          </div>

          <button
            type="button"
            className="bg-orange-600 text-white px-3 py-1.5 rounded text-sm"
            onClick={() => {
              setEditRow(null);
              setOpenModal(true);
            }}
          >
            Add New Item
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            placeholder="Search (code, name, category, cuisine, type)…"
            className="p-2 border rounded text-sm w-80"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="p-2 border rounded text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="">All</option>
            <option value="ON">Active</option>
            <option value="OFF">Inactive</option>
            <option value="DELETED">Deleted</option>
          </select>

          <button
            className="px-3 py-2 border rounded text-sm"
            onClick={load}
          >
            Search
          </button>

          <div className="ml-auto text-xs text-gray-600">
            Item {counts.total} • Active {counts.on} • Inactive {counts.off} •
            Deleted {counts.deleted}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded overflow-auto">
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <th className="p-2">Code</th>
                <th className="p-2">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Category</th>
                <th className="p-2">Cuisine</th>
                <th className="p-2">Type</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2 text-right">Base</th>
                <th className="p-2 text-right">GST%</th>
                <th className="p-2 text-right">Selling</th>
                <th className="p-2">Status</th>
                <th className="p-2">Edit</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="p-4 text-center">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} className="p-4 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2">{r.item_code}</td>
                    <td className="p-2 font-medium">{r.item_name}</td>
                    <td className="p-2 text-gray-600">
                      {r.item_description}
                    </td>
                    <td className="p-2">{r.item_category}</td>
                    <td className="p-2">{r.item_cuisine}</td>
                    <td className="p-2">{r.menu_type}</td>
                    <td className="p-2">{t(r.start_time)}</td>
                    <td className="p-2">{t(r.end_time)}</td>
                    <td className="p-2 text-right">{n(r.base_price)}</td>
                    <td className="p-2 text-right">{r.gst_percent ?? 0}</td>
                    <td className="p-2 text-right">
                      {n(r.selling_price)}
                    </td>

                    <td className="p-2">
                      {r.status === "ON" && (
                        <span className="text-green-700 font-semibold">
                          Active
                        </span>
                      )}
                      {r.status === "OFF" && (
                        <span className="text-orange-600 font-semibold">
                          Inactive
                        </span>
                      )}
                      {r.status === "DELETED" && (
                        <span className="text-red-600 font-semibold">
                          Deleted
                        </span>
                      )}
                    </td>

                    <td className="p-2">
                      <button
                        className="text-blue-600 underline text-xs"
                        onClick={() => {
                          setEditRow(r);
                          setOpenModal(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>

                    <td className="p-2 flex gap-2">
                      {r.status === "ON" ? (
                        <button
                          className="border px-2 py-1 text-xs rounded"
                          onClick={() => toggleStatus(r, "OFF")}
                        >
                          Deactivate
                        </button>
                      ) : r.status === "OFF" ? (
                        <button
                          className="border px-2 py-1 text-xs rounded"
                          onClick={() => toggleStatus(r, "ON")}
                        >
                          Activate
                        </button>
                      ) : null}

                      <button
                        className="border px-2 py-1 text-xs rounded text-red-600"
                        onClick={() => deleteItem(r)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <MenuItemFormModal
        open={openModal}
        restroCode={code}
        mode={editRow ? "edit" : "create"}
        initial={editRow ?? undefined}
        supabase={supabase}
        onClose={() => {
          setOpenModal(false);
          setEditRow(null);
        }}
        onSaved={load}
      />
    </AdminForm>
  );
}
