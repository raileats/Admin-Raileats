"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import FutureClosedFormModal from "./FutureClosedFormModal";

type HolidayRow = {
  id: number;
  restro_code: string;
  start_at: string;   // ISO
  end_at: string;     // ISO
  comment: string | null;
  created_by_id: string | null;
  created_by_name: string | null;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  local: any;                              // same signature you already have
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
};

export default function FutureClosedTab({ local }: Props) {
  const [rows, setRows] = useState<HolidayRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase: SupabaseClient | null = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const codeStr = String(local?.RestroCode ?? local?.restro_code ?? "");

  const fmt = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso ?? "—";
    }
  };

  const statusOf = (row: HolidayRow) => {
    const now = new Date().getTime();
    const s = new Date(row.start_at).getTime();
    const e = new Date(row.end_at).getTime();
    if (now < s) return "Upcoming";
    if (now >= s && now <= e) return "Active";
    return "Inactive";
  };

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      if (!supabase) throw new Error("Supabase client not configured");
      if (!codeStr) {
        setRows([]);
        return;
      }

      const { data, error } = await supabase
        .from("RestroHolidays")
        .select("*")
        .eq("restro_code", codeStr)
        .order("start_at", { ascending: false });

      if (error) throw error;
      setRows((data ?? []) as HolidayRow[]);
    } catch (e: any) {
      console.error("load holidays error:", e);
      setErr(e?.message ?? "Failed to load holidays");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeStr, supabase]);

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold m-0">Future Closed</h3>

        <button
          className="rounded-md bg-orange-600 px-4 py-2 text-white"
          onClick={() => setOpen(true)}
          type="button"
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
          <div className="px-4 py-6 text-sm text-gray-600">
            No holidays yet. Click “Add New Holiday”.
          </div>
        ) : (
          rows.map((r) => {
            const st = statusOf(r);
            const bg =
              st === "Active" ? "bg-green-50" : st === "Upcoming" ? "bg-blue-50" : "bg-rose-50";
            return (
              <div key={r.id} className={`grid grid-cols-6 border-t px-4 py-3 text-sm ${bg}`}>
                <div className="truncate">{fmt(r.start_at)}</div>
                <div className="truncate">{fmt(r.end_at)}</div>
                <div className="truncate">{r.comment || "—"}</div>
                <div className="truncate">{r.created_by_name || r.created_by_id || "—"}</div>
                <div className="truncate">{fmt(r.created_at)}</div>
                <div className="text-right font-medium">{st}</div>
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
          load();
        }}
      />
    </div>
  );
}
