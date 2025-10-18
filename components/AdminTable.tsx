// components/AdminTable.tsx
"use client";
import React, { useMemo, useState } from "react";

export type Column<T = any> = {
  key: string; // unique key
  title: string; // column header text
  width?: string; // css width or tailwind value as string, applied to style
  render?: (row: T) => React.ReactNode; // optional custom renderer
  className?: string;
  sortable?: boolean; // future use
};

type AdminTableProps<T> = {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (q: string) => void; // optional external search handler
  filters?: React.ReactNode; // any custom filter controls
  actions?: (row: T) => React.ReactNode; // action cell renderer
  pageSize?: number;
  showAddButton?: { label?: string; onClick?: () => void };
  loading?: boolean;
  compact?: boolean;
};

export default function AdminTable<T extends { id?: string | number }>({
  title,
  subtitle,
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  actions,
  pageSize = 10,
  showAddButton,
  loading = false,
  compact = false,
}: AdminTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // local simple search if onSearch not provided
  const filtered = useMemo(() => {
    if (onSearch) {
      return data;
    }
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) =>
      Object.values(row)
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data, query, onSearch]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    setPage(1);
    if (onSearch) onSearch(v);
  }

  return (
    <section className="p-6 bg-white rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          {title && <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="admintable-search" className="sr-only">Search</label>
            <input
              id="admintable-search"
              aria-label="Search table"
              value={query}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="border border-gray-200 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-yellow-300 placeholder:text-gray-400"
            />
            {filters}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {showAddButton && (
            <button
              onClick={() => showAddButton.onClick?.()}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              {showAddButton.label ?? "+ Add"}
            </button>
          )}
        </div>
      </div>

      {/* Table container */}
      <div className="overflow-x-auto border border-gray-100 rounded-lg">
        <table className="min-w-full table-fixed divide-y">
          <thead className="bg-white sticky top-0 z-10">
            <tr className="text-left text-sm text-gray-600">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wide text-gray-500 ${col.className ?? ""}`}
                  style={col.width ? ({ width: col.width } as React.CSSProperties) : undefined}
                >
                  {col.title}
                </th>
              ))}
              {actions && (
                <th className="py-3 px-4 text-xs sm:text-sm font-medium uppercase tracking-wide text-gray-500">
                  Action
                </th>
              )}
            </tr>
            {/* subtle divider under header */}
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="border-b border-gray-100 p-0" />
            </tr>
          </thead>

          <tbody className="text-sm text-gray-700">
            {/* loading */}
            {loading ? (
              <tr>
                <td colSpan={(columns.length + (actions ? 1 : 0))} className="py-8 px-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={(columns.length + (actions ? 1 : 0))} className="py-8 px-4 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const globalIndex = (page - 1) * pageSize + idx;
                const zebra = globalIndex % 2 === 0 ? "bg-white" : "bg-gray-50";
                return (
                  <tr
                    key={(row.id ?? globalIndex).toString()}
                    className={`${zebra} hover:bg-gray-100 transition-colors`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`py-${compact ? "2" : "4"} px-4 align-middle text-sm sm:text-base ${col.className ?? ""}`}
                        style={col.width ? ({ width: col.width } as React.CSSProperties) : undefined}
                      >
                        <div className="truncate">
                          {col.render ? col.render(row) : (row as any)[col.key] ?? "-"}
                        </div>
                      </td>
                    ))}
                    {actions && (
                      <td className={`py-${compact ? "2" : "4"} px-4 align-middle`}>
                        <div className="flex items-center gap-2">
                          {actions(row)}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * pageSize + (total === 0 ? 0 : 1)} - {Math.min(page * pageSize, total)} of {total}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            aria-label="First page"
            className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            «
          </button>

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>

          <div className="px-3 py-1 border rounded-md bg-white text-sm">{page}</div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
            className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            aria-label="Last page"
            className="px-3 py-1 border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            »
          </button>
        </div>
      </div>
    </section>
  );
}
