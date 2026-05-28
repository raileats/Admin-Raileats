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

type AdminTableProps<T = any> = {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: (row: T) => React.ReactNode;
  pageSize?: number;
  showAddButton?: { label?: string; onClick?: () => void };
  loading?: boolean;
  compact?: boolean;
  highlightStriped?: boolean;
  rowHoverShadow?: boolean;
  [key: string]: any;
};

function StatusPill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "success" | "info" | "danger" | "warning";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "info"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : tone === "danger"
      ? "bg-red-50 text-red-700 ring-red-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {children}
    </span>
  );
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
  rowHoverShadow = false,
}: AdminTableProps<T>) {
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => data ?? [], [data]);

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
          <img
            key={i}
            src={src}
            alt={`avatar ${i + 1}`}
            className="h-7 w-7 rounded-full border-2 border-white object-cover shadow-sm"
          />
        ))}
        {avatars.length > 3 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-600">
            +{avatars.length - 3}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="w-full max-w-full bg-white">
      {(title || subtitle || filters || showAddButton) && (
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-xl font-bold text-slate-950">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
            {filters && <div className="mt-3">{filters}</div>}
          </div>

          {showAddButton && (
            <button
              type="button"
              onClick={() => showAddButton.onClick?.()}
              className="inline-flex h-10 items-center justify-center rounded-md border border-blue-600 bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {showAddButton.label ?? "+ Add"}
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 ${col.className ?? ""}`}
                  style={col.width ? ({ width: col.width } as React.CSSProperties) : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.title}</span>
                    {col.sortable && <span className="text-slate-300">↕</span>}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-sm font-medium text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-sm font-medium text-slate-400">
                  No records found
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const globalIndex = (page - 1) * pageSize + idx;
                const zebra = highlightStriped ? (globalIndex % 2 === 0 ? "bg-white" : "bg-slate-50/70") : "bg-white";
                const hoverClass = rowHoverShadow ? "hover:shadow-sm hover:bg-white" : "hover:bg-blue-50/40";

                return (
                  <tr key={(row.id ?? globalIndex).toString()} className={`align-top transition ${zebra} ${hoverClass}`}>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${compact ? "px-4 py-2" : "px-4 py-4"} align-middle text-sm text-slate-700`}
                        style={col.width ? ({ width: col.width } as React.CSSProperties) : undefined}
                      >
                        {col.render ? (
                          col.render(row)
                        ) : (
                          (() => {
                            const v = (row as any)[col.key];
                            if (
                              (typeof v === "boolean" || col.key.toLowerCase().includes("status")) &&
                              (typeof v === "boolean" || typeof v === "string")
                            ) {
                              let tone: any = "muted";
                              const sval = typeof v === "boolean" ? (v ? "on" : "off") : String(v).toLowerCase();
                              if (sval.includes("on") || sval.includes("active") || sval.includes("done") || sval.includes("delivered")) tone = "success";
                              else if (sval.includes("booked") || sval.includes("in progress") || sval.includes("pending")) tone = "info";
                              else if (sval.includes("cancel") || sval.includes("blocked") || sval.includes("off")) tone = "danger";
                              else tone = "muted";
                              return <StatusPill tone={tone}>{typeof v === "boolean" ? (v ? "On" : "Off") : v ?? "-"}</StatusPill>;
                            }

                            if (col.key.toLowerCase().includes("member") || col.key.toLowerCase().includes("avatar")) {
                              const avatars = renderAvatarCluster(row);
                              if (avatars) return avatars;
                            }

                            return <span className="block max-w-[48rem] truncate">{v ?? "-"}</span>;
                          })()
                        )}
                      </td>
                    ))}
                    {actions && (
                      <td className={`${compact ? "px-4 py-2" : "px-4 py-4"} align-middle`}>
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

      <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-medium text-slate-500">
          Showing {(page - 1) * pageSize + (total === 0 ? 0 : 1)} - {Math.min(page * pageSize, total)} of {total}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">«</button>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Prev</button>
          <div className="flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold">{page}</div>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Next</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">»</button>
        </div>
      </div>
    </section>
  );
}
