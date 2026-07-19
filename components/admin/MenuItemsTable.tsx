// components/admin/MenuItemsTable.tsx
"use client";

import React, { useEffect, useState } from "react";

/*
 * Admin screen par dikhne wale columns.
 * Existing table layout ko same rakha gaya hai.
 */
const TABLE_HEADERS = [
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

/*
 * Download aur dobara upload karne ke liye complete headers.
 * Inka order upload API me exactly same validate hoga.
 */
const DOWNLOAD_HEADERS = [
  { key: "restro_code", title: "Restro Code" },
  { key: "item_code", title: "Item Code" },
  { key: "item_name", title: "Item Name" },
  { key: "item_description", title: "Item Description" },
  { key: "item_category", title: "Item Category" },
  { key: "menu_type", title: "Menu Type" },
  { key: "item_cuisine", title: "Item Cuisine" },
  { key: "start_time", title: "Start Time" },
  { key: "end_time", title: "End Time" },
  { key: "restro_price", title: "Restro Price" },
  { key: "base_price", title: "Base Price" },
  { key: "gst_percent", title: "GST %" },
  { key: "base_price_gst", title: "Base Price GST" },
  { key: "selling_price", title: "Selling Price" },
  { key: "menu_type_rank", title: "Menu Type Rank" },
  { key: "status", title: "Status" },
  { key: "menu_item_image", title: "Menu Item Image" },
];

type UploadMode = "single" | "multi";

function getField(row: any, key: string) {
  if (!row) return "";

  if (Object.prototype.hasOwnProperty.call(row, key)) {
    return row[key];
  }

  const found = Object.keys(row).find(
    (x) => x.toLowerCase() === key.toLowerCase()
  );

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

  const [uploadMode, setUploadMode] =
    useState<UploadMode>("single");

  const [uploadRestroCode, setUploadRestroCode] =
    useState("");

  const [uploadFile, setUploadFile] =
    useState<File | null>(null);

  const [uploading, setUploading] = useState(false);

  const pageSize = 50;

  const totalPages = Math.max(
    1,
    Math.ceil(total / pageSize)
  );

  async function load(
    nextPage = page,
    clear = false
  ) {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(
        "/api/menu-items",
        location.origin
      );

      url.searchParams.set(
        "page",
        String(nextPage)
      );

      url.searchParams.set(
        "pageSize",
        String(pageSize)
      );

      if (!clear) {
        if (restroCode.trim()) {
          url.searchParams.set(
            "restroCode",
            restroCode.trim()
          );
        }

        if (itemName.trim()) {
          url.searchParams.set(
            "itemName",
            itemName.trim()
          );
        }

        if (status.trim()) {
          url.searchParams.set(
            "status",
            status.trim()
          );
        }
      }

      const res = await fetch(
        url.toString(),
        {
          cache: "no-store",
        }
      );

      const json = await res
        .json()
        .catch(() => ({}));

      if (
        !res.ok ||
        json?.ok === false
      ) {
        throw new Error(
          json?.error ||
            "Failed to load menu items"
        );
      }

      const nextRows = Array.isArray(json)
        ? json
        : json?.rows ?? [];

      setRows(
        Array.isArray(nextRows)
          ? nextRows
          : []
      );

      setTotal(
        Number(
          json?.total ??
            nextRows.length ??
            0
        )
      );

      setPage(
        Number(
          json?.page ?? nextPage
        )
      );
    } catch (e: any) {
      setRows([]);
      setTotal(0);

      setError(
        e?.message ||
          "Failed to load menu items"
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadMenuExcel() {
    const cleanRestroCode =
      uploadRestroCode.trim();

    /*
     * Single Outlet mode me popup Restro Code required hai.
     * Multiple Outlets mode me codes Excel se read honge.
     */
    if (uploadMode === "single") {
      if (!cleanRestroCode) {
        alert("Restro Code required");
        return;
      }

      if (
        !/^\d+$/.test(
          cleanRestroCode
        )
      ) {
        alert(
          "Restro Code must be numeric"
        );

        return;
      }

      const numericRestroCode =
        Number(cleanRestroCode);

      if (
        !Number.isSafeInteger(
          numericRestroCode
        ) ||
        numericRestroCode <= 0
      ) {
        alert(
          "Valid Restro Code required"
        );

        return;
      }
    }

    if (!uploadFile) {
      alert(
        "Please select Excel or CSV file"
      );

      return;
    }

    const extension = uploadFile.name
      .split(".")
      .pop()
      ?.toLowerCase();

    if (
      !extension ||
      !["xlsx", "xls", "csv"].includes(
        extension
      )
    ) {
      alert(
        "Only .xlsx, .xls or .csv file is allowed"
      );

      return;
    }

    if (uploadFile.size <= 0) {
      alert("Selected file is empty");
      return;
    }

    if (
      uploadFile.size >
      10 * 1024 * 1024
    ) {
      alert(
        "Maximum file size is 10 MB"
      );

      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData =
        new FormData();

      formData.append(
        "uploadMode",
        uploadMode
      );

      /*
       * Single mode me actual Restro Code jayega.
       * Multi mode me blank jayega aur API Excel se code read karegi.
       */
      formData.append(
        "restroCode",
        uploadMode === "single"
          ? cleanRestroCode
          : ""
      );

      formData.append(
        "file",
        uploadFile
      );

      const res = await fetch(
        "/api/admin/menu-upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const json = await res
        .json()
        .catch(() => ({}));

      if (
        !res.ok ||
        json?.ok === false
      ) {
        throw new Error(
          json?.error ||
            "Menu upload failed"
        );
      }

      alert(
        json?.message ||
          "Menu uploaded successfully"
      );

      const completedUploadMode =
        uploadMode;

      const completedRestroCode =
        cleanRestroCode;

      setUploadOpen(false);
      setUploadMode("single");
      setUploadRestroCode("");
      setUploadFile(null);
      setItemName("");
      setStatus("");

      if (
        completedUploadMode ===
        "single"
      ) {
        setRestroCode(
          completedRestroCode
        );

        /*
         * load() current state read karta hai.
         * Isliye direct filter ke saath fresh request karte hain.
         */
        setLoading(true);
        setError(null);

        try {
          const url = new URL(
            "/api/menu-items",
            location.origin
          );

          url.searchParams.set(
            "page",
            "1"
          );

          url.searchParams.set(
            "pageSize",
            String(pageSize)
          );

          url.searchParams.set(
            "restroCode",
            completedRestroCode
          );

          const listRes = await fetch(
            url.toString(),
            {
              cache: "no-store",
            }
          );

          const listJson =
            await listRes
              .json()
              .catch(() => ({}));

          if (
            !listRes.ok ||
            listJson?.ok === false
          ) {
            throw new Error(
              listJson?.error ||
                "Failed to load uploaded menu"
            );
          }

          const nextRows =
            Array.isArray(listJson)
              ? listJson
              : listJson?.rows ?? [];

          setRows(
            Array.isArray(nextRows)
              ? nextRows
              : []
          );

          setTotal(
            Number(
              listJson?.total ??
                nextRows.length ??
                0
            )
          );

          setPage(
            Number(
              listJson?.page ?? 1
            )
          );
        } finally {
          setLoading(false);
        }
      } else {
        /*
         * Multiple outlets upload ke baad all-menu list show hogi.
         */
        setRestroCode("");

        await load(1, true);
      }
    } catch (e: any) {
      setError(
        e?.message ||
          "Menu upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  async function fetchAllDownloadRows() {
    const allRows: any[] = [];

    const downloadPageSize = 50;

    let currentPage = 1;
    let expectedTotal = 0;

    while (true) {
      const url = new URL(
        "/api/menu-items",
        location.origin
      );

      url.searchParams.set(
        "page",
        String(currentPage)
      );

      url.searchParams.set(
        "pageSize",
        String(downloadPageSize)
      );

      if (restroCode.trim()) {
        url.searchParams.set(
          "restroCode",
          restroCode.trim()
        );
      }

      if (itemName.trim()) {
        url.searchParams.set(
          "itemName",
          itemName.trim()
        );
      }

      if (status.trim()) {
        url.searchParams.set(
          "status",
          status.trim()
        );
      }

      const res = await fetch(
        url.toString(),
        {
          cache: "no-store",
        }
      );

      const json = await res
        .json()
        .catch(() => ({}));

      if (
        !res.ok ||
        json?.ok === false
      ) {
        throw new Error(
          json?.error ||
            "Failed to download menu report"
        );
      }

      const pageRows = Array.isArray(
        json
      )
        ? json
        : Array.isArray(json?.rows)
          ? json.rows
          : [];

      expectedTotal = Number(
        json?.total ??
          expectedTotal ??
          pageRows.length
      );

      allRows.push(...pageRows);

      if (
        pageRows.length === 0 ||
        pageRows.length <
          downloadPageSize ||
        allRows.length >=
          expectedTotal
      ) {
        break;
      }

      currentPage += 1;

      /*
       * Accidental infinite loop se protection.
       */
      if (currentPage > 1000) {
        throw new Error(
          "Too many menu records to download"
        );
      }
    }

    return allRows;
  }

  async function downloadMenuReport() {
    setDownloading(true);
    setError(null);

    try {
      const downloadRows =
        await fetchAllDownloadRows();

      if (!downloadRows.length) {
        alert(
          "No data found to download"
        );

        return;
      }

      const csv = [
        DOWNLOAD_HEADERS.map(
          (header) =>
            csvEscape(header.title)
        ).join(","),

        ...downloadRows.map(
          (row: any) =>
            DOWNLOAD_HEADERS.map(
              (header) =>
                csvEscape(
                  getField(
                    row,
                    header.key
                  )
                )
            ).join(",")
        ),
      ].join("\r\n");

      const blob = new Blob(
        ["\ufeff" + csv],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const today = new Date()
        .toISOString()
        .slice(0, 10);

      const filterName =
        restroCode.trim()
          ? `_Restro_${restroCode.trim()}`
          : "";

      const anchor =
        document.createElement("a");

      const objectUrl =
        URL.createObjectURL(blob);

      anchor.href = objectUrl;

      anchor.download =
        `Menu_Report${filterName}_${today}.csv`;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      URL.revokeObjectURL(
        objectUrl
      );
    } catch (e: any) {
      setError(
        e?.message ||
          "Failed to download menu report"
      );
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

  function openUploadModal() {
    setError(null);

    setUploadMode("single");

    setUploadRestroCode(
      restroCode.trim()
    );

    setUploadFile(null);

    setUploadOpen(true);
  }

  function closeUploadModal() {
    if (uploading) return;

    setUploadOpen(false);
    setUploadMode("single");
    setUploadRestroCode("");
    setUploadFile(null);
  }

  function changeUploadMode(
    nextMode: UploadMode
  ) {
    if (uploading) return;

    setUploadMode(nextMode);
    setUploadFile(null);

    if (nextMode === "single") {
      setUploadRestroCode(
        restroCode.trim()
      );
    } else {
      setUploadRestroCode("");
    }
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
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Restro Code
          </span>

          <input
            value={restroCode}
            onChange={(event) =>
              setRestroCode(
                event.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            placeholder="1004"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Item Name
          </span>

          <input
            value={itemName}
            onChange={(event) =>
              setItemName(
                event.target.value
              )
            }
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            placeholder="Veg Mini Thali"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">
            Status
          </span>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          >
            <option value="">
              All Status
            </option>

            <option value="ON">
              ON
            </option>

            <option value="OFF">
              OFF
            </option>

            <option value="DELETED">
              DELETED
            </option>
          </select>
        </label>

        <button
          type="button"
          onClick={clearFilters}
          className="h-10 rounded-md border px-4 text-sm font-semibold"
        >
          Clear
        </button>

        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          Search
        </button>

        <button
          type="button"
          onClick={downloadMenuReport}
          disabled={
            downloading || loading
          }
          className="h-10 rounded-md bg-green-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {downloading
            ? "Downloading..."
            : "Download Report"}
        </button>

        <button
          type="button"
          onClick={openUploadModal}
          className="h-10 rounded-md bg-purple-600 px-4 text-sm font-semibold text-white"
        >
          Upload Menu
        </button>
      </form>

      {error ? (
        <div className="whitespace-pre-wrap rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      {uploadOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-xl rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Upload Menu Excel
              </h3>

              <button
                type="button"
                onClick={
                  closeUploadModal
                }
                disabled={uploading}
                className="rounded border px-3 py-1 text-sm font-semibold disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-600">
                  Upload Type
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label
                    className={`cursor-pointer rounded-md border p-3 ${
                      uploadMode ===
                      "single"
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="single"
                        checked={
                          uploadMode ===
                          "single"
                        }
                        disabled={
                          uploading
                        }
                        onChange={() =>
                          changeUploadMode(
                            "single"
                          )
                        }
                        className="mt-1"
                      />

                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Single Outlet
                        </div>

                        <div className="mt-1 text-xs leading-4 text-slate-600">
                          Upload or update menu
                          for one Restro Code.
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`cursor-pointer rounded-md border p-3 ${
                      uploadMode ===
                      "multi"
                        ? "border-purple-500 bg-purple-50"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="uploadMode"
                        value="multi"
                        checked={
                          uploadMode ===
                          "multi"
                        }
                        disabled={
                          uploading
                        }
                        onChange={() =>
                          changeUploadMode(
                            "multi"
                          )
                        }
                        className="mt-1"
                      />

                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Multiple Outlets
                        </div>

                        <div className="mt-1 text-xs leading-4 text-slate-600">
                          Restro Codes will be
                          read from Excel rows.
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {uploadMode ===
              "single" ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">
                    Restro Code
                  </span>

                  <input
                    value={
                      uploadRestroCode
                    }
                    onChange={(event) =>
                      setUploadRestroCode(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                    }
                    disabled={
                      uploading
                    }
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm disabled:bg-slate-100"
                    placeholder="1004"
                  />

                  <span className="mt-1 block text-xs text-slate-500">
                    Every Excel row must
                    contain this same Restro
                    Code.
                  </span>
                </label>
              ) : (
                <div className="rounded-md border border-purple-200 bg-purple-50 p-3 text-xs leading-5 text-purple-900">
                  <div className="font-bold">
                    Multiple Outlet Upload
                  </div>

                  <div>
                    Enter the correct Restro
                    Code in every Excel row.
                  </div>

                  <div>
                    The system will validate
                    each Restro Code before
                    saving any menu item.
                  </div>
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">
                  Excel or CSV File
                </span>

                <input
                  key={uploadMode}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  disabled={uploading}
                  onChange={(event) =>
                    setUploadFile(
                      event.target
                        .files?.[0] ||
                        null
                    )
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
                />
              </label>

              <div className="rounded border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-slate-700">
                <div className="font-bold text-slate-900">
                  Upload Guidelines
                </div>

                <div>
                  • Use the downloaded report
                  file only.
                </div>

                <div>
                  • Keep header names and
                  column order unchanged.
                </div>

                <div>
                  • Keep Item Code to update
                  an existing menu item.
                </div>

                <div>
                  • Leave Item Code blank to
                  create a new menu item.
                </div>

                <div>
                  • Restro Code, prices and
                  GST must be numeric.
                </div>

                <div>
                  • Status must be ON, OFF or
                  DELETED only.
                </div>

                <div>
                  • Any invalid row will
                  reject the entire file.
                </div>
              </div>

              <div className="max-h-36 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-600">
                <div className="mb-1 font-bold text-slate-800">
                  Exact headers:
                </div>

                {DOWNLOAD_HEADERS.map(
                  (header, index) => (
                    <div
                      key={header.key}
                    >
                      {index + 1}.{" "}
                      {header.title}
                    </div>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={
                  uploadMenuExcel
                }
                disabled={uploading}
                className="h-10 w-full rounded-md bg-purple-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
              >
                {uploading
                  ? "Validating and Uploading..."
                  : uploadMode ===
                      "multi"
                    ? "Upload Multiple Outlet Menu"
                    : "Upload Menu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-700">
            <tr>
              {TABLE_HEADERS.map(
                (header) => (
                  <th
                    key={header.key}
                    className="border-b px-3 py-3 font-semibold"
                  >
                    {header.title}
                  </th>
                )
              )}

              <th className="border-b px-3 py-3 font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={
                    TABLE_HEADERS.length +
                    1
                  }
                  className="px-3 py-8 text-center text-slate-500"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    TABLE_HEADERS.length +
                    1
                  }
                  className="px-3 py-8 text-center text-slate-500"
                >
                  No menu items found
                </td>
              </tr>
            ) : (
              rows.map(
                (row, index) => (
                  <tr
                    key={`${getField(
                      row,
                      "restro_code"
                    )}-${getField(
                      row,
                      "item_code"
                    )}-${index}`}
                    className={
                      index % 2
                        ? "bg-slate-50"
                        : "bg-white"
                    }
                  >
                    {TABLE_HEADERS.map(
                      (header) => (
                        <td
                          key={
                            header.key
                          }
                          className="border-b px-3 py-3 text-slate-800"
                        >
                          {String(
                            getField(
                              row,
                              header.key
                            ) ?? ""
                          )}
                        </td>
                      )
                    )}

                    <td className="border-b px-3 py-3">
                      <button
                        type="button"
                        className="rounded bg-amber-400 px-3 py-1 text-sm font-semibold text-slate-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <div>
          Showing{" "}
          {total === 0
            ? 0
            : (page - 1) *
                pageSize +
              1}{" "}
          -{" "}
          {Math.min(
            page * pageSize,
            total
          )}{" "}
          of {total}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(1)}
            disabled={
              loading || page <= 1
            }
            className="rounded border px-3 py-2 disabled:opacity-50"
          >
            «
          </button>

          <button
            type="button"
            onClick={() =>
              load(
                Math.max(
                  1,
                  page - 1
                )
              )
            }
            disabled={
              loading || page <= 1
            }
            className="rounded border px-3 py-2 disabled:opacity-50"
          >
            Prev
          </button>

          <span className="rounded border px-3 py-2 font-semibold">
            {page} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() =>
              load(
                Math.min(
                  totalPages,
                  page + 1
                )
              )
            }
            disabled={
              loading ||
              page >= totalPages
            }
            className="rounded border px-3 py-2 disabled:opacity-50"
          >
            Next
          </button>

          <button
            type="button"
            onClick={() =>
              load(totalPages)
            }
            disabled={
              loading ||
              page >= totalPages
            }
            className="rounded border px-3 py-2 disabled:opacity-50"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
