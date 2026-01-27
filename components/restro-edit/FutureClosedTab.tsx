"use client";

import React, { useEffect, useState } from "react";
import FutureClosedFormModal from "./FutureClosedFormModal";

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

type Props = {
  restroCode: string | number;
};

export default function FutureClosedTab({ restroCode }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const codeStr = String(restroCode ?? "");

  // ✅ SSR-safe current user id
  const currentUserId =
    typeof window !== "undefined"
      ? String((window as any).__USER__?.id ?? "")
      : "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/restros/${encodeURIComponent(codeStr)}/holidays`,
        { method: "GET" }
      );
      const json = await res.json();
      setRows(Array.isArray(json?.rows) ? json.rows : []);
    } catch (e) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); // on mount
  }, [codeStr]);

  const statusOf = (r: Row) => {
    if (r.deleted_at) return "Deleted";
    const now = Date.now();
    const s = new Date(r.start_at).getTime();
    const e = new Date(r.end_at).getTime();
    if (now < s) return "Upcoming";
    if (now >= s && now <= e) return "Active";
    return "Inactive";
  };

  const doDelete = async (id: number) => {
    if (!confirm("Delete this holiday?")) return;
    try {
      const res = await fetch(
        `/api/restros/${encodeURIComponent(codeStr)}/holidays`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Delete failed");
      await load(); // refresh list immediately
    } catch (e: any) {
      alert(e?.message ?? "Delete failed");
    }
  };

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString() : "—";

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Future Closed</h3>
          <p className="text-sm text-gray-500">
            Schedule restaurant holiday/closure windows.
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className="rounded-md bg-orange-600 px-4 py-2 text-white"
        >
          Add New Holiday
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Holiday Start</div>
          <div>Holiday End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div className="text-right">Status</div>
          <div className="text-right">Action</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">
            No holidays yet.
          </div>
        ) : (
          rows.map((r) => {
            const st = statusOf(r);
            return (
              <div
                key={r.id}
                className="grid grid-cols-6 border-t px-4 py-3 text-sm"
              >
                <div>{fmt(r.start_at)}</div>
                <div>{fmt(r.end_at)}</div>
                <div className="truncate">{r.comment || "—"}</div>
                <div className="truncate">
                  {r.created_by_name || r.created_by_id || "—"}
                </div>
                <div className="text-right">
                  <span
                    className={
                      st === "Active"
                        ? "rounded bg-green-100 px-2 py-1 text-green-700"
                        : st === "Upcoming"
                        ? "rounded bg-blue-100 px-2 py-1 text-blue-700"
                        : st === "Deleted"
                        ? "rounded bg-gray-100 px-2 py-1 text-gray-700"
                        : "rounded bg-zinc-100 px-2 py-1 text-zinc-700"
                    }
                  >
                    {st}
                  </span>
                </div>
                <div className="text-right">
                  {!r.deleted_at && (
                    <button
                      type="button"
                      onClick={() => doDelete(r.id)}
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <FutureClosedFormModal
        isOpen={open}          {/* 🔴 fixed */}
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
