"use client";

import React, { useEffect, useState } from "react";
import FutureClosedFormModal from "./FutureClosedFormModal";

export type FutureClosedTabProps = {
  restroCode: string | number;
};

type Row = {
  id: number;
  restro_code: string;
  start_at: string;
  end_at: string;
  comment?: string | null;
  created_by_id?: string | null;
  created_by_name?: string | null;
  deleted_at?: string | null;
};

export default function FutureClosedTab({ restroCode }: FutureClosedTabProps) {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const codeStr = String(restroCode ?? "");

  const currentUserId =
    typeof window !== "undefined"
      ? String((window as any).__USER__?.id ?? "")
      : "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/restros/${encodeURIComponent(codeStr)}/holidays`
      );
      const json = await res.json();
      setRows(Array.isArray(json?.rows) ? json.rows : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (codeStr) load();
  }, [codeStr]);

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString() : "—";

  return (
    <div className="px-4">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Future Closed</h3>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded bg-orange-600 px-4 py-2 text-white"
        >
          Add New Holiday
        </button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-5 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Start</div>
          <div>End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div>Status</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm">No holidays yet.</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-5 border-t px-4 py-3 text-sm"
            >
              <div>{fmt(r.start_at)}</div>
              <div>{fmt(r.end_at)}</div>
              <div>{r.comment || "—"}</div>
              <div>{r.created_by_name || r.created_by_id || "—"}</div>
              <div>{r.deleted_at ? "Deleted" : "Active"}</div>
            </div>
          ))
        )}
      </div>

      <FutureClosedFormModal
        isOpen={open}
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
