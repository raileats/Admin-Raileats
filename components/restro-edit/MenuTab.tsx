"use client";
import React, { useEffect, useMemo, useState } from "react";
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
  status: "ON"|"OFF"|"DELETED";
};

export default function MenuTab({ restroCode }: { restroCode?: string }) {
  const code = String(restroCode ?? "");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<""|"ON"|"OFF"|"DELETED">("");
  const [openModal, setOpenModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const url = new URL(`/api/restros/${encodeURIComponent(code)}/menu`, window.location.origin);
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (status) url.searchParams.set("status", status);
      const res = await fetch(url.toString(), { cache: "no-store" });
      const j = await res.json().catch(()=> ({}));
      if (res.ok && j?.ok) setRows(j.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (code) load(); }, [code, status]); // initial + status change

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r =>
      r.item_name?.toLowerCase().includes(s) ||
      r.item_code?.toLowerCase().includes(s) ||
      r.item_category?.toLowerCase().includes(s) ||
      r.item_cuisine?.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const counts = useMemo(() => ({
    total: rows.length,
    on: rows.filter(r=>r.status==="ON").length,
    off: rows.filter(r=>r.status==="OFF").length,
    deleted: rows.filter(r=>r.status==="DELETED").length,
  }), [rows]);

  async function toggleStatus(row: Row, to: "ON"|"OFF") {
    const res = await fetch(`/api/restros/${encodeURIComponent(code)}/menu/${row.id}`, {
      method: "PATCH",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ status: to }),
    });
    const j = await res.json().catch(()=> ({}));
    if (res.ok && j?.ok) load();
    else alert(j?.error || "Failed");
  }
  async function deleteItem(row: Row) {
    if (!confirm(`Delete "${row.item_name}"?`)) return;
    const res = await fetch(`/api/restros/${encodeURIComponent(code)}/menu/${row.id}`, { method: "DELETE" });
    const j = await res.json().catch(()=> ({}));
    if (res.ok && j?.ok) load();
    else alert(j?.error || "Failed");
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
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=> e.key==='Enter' && load()}
          />
          <select className="rounded-md border px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value as any)}>
            <option value="">All</option>
            <option value="ON">On</option>
            <option value="OFF">Off</option>
            <option value="DELETED">Deleted</option>
          </select>
          <button className="rounded-md border px-3 py-2" onClick={load}>Search</button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            Item Count {counts.total} • Active {counts.on} • Deactive {counts.off} • Deleted {counts.deleted}
          </div>
          <button className="rounded-md bg-orange-600 text-white px-4 py-2" onClick={()=>setOpenModal(true)}>
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
              <tr><td colSpan={13} className="p-3 text-center text-gray-500">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={13} className="p-3 text-center text-gray-500">No items.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.item_code}</td>
                  <td className="p-2 font-medium">{r.item_name}</td>
                  <td className="p-2 text-gray-600">{r.item_description}</td>
                  <td className="p-2">{r.item_category}</td>
                  <td className="p-2">{r.item_cuisine}</td>
                  <td className="p-2">{r.start_time?.slice(0,5) ?? "—"}</td>
                  <td className="p-2">{r.end_time?.slice(0,5) ?? "—"}</td>
                  <td className="p-2 text-right">{r.restro_price ?? "—"}</td>
                  <td className="p-2 text-right">{r.base_price ?? "—"}</td>
                  <td className="p-2 text-right">{r.gst_percent ?? 0}</td>
                  <td className="p-2 text-right">{r.selling_price ?? "—"}</td>
                  <td className="p-2">
                    {r.status === "ON" && <span className="rounded bg-sky-100 px-2 py-1 text-sky-700">On</span>}
                    {r.status === "OFF" && <span className="rounded bg-amber-100 px-2 py-1 text-amber-700">Off</span>}
                    {r.status === "DELETED" && <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">Deleted</span>}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      {r.status !== "DELETED" && (
                        <>
                          {r.status === "ON" ? (
                            <button className="rounded border px-2 py-1" onClick={()=>toggleStatus(r,"OFF")}>Deactivate</button>
                          ) : (
                            <button className="rounded border px-2 py-1" onClick={()=>toggleStatus(r,"ON")}>Activate</button>
                          )}
                        </>
                      )}
                      <button className="rounded border px-2 py-1 text-rose-700" onClick={()=>deleteItem(r)}>Delete</button>
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
        onClose={()=>setOpenModal(false)}
        onSaved={load}
      />
    </div>
  );
}
