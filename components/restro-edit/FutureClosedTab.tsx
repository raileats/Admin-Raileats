"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import FutureClosedFormModal from "./FutureClosedFormModal";

type Row = {
  id: number;
  restro_code: string;
  start_at: string;
  end_at: string;
  comment?: string | null;
  created_by_name?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
  status?: "Active" | "Upcoming" | "Expired" | "Deleted";
};

type Props = {
  restroCode: number | string;
};

export default function FutureClosedTab({ restroCode }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const codeStr = String(restroCode ?? "");
  const supabase: SupabaseClient | null = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !anon) return null;
    return createClient(url, anon);
  }, []);

  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/restros/${encodeURIComponent(codeStr)}/holidays`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed");
      const list: Row[] = json.rows ?? [];
      // Current tab: show non-deleted first by time; deleted at bottom
      list.sort((a, b) => {
        const ad = a.is_deleted ? 1 : 0;
        const bd = b.is_deleted ? 1 : 0;
        if (ad !== bd) return ad - bd;
        return (a.start_at || "").localeCompare(b.start_at || "");
      });
      setRows(list);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load holidays");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [codeStr]);

  const onDelete = async (id: number) => {
    if (!confirm("Delete this holiday?")) return;
    const res = await fetch(`/api/restros/${encodeURIComponent(codeStr)}/holidays/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      alert(json?.error || "Delete failed");
      return;
    }
    // refresh list immediately
    load();
  };

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Future Closed</h3>
          <p className="text-sm text-gray-500">Schedule restaurant holiday/closure windows.</p>
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
        <div className="grid grid-cols-5 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Holiday Start</div>
          <div>Holiday End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div className="text-right">Status</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No holidays yet.</div>
        ) : (
          rows.map((r) => {
            const badge =
              r.status === "Active" ? "bg-green-100 text-green-700" :
              r.status === "Upcoming" ? "bg-blue-100 text-blue-700" :
              r.status === "Expired" ? "bg-gray-100 text-gray-700" :
              "bg-rose-100 text-rose-700";
            return (
              <div
                key={r.id}
                className={`grid grid-cols-5 items-center border-t px-4 py-3 text-sm ${r.is_deleted ? "opacity-60" : ""}`}
              >
                <div className="truncate">{fmt(r.start_at)}</div>
                <div className="truncate">{fmt(r.end_at)}</div>
                <div className="truncate">{r.comment || "—"}</div>
                <div className="truncate">{r.created_by_name || "—"}</div>
                <div className="flex items-center justify-end gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
                    {r.status ?? "—"}
                  </span>
                  {!r.is_deleted && (
                    <button
                      onClick={() => onDelete(r.id)}
                      className="text-xs rounded border px-2 py-1 hover:bg-rose-50"
                      title="Delete holiday"
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

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      <FutureClosedFormModal
        open={open}
        restroCode={codeStr}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load(); // 👈 save ke turant baad list reload
        }}
      />
    </div>
  );
}
