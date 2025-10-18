// components/AdminTable.tsx
"use client";
import React, { useMemo, useState } from "react";

export type Column<T = any> = {
  key: string; // unique key
  title: string; // column header text
  width?: string; // tailwind width class or style like "w-40"
  render?: (row: T) => React.ReactNode; // optional custom renderer
  className?: string;
  sortable?: boolean; // future use
};

type AdminTableProps<T> = {
  title?: string;
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onSearch?: (q: string) => void; // optional external search handler
  filters?: React.ReactNode; // any custom filter controls
  actions?: (row: T) => React.ReactNode; // action cell renderer
  pageSize?: number;
  showAddButton?: { label?: string; onClick?: () => void };
};

export default function AdminTable<T extends { id?: string | number }>({
  title,
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  actions,
  pageSize = 10,
  showAddButton,
}: AdminTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // local simple search if onSearch not provided
  const filtered = useMemo(() => {
    if (onSearch) {
      // if external search handler used, do not filter locally
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
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          {title && <h1 className="text-2xl font-semibold mb-2">{title}</h1>}
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="border border-gray-200 rounded px-3 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
            {filters}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showAddButton && (
            <button
              onClick={() => showAddButton.onClick?.()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              {showAddButton.label ?? "+ Add"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 ${col.className ?? ""}`}
                  style={col.width ? ({ width: col.width } as any) : undefined}
                >
                  {col.title}
                </th>
              ))}
              {actions && <th className="py-3 px-4">Action</th>}
            </tr>
          </thead>

          <tbody className="text-sm text-gray-700">
            {pageData.length === 0 && (
              <tr>
                <td colSpan={(columns.length + (actions ? 1 : 0))} className="py-8 px-4 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            )}

            {pageData.map((row, idx) => (
              <tr key={(row.id ?? idx).toString()} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className={`py-4 px-4 align-middle ${col.className ?? ""}`}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
                {actions && <td className="py-4 px-4 align-middle">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="px-3 py-1 border rounded bg-white">{page}</div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
