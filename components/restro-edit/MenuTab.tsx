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
  deleted_at?: string | null;
};

export default function MenuTab({ restroCode }: { restroCode?: string }) {
  const code = String(restroCode ?? "");
  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
      ),
    []
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | "ON" | "OFF" | "DELETED">("");
  const [openModal, setOpenModal] = useState(false);

  // Load from Supabase (outlet-wise)
  async function load() {
    if (!code) return;
    setLoading(true);
    try {
      let query = supabase
        .from("RestroMenuItems")
        .select("*")
        .eq("restro_code", code);

      // default: show not-deleted
      if (status === "DELETED") {
        query = query.not("deleted_at", "is", null);
      } else {
        query = query.is("deleted_at", null);
        if (status === "ON" || status === "OFF") {
          query = query.eq("status", status);
        }
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
  }, [code, status]); // reload on outlet/status change

  // Client-side search filter
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
      deleted: rows.filter((r) => r.deleted_at).length,
    }),
    [rows]
  );

  // Update status directly in Supabase
  async function toggleStatus(row: Row, to: "ON" | "OFF") {
    try {
      const { error } = await supabase
        .from("RestroMenuItems")
        .update({ status: to })
        .eq("id", row.id)
        .is("deleted_at", null);

      if (error) throw error;
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to update status");
    }
  }

  // Soft delete
  async function deleteItem(row: Row) {
    if (!confirm(`Delete "${row.item_name}"?`)) return;
    try {
      const { error } = await supabase
        .from("RestroMenuItems")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      await load();
    } catch (e: any) {
      alert(e?.message || "Failed to delete");
    }
  }

  return (
    <div className="space-y-3">
      {/* top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <input
            placeholder="Search (code, name, category, cuisine)…"
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
            Item Count {counts.total} • Active {counts.on} • Deactive {counts.off} • Deleted{" "}
            {counts.deleted}
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

      {/* table */}
      <div className="overflow-auto rounded border">
        <table className="min-w-[980px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="p-2">Item Code</th>
              <th className="p-2">Item Name</th>
              <th className="p-2">Item Description</th>
              <th className="p-2">Item Category</th>
              <th className="p-2">Cuisine</th>
              <th className="p-2">Item Start</th>
              <th className="p-2">Item Closed</th>
              <th className="p-2 text-right">Restro Price</th>
              <th className="p-2 text-right">Base Price</th>
              <th className="p-2 text-right">GST %</th>
              <th className="p-2 text-right">Selling Price</th>
              <th className="p-2">Status</th>
              <th className="p-2">Edit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={13} className="p-3 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="p-3 text-center text-gray-500">
                  No items.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.item_code}</td>
                  <td className="p-2 font-medium">{r.item_name}</td>
                  <td className="p-2 text-gray-600">{r.item_description}</td>
                  <td className="p-2">{r.item_category}</td>
                  <td className="p-2">{r.item_cuisine}</td>
                  <td className="p-2">{r.start_time?.slice(0, 5) ?? "—"}</td>
                  <td className="p-2">{r.end_time?.slice(0, 5) ?? "—"}</td>
                  <td className="p-2 text-right">{r.restro_price ?? "—"}</td>
                  <td className="p-2 text-right">{r.base_price ?? "—"}</td>
                  <td className="p-2 text-right">{r.gst_percent ?? 0}</td>
                  <td className="p-2 text-right">{r.selling_price ?? "—"}</td>
                  <td className="p-2">
                    {r.status === "ON" && (
                      <span className="rounded bg-sky-100 px-2 py-1 text-sky-700">On</span>
                    )}
                    {r.status === "OFF" && (
                      <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Off</span>
                    )}
                    {r.deleted_at && (
                      <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">Deleted</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      {!r.deleted_at && (
                        <>
                          {r.status === "ON" ? (
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
                          )}
                        </>
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
