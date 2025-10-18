// components/AdminTable.tsx
"use client";
import React, { useMemo, useState } from "react";

export type Column<T = any> = {
  key: string;
  title: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
};

type AdminTableProps<T> = {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  // removed built-in search input (use page-level filters instead)
  filters?: React.ReactNode;
  actions?: (row: T) => React.ReactNode;
  pageSize?: number;
  showAddButton?: { label?: string; onClick?: () => void };
  loading?: boolean;
  compact?: boolean;
  highlightStriped?: boolean;
  rowHoverShadow?: boolean;
};

function StatusPill({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "success" | "info" | "danger" | "warning" }) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const cls =
    tone === "success"
      ? "bg-green-50 text-green-700"
      : tone === "info"
      ? "bg-blue-50 text-blue-700"
      : tone === "danger"
      ? "bg-red-50 text-red-700"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700"
      : "bg-gray-50 text-gray-700";
  return <span className={`${base} ${cls}`}>{children}</span>;
}

export default function AdminTable<T extends { id?: string | number }>({
  title,
  subtitle,
  data,
  columns,
  filters,
  actions,
  pageSize = 10,
  showAddButton,
  loading = false,
  compact = false,
  highlightStriped = true,
  rowHoverShadow = true,
}: AdminTableProps<T>) {
  // NO built-in search state here — page-level filters should control data
  const [page, setPage] = useState(1);

  // data is assumed already filtered by page
  const filtered = useMemo(() => data, [data]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const renderAvatarCluster = (row: any) => {
    const avatars: string[] = row?.avatars ?? row?.members ?? [];
    if (!avatars || !avatars.length) return null;
    const toShow = avatars.slice(0, 3);
    return (
      <div className="flex items-center -space-x-2">
        {toShow.map((src, i) => (
          <img key={i} src={src} alt={`a${i}`} className="w-7 h-7 rounded-full border-2 border-white shadow-sm object-cover" />
        ))}
        {avatars.length > 3 && (
          <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white text-xs flex items-center justify-center text-gray-600 font-medium">
            +{avatars.length - 3}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="w-full max-w-full bg-white rounded-2xl shadow-sm">
      {/* Header: title/subtitle and optional filters (no built-in search) */}
      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          {title && <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{title}</h1>}
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-3">{filters}</div>
        </div>

        <div className="flex items-center gap-3 ml-auto pr-6">
          {showAddButton && (
            <button onClick={() => showAddButton.onClick?.()} className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-full shadow-sm">
              {showAddButton.label ?? "+ Add"}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border-t border-gray-100">
        <table className="min-w-full w-full table-fixed">
          <thead className="bg-white">
            <tr className="text-left text-xs sm:text-sm text-gray-500">
              {columns.map((col) => (
                <th key={col.key} className={`py-3 px-4 font-medium tracking-wide ${col.className ?? ""}`} style={col.width ? ({ width: col.width } as React.CSSProperties) : undefined}>
                  <div className="flex items-center gap-2">
                    <span>{col.title}</span>
                    {col.sortable && (
                      <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M18 15l-6 6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="py-3 px-4 font-medium tracking-wide text-gray-500">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-8 px-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-8 px-4 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const globalIndex = (page - 1) * pageSize + idx;
                const zebra = highlightStriped ? (globalIndex % 2 === 0 ? "bg-white" : "bg-gray-50") : "bg-white";
                const hoverClass = rowHoverShadow ? "hover:shadow-sm hover:bg-white" : "hover:bg-gray-100";
                return (
                  <tr key={(row.id ?? globalIndex).toString()} className={`align-top transition-colors ${zebra} ${hoverClass}`}>
                    {columns.map((col) => (
                      <td key={col.key} className={`py-${compact ? "2" : "4"} px-4 align-middle text-sm text-gray-700`} style={col.width ? ({ width: col.width } as React.CSSProperties) : undefined}>
                        <div className="flex items-center gap-3">
                          {col.render ? (
                            col.render(row)
                          ) : (
                            (() => {
                              const v = (row as any)[col.key];
                              if ((typeof v === "boolean" || col.key.toLowerCase().includes("status")) && (typeof v === "boolean" || typeof v === "string")) {
                                let tone: any = "muted";
                                const sval = typeof v === "boolean" ? (v ? "on" : "off") : String(v).toLowerCase();
                                if (sval.includes("on") || sval.includes("active") || sval.includes("done") || sval.includes("delivered")) tone = "success";
                                else if (sval.includes("booked") || sval.includes("in progress") || sval.includes("pending")) tone = "info";
                                else if (sval.includes("cancel") || sval.includes("blocked") || sval.includes("off")) tone = "danger";
                                else tone = "muted";
                                return <StatusPill tone={tone}>{typeof v === "boolean" ? (v ? "On" : "Off") : v ?? "-"}</StatusPill>;
                              }
                              if (col.key.toLowerCase().includes("member") || col.key.toLowerCase().includes("avatar") || col.key.toLowerCase().includes("owner")) {
                                const av = renderAvatarCluster(row);
                                if (av) return av;
                              }
                              return <span className="truncate block max-w-[48rem]">{v ?? "-"}</span>;
                            })()
                          )}
                        </div>
                      </td>
                    ))}
                    {actions && (
                      <td className={`py-${compact ? "2" : "4"} px-4 align-middle`}>
                        <div className="flex items-center gap-2">{actions(row)}</div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* footer / pagination */}
      <div className="px-6 py-3 flex items-center justify-between gap-3 mt-2">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * pageSize + (total === 0 ? 0 : 1)} - {Math.min(page * pageSize, total)} of {total}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 border rounded-full bg-white hover:bg-gray-50 disabled:opacity-50">«</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-full bg-white hover:bg-gray-50 disabled:opacity-50">Prev</button>
          <div className="px-3 py-1 border rounded-full bg-white text-sm">{page}</div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-full bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 border rounded-full bg-white hover:bg-gray-50 disabled:opacity-50">»</button>
        </div>
      </div>
    </section>
  );
}
