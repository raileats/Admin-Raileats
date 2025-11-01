"use client";

import React, { useEffect, useMemo, useState } from "react";
import FutureClosedFormModal from "./FutureClosedFormModal";

type Row = {
  id: number;
  restro_code: string;
  start_at: string;   // ISO
  end_at: string;     // ISO
  comment: string;
  applied_by: string | null;
  applied_by_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Props = {
  restroCode: number | string;
  currentUserId?: string | number | null; // pass if you have it (for "applied by")
};

export default function FutureClosedTab({ restroCode, currentUserId }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const codeStr = String(restroCode ?? "");

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/restros/${encodeURIComponent(codeStr)}/holidays`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Load failed (${res.status})`);
      }
      setRows(Array.isArray(json.items) ? json.items : []);
    } catch (e: any) {
      console.error("holidays load error:", e);
      setErr(e?.message ?? "Failed to load holidays");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeStr]);

  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso ?? "—";
    }
  };

  const statusOf = (r: Row) => {
    const now = new Date().getTime();
    const start = new Date(r.start_at).getTime();
    const end = new Date(r.end_at).getTime();
    if (isNaN(start) || isNaN(end)) return { label: "Inactive", tone: "bg-gray-100 text-gray-700" };
    if (now < start) return { label: "Upcoming", tone: "bg-amber-100 text-amber-800" };
    if (now >= start && now <= end) return { label: "Active", tone: "bg-emerald-100 text-emerald-800" };
    return { label: "Inactive", tone: "bg-rose-100 text-rose-800" };
  };

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Future Closed</h3>
          <p className="text-sm text-gray-500">
            Add and view upcoming/active holiday windows for this restaurant.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-orange-600 px-4 py-2 text-white"
        >
          Add New Holiday
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        {/* Headings */}
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Holiday Start</div>
          <div>Holiday End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div>Status</div>
          <div className="text-right">Created</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No holidays added yet.</div>
        ) : (
          rows
            .slice()
            .sort((a, b) => (b.start_at ?? "").localeCompare(a.start_at ?? "")) // latest start on top
            .map((r) => {
              const st = statusOf(r);
              return (
                <div key={r.id} className="grid grid-cols-6 border-t px-4 py-3 text-sm">
                  <div className="truncate">{fmt(r.start_at)}</div>
                  <div className="truncate">{fmt(r.end_at)}</div>
                  <div className="truncate">{r.comment || "—"}</div>
                  <div className="truncate">{r.applied_by_name || r.applied_by || "—"}</div>
                  <div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${st.tone}`}>
                      {st.label}
                    </span>
                  </div>
                  <div className="text-right">{fmt(r.created_at)}</div>
                </div>
              );
            })
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      <FutureClosedFormModal
        open={open}
        restroCode={codeStr}
        currentUserId={currentUserId}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}
