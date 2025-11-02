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
  menu_type?: string | null;
  start_time?: string | null;  // "HH:MM:SS"
  end_time?: string | null;    // "HH:MM:SS"
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

  // ---------- helpers ----------
  const t = (s?: string | null) => (s ? s.slice(0, 5) : "—"); // "HH:MM"
  const n = (x?: number | null) =>
    typeof x === "number" ? Number(x).toFixed(2).replace(/\.00$/, "") : "—";
  const dt = (s?: string | null) =>
    s ? new Date(s).toLocaleString() : "—";

  // load directly from Supabase (restro_code wise)
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
      setRows((data as Row[]) ?? []);
    } catch (e) {
      console.error("Menu load failed:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, status]);

  // client filter
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.item_name?.toLowerCase().includes(s) ||
        r.item_code?.toLowerCase().includes(s) ||
        r.item_category?.toLowerCase().includes(s) ||
        r.item_cuisine?.toLowerCase().includes(s) ||
        (r.menu_type ?? "").toLowerCase().includes(s)
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
    else alert(error.message || "Failed to update");
  }

  async function deleteItem(row: Row) {
    if (!confirm(`Delete "${row.item_name}"?`)) return;
    const { error } = await supabase
      .from("RestroMenuItems")
      .update({ status: "DELETED" })
      .eq("id", row.id);
    if (!error) load();
    else alert(error.message || "Failed to delete");
  }

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            placeholder="Search (code, name, category, cuisine, type)…"
            className="w-[360px] max-w-[70vw] rounded-md border px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <select
            className="rounded-md border px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
          >
            <option value="">All</option>
            <option value="ON">On</option>
            <option value="OFF">Off</option>
            <option value="DELETED">Deleted</option>
          </select>
          <button
            type="button"
            className="rounded-md border px-3 py-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              load();
            }}
          >
            Search
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Item Count {counts.total} • Active {counts.on} • Deactive {counts.off} • Deleted {counts.deleted}
          </div>
          <button
            type="button"
            className="rounded-md bg-orange-600 text-white px-4 py-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenModal(true);
            }}
          >
            Add New Item
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded border">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">Item Code</th>
              <th className="p-2">Item Name</th>
              <th className="p-2">Item Description</th>
              <th className="p-2">Item Category</th>
              <th className="p-2">Cuisine</th>
              <th className="p-2">Menu Type</th>
              <th className="p-2">Item Start</th>
              <th className="p-2">Item Closed</th>
              <th className="p-2 text-right">Restro Price</th>
              <th className="p-2 text-right">Base Price</th>
              <th className="p-2 text-right">GST %</th>
              <th className="p-2 text-right">Selling Price</th>
              <th className="p-2">Status</th>
              <th className="p-2">Created</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Edit</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={17} className="p-3 text-center text-gray-500">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={17} className="p-3 text-center text-gray-500">No items.</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.item_code}</td>
                  <td className="p-2 font-medium">{r.item_name}</td>
                  <td className="p-2 text-gray-600">{r.item_description}</td>
                  <td className="p-2">{r.item_category}</td>
                  <td className="p-2">{r.item_cuisine}</td>
                  <td className="p-2">{r.menu_type ?? "—"}</td>
                  <td className="p-2">{t(r.start_time)}</td>
                  <td className="p-2">{t(r.end_time)}</td>
                  <td className="p-2 text-right">{n(r.restro_price)}</td>
                  <td className="p-2 text-right">{n(r.base_price)}</td>
                  <td className="p-2 text-right">{typeof r.gst_percent === "number" ? r.gst_percent : 0}</td>
                  <td className="p-2 text-right">{n(r.selling_price)}</td>
                  <td className="p-2">
                    {r.status === "ON" && <span className="rounded bg-sky-100 px-2 py-1 text-sky-700">On</span>}
                    {r.status === "OFF" && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Off</span>}
                    {r.status === "DELETED" && <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">Deleted</span>}
                  </td>
                  <td className="p-2">{dt(r.created_at)}</td>
                  <td className="p-2">{dt(r.updated_at)}</td>

                  {/* Pencil edit icon (UI) */}
                  <td className="p-2">
                    <button
                      type="button"
                      title="Edit"
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() => alert("Edit form coming soon")}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"
                        viewBox="0 0 20 20" fill="currentColor">
                        <path d="M17.414 2.586a2 2 0 010 2.828l-1.586 1.586-2.828-2.828L14.586 2.586a2 2 0 012.828 0zM12.293 5.293l2.828 2.828L7.414 15.828a2 2 0 01-.828.5l-3 1a1 1 0 01-1.266-1.266l1-3a2 2 0 01.5-.828l7.473-7.473z" />
                      </svg>
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="p-2">
                    <div className="flex gap-2">
                      {r.status !== "DELETED" && (
                        r.status === "ON" ? (
                          <button
                            type="button"
                            className="rounded border px-2 py-1"
                            onClick={() => toggleStatus(r, "OFF")}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded border px-2 py-1"
                            onClick={() => toggleStatus(r, "ON")}
                          >
                            Activate
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        className="rounded border px-2 py-1 text-rose-700"
                        onClick={() => deleteItem(r)}
                      >
                        Delete
                      </button>
                    </div>
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
