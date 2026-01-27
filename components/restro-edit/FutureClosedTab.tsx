"use client";

import React, { useEffect, useState } from "react";
import FutureClosedFormModal from "./FutureClosedFormModal";

type Row = {
  id: number;
  start_at: string;
  end_at: string;
  comment?: string | null;
  created_by_name?: string | null;
  deleted_at?: string | null;
};

type Props = {
  restroCode: string | number;
};

export default function FutureClosedTab({ restroCode }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const codeStr = String(restroCode);

  const load = async () => {
    const res = await fetch(`/api/restros/${codeStr}/holidays`);
    const json = await res.json();
    setRows(json?.rows ?? []);
  };

  useEffect(() => {
    load();
  }, [codeStr]);

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleString() : "—";

  const statusOf = (r: Row) => {
    if (r.deleted_at) return "Deleted";
    const now = Date.now();
    const s = new Date(r.start_at).getTime();
    const e = new Date(r.end_at).getTime();
    if (now < s) return "Upcoming";
    if (now >= s && now <= e) return "Active";
    return "Inactive";
  };

  return (
    <div className="px-4">
      <div className="mb-4 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold">Future Closed</h3>
          <p className="text-sm text-gray-500">
            Schedule restaurant holiday / closure windows.
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

      <div className="rounded border">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Start</div>
          <div>End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div>Status</div>
          <div></div>
        </div>

        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-6 border-t px-4 py-3 text-sm">
            <div>{fmt(r.start_at)}</div>
            <div>{fmt(r.end_at)}</div>
            <div>{r.comment || "—"}</div>
            <div className="font-medium text-sky-700">
              {r.created_by_name || "—"}
            </div>
            <div>{statusOf(r)}</div>
            <div></div>
          </div>
        ))}
      </div>

      <FutureClosedFormModal
        open={open}
        restroCode={codeStr}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}
