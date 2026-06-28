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

function csvEscape(value: any) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function MenuItemsTable() {
  const [rows, setRows] = useState<any[]>([]);
  const [restroCode, setRestroCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadRestroCode, setUploadRestroCode] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  async function uploadMenuExcel() {
    if (!uploadRestroCode.trim()) {
      alert("Restro Code required");
      return;
    }
    if (!uploadFile) {
      alert("Please select Excel file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("restroCode", uploadRestroCode.trim());
      formData.append("file", uploadFile);

      const res = await fetch("/api/admin/menu-upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Menu upload failed");
      }

      alert(json?.message || "Menu uploaded successfully");
      setUploadOpen(false);
      setUploadRestroCode("");
      setUploadFile(null);
      setRestroCode(uploadRestroCode.trim());
      load(1);
    } catch (e: any) {
      setError(e?.message || "Menu upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function downloadMenuReport() {
    setDownloading(true);
    setError(null);

    try {
      const url = new URL("/api/menu-items", location.origin);
      url.searchParams.set("page", "1");
      url.searchParams.set("pageSize", String(Math.max(total || pageSize, pageSize)));

      if (restroCode.trim()) url.searchParams.set("restroCode", restroCode.trim());
      if (itemName.trim()) url.searchParams.set("itemName", itemName.trim());
      if (status.trim()) url.searchParams.set("status", status.trim());

      const res = await fetch(url.toString(), { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to download menu report");
      }

      const downloadRows = Array.isArray(json) ? json : json?.rows ?? [];

      if (!downloadRows.length) {
        alert("No data found to download");
        return;
      }

      const csv = [
        HEADERS.map((h) => csvEscape(h.title)).join(","),
        ...downloadRows.map((row: any) =>
          HEADERS.map((h) => csvEscape(getField(row, h.key))).join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);

      a.href = objectUrl;
      a.download = `Menu_Report_${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (e: any) {
      setError(e?.message || "Failed to download menu report");
    } finally {
      setDownloading(false);
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
        className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr_180px_auto_auto_auto_auto] lg:items-end"
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

        <button
          type="button"
          onClick={downloadMenuReport}
          disabled={downloading || loading}
          className="h-10 rounded-md bg-green-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {downloading ? "Downloading..." : "Download Report"}
        </button>

        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="h-10 rounded-md bg-purple-600 px-4 text-sm font-semibold text-white"
        >
          Upload Menu
        </button>
      </form>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}

      {uploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Upload Menu Excel</h3>
              <button
                type="button"
                onClick={() => setUploadOpen(false)}
                className="rounded border px-3 py-1 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Restro Code</span>
                <input
                  value={uploadRestroCode}
                  onChange={(e) => setUploadRestroCode(e.target.value.replace(/\D/g, ""))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                  placeholder="1004"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">Excel File</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>

              <div className="rounded bg-slate-50 p-3 text-xs text-slate-600">
                Required columns: item_name, item_category, menu_type, start_time, end_time,
                restro_price, base_price, gst_percent, selling_price, status
              </div>

              <button
                type="button"
                onClick={uploadMenuExcel}
                disabled={uploading}
                className="h-10 w-full rounded-md bg-purple-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Menu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
