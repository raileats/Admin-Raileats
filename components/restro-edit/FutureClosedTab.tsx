"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import FutureClosedTab from "./restro-edit/FutureClosedTab";

type Row = {
  id: number;
  restro_code: string;
  start_at: string;      // ISO
  end_at: string;        // ISO
  comment: string;
  applied_by?: string | null;
  applied_by_name?: string | null; // from join
  status_calc?: "active" | "upcoming" | "expired";
  created_at?: string;
};

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
};

export default function FutureClosedTab({ local }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const restroCode =
    local?.RestroCode ?? local?.restro_code ?? local?.id ?? local?.code ?? "";

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(
        `/api/restros/${encodeURIComponent(String(restroCode))}/holidays`
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.error || `Fetch failed (${res.status})`);
      }
      const list: Row[] = json?.rows ?? [];
      // Sort: active → upcoming → expired, then most recent start first
      const rank = (s?: Row["status_calc"]) =>
        s === "active" ? 0 : s === "upcoming" ? 1 : 2;
      list.sort((a, b) => {
        const r = rank(a.status_calc) - rank(b.status_calc);
        if (r !== 0) return r;
        return (b.start_at ?? "").localeCompare(a.start_at ?? "");
      });
      setRows(list);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Failed to load holidays");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restroCode) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restroCode]);

  const fmt = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const badge = (s?: Row["status_calc"]) => {
    const common = "inline-block rounded-full px-2 py-0.5 text-xs font-semibold";
    if (s === "active") return <span className={`${common} bg-green-100 text-green-700`}>Active</span>;
    if (s === "upcoming") return <span className={`${common} bg-amber-100 text-amber-700`}>Upcoming</span>;
    return <span className={`${common} bg-gray-100 text-gray-700`}>Expired</span>;
  };

  return (
    <div className="px-2">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Future Closed</h3>
        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-orange-600 px-4 py-2 text-white"
        >
          Add New Holiday
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-5 bg-gray-50 px-3 py-2 text-sm font-medium">
          <div>Holiday Start</div>
          <div>Holiday End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div className="text-right">Status</div>
        </div>

        {loading ? (
          <div className="px-3 py-4 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-600">No holiday added yet.</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="grid grid-cols-5 border-t px-3 py-2 text-sm">
              <div className="truncate">{fmt(r.start_at)}</div>
              <div className="truncate">{fmt(r.end_at)}</div>
              <div className="truncate">{r.comment || "—"}</div>
              <div className="truncate">{r.applied_by_name || r.applied_by || "—"}</div>
              <div className="text-right">{badge(r.status_calc)}</div>
            </div>
          ))
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      <FutureClosedFormModal
        open={open}
        restroCode={restroCode}
        currentUserId={local?.UpdatedByUserId ?? null}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}
