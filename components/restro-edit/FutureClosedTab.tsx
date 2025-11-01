"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import FutureClosedFormModal from "./FutureClosedFormModal";

type Row = {
  id: number;
  restro_code: string;
  start_at: string;
  end_at: string;
  comment: string | null;
  applied_by: string | null;
  created_at: string;
};

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
};

export default function FutureClosedTab({ local }: Props) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase: SupabaseClient | null = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_KEY);
  }, [SUPABASE_URL, SUPABASE_KEY]);

  const restroCode =
    String(local?.RestroCode ?? local?.restro_code ?? local?.RestroId ?? local?.id ?? "");

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const statusOf = (r: Row) => {
    const now = Date.now();
    const s = new Date(r.start_at).getTime();
    const e = new Date(r.end_at).getTime();
    if (now < s) return "upcoming";
    if (now >= s && now <= e) return "active";
    return "inactive";
  };

  const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : "—");

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      if (!supabase) throw new Error("Supabase not configured");
      if (!restroCode) {
        setRows([]);
        return;
      }
      const { data, error } = await supabase
        .from("RestroHoliday")
        .select("*")
        .eq("restro_code", restroCode)
        .order("start_at", { ascending: false });

      if (error) throw error;
      setRows((data as any[]) as Row[]);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Failed to load holidays");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restroCode, supabase]);

  return (
    // Cancel ANY accidental form submit bubbling up to AdminForm
    <div onSubmitCapture={(e) => e.preventDefault()}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Future Closed</h3>
          <p className="text-sm text-gray-500">Schedule restaurant holiday/closure windows.</p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); // <- hard stop so parent form won't submit
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
          <div>Created</div>
          <div className="text-right">Status</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No holidays yet.</div>
        ) : (
          rows.map((r) => {
            const st = statusOf(r);
            const rowBg =
              st === "active" ? "bg-green-50" : st === "upcoming" ? "bg-amber-50" : "bg-rose-50";
            return (
              <div key={r.id} className={`grid grid-cols-6 border-t px-4 py-3 text-sm ${rowBg}`}>
                <div className="truncate">{fmt(r.start_at)}</div>
                <div className="truncate">{fmt(r.end_at)}</div>
                <div className="truncate">{r.comment || "—"}</div>
                <div className="truncate">{r.applied_by || "—"}</div>
                <div className="truncate">{fmt(r.created_at)}</div>
                <div className="text-right font-medium capitalize">{st}</div>
              </div>
            );
          })
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      <FutureClosedFormModal
        open={open}
        restroCode={restroCode}
        currentUserId={local?.UpdatedBy ?? local?.updated_by ?? null}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}
