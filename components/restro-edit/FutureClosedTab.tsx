"use client";

import React, { useEffect, useMemo, useState } from "react";
import FutureClosedFormModal from "./FutureClosedFormModal";

type Props = {
  local: any; // comes from parent (you already use this pattern)
  updateField?: (k: string, v: any) => void;
  stationDisplay?: string;
};

type Row = {
  id: number;
  restro_code: string;
  start_iso: string; // ISO string
  end_iso: string;   // ISO string
  comment: string | null;
  created_by_email: string | null;
  created_by_name: string | null; // joined from users table if available
  created_at?: string | null;
  // derived
  status: "active" | "upcoming" | "expired";
};

export default function FutureClosedTab({ local }: Props) {
  const restroCode = useMemo(() => String(local?.RestroCode ?? local?.restro_code ?? ""), [local]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const currentUserEmail =
    local?.CurrentUserEmail || local?.UserEmail || local?.OwnerEmail || null;

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(
        `/api/restros/${encodeURIComponent(restroCode)}/holidays`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed");

      const now = Date.now();

      const mapped: Row[] = (json.items as any[]).map((r) => {
        const s = new Date(r.holiday_start).getTime();
        const e = new Date(r.holiday_end).getTime();
        let status: Row["status"] = "expired";
        if (now < s) status = "upcoming";
        else if (now > e) status = "expired";
        else status = "active";

        return {
          id: r.id,
          restro_code: r.restro_code,
          start_iso: r.holiday_start,
          end_iso: r.holiday_end,
          comment: r.holiday_comment ?? null,
          created_by_email: r.created_by_email ?? null,
          created_by_name: r.created_by_name ?? null,
          created_at: r.created_at ?? null,
          status,
        };
      });

      // sort: active → upcoming → expired; then start desc
      mapped.sort((a, b) => {
        const order = (s: Row["status"]) =>
          s === "active" ? 0 : s === "upcoming" ? 1 : 2;
        const diff = order(a.status) - order(b.status);
        if (diff !== 0) return diff;
        return (b.start_iso || "").localeCompare(a.start_iso || "");
      });

      setRows(mapped);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restroCode) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restroCode]);

  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso ?? "—";
    }
  };

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Future Closed</h3>
        {!!restroCode && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md bg-orange-600 px-4 py-2 text-white"
          >
            Add New Holiday
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Holiday Start</div>
          <div>Holiday End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div>Created</div>
          <div className="text-right">Status</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">
            No holidays configured yet.
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id}
              className={`grid grid-cols-6 border-t px-4 py-3 text-sm ${
                r.status === "active"
                  ? "bg-yellow-50"
                  : r.status === "upcoming"
                  ? "bg-sky-50"
                  : "bg-gray-50"
              }`}
            >
              <div className="truncate">{fmt(r.start_iso)}</div>
              <div className="truncate">{fmt(r.end_iso)}</div>
              <div className="truncate" title={r.comment ?? ""}>
                {r.comment || "—"}
              </div>
              <div className="truncate" title={r.created_by_email ?? ""}>
                {r.created_by_name || r.created_by_email || "—"}
              </div>
              <div className="truncate">{fmt(r.created_at)}</div>
              <div className="text-right font-medium capitalize">{r.status}</div>
            </div>
          ))
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      <FutureClosedFormModal
        open={open}
        restroCode={restroCode}
        createdByEmail={currentUserEmail ?? null}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}
