// components/admin/MenuItemsTable.tsx
"use client";

import React, { useEffect, useState } from "react";

const HEADERS = [
  { key: "restro_code", title: "Restro Code" },
  { key: "item_code", title: "Item Code" },
  { key: "item_name", title: "Item Name" },
  { key: "item_category", title: "Item Category" },
  { key: "start_time", title: "Start Time" },
  { key: "end_time", title: "End Time" },
  { key: "restro_price", title: "Restro Price" },
  { key: "base_price", title: "Base Price" },
  { key: "gst_percent", title: "GST %" },
  { key: "selling_price", title: "Selling Price" },
  { key: "menu_type", title: "Menu Type" },
  { key: "status", title: "Status" },
];

function getField(row: any, key: string) {
  if (!row) return "";
  if (Object.prototype.hasOwnProperty.call(row, key)) return row[key];
  const found = Object.keys(row).find((x) => x.toLowerCase() === key.toLowerCase());
  return found ? row[found] : "";
}

export default function MenuItemsTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [restroCode, setRestroCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function load(nextPage = page, clear = false) {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/menu-items", location.origin);
      url.searchParams.set("page", String(nextPage));
      url.searchParams.set("pageSize", String(pageSize));
      if (!clear) {
        if (restroCode.trim()) url.searchParams.set("restroCode", restroCode.trim());
        if (itemName.trim()) url.searchParams.set("itemName", itemName.trim());
        if (status.trim()) url.searchParams.set("status", status.trim());
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Failed to load menu items");

      const nextRows = Array.isArray(json) ? json : json?.rows ?? [];
      setRows(Array.isArray(nextRows) ? nextRows : []);
      setTotal(Number(json?.total ?? nextRows.length ?? 0));
      setPage(Number(json?.page ?? nextPage));
    } catch (e: any) {
      setRows([]);
      setTotal(0);
      setError(e?.message || "Failed to load menu items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearFilters() {
    setRestroCode("");
    setItemName("");
    setStatus("");
    load(1, true);
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          load(1);
        }}
        className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr_180px_auto_auto] lg:items-end"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Restro Code</span>
          <input
            value={restroCode}
            onChange={(e) => setRestroCode(e.target.value.replace(/\D/g, ""))}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            placeholder="1004"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Item Name</span>
          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            placeholder="Veg Mini Thali"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF</option>
            <option value="DELETED">DELETED</option>
          </select>
        </label>
        <button type="button" onClick={clearFilters} className="h-10 rounded-md border px-4 text-sm font-semibold">
          Clear
        </button>
        <button type="submit" className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              {HEADERS.map((header) => (
                <th key={header.key} className="border-b px-3 py-3 font-semibold">
                  {header.title}
                </th>
              ))}
              <th className="border-b px-3 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={HEADERS.length + 1} className="px-3 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length + 1} className="px-3 py-8 text-center text-slate-500">No menu items found</td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={`${getField(row, "restro_code")}-${getField(row, "item_code")}-${index}`} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                  {HEADERS.map((header) => (
                    <td key={header.key} className="border-b px-3 py-3 text-slate-800">
                      {String(getField(row, header.key) ?? "")}
                    </td>
                  ))}
                  <td className="border-b px-3 py-3">
                    <button type="button" className="rounded bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-900">
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing {total === 0 ? 0 : (page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => load(1)} disabled={loading || page <= 1} className="rounded border px-3 py-2 disabled:opacity-50">«</button>
          <button type="button" onClick={() => load(Math.max(1, page - 1))} disabled={loading || page <= 1} className="rounded border px-3 py-2 disabled:opacity-50">Prev</button>
          <span className="rounded border px-3 py-2 font-semibold">{page} / {totalPages}</span>
          <button type="button" onClick={() => load(Math.min(totalPages, page + 1))} disabled={loading || page >= totalPages} className="rounded border px-3 py-2 disabled:opacity-50">Next</button>
          <button type="button" onClick={() => load(totalPages)} disabled={loading || page >= totalPages} className="rounded border px-3 py-2 disabled:opacity-50">»</button>
        </div>
      </div>
    </div>
  );
}
