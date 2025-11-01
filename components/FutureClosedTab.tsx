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
  created_by_id: string | null;
  created_by_name: string | null;
  created_at: string;
};

type Props = {
  restroCode: string | number;
  // pass current user (if you have it), otherwise omit
  currentUser?: { id?: string; name?: string } | null;
};

export default function FutureClosedTab({ restroCode, currentUser }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase: SupabaseClient | null = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const codeStr = String(restroCode ?? "");

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString();

  const calcStatus = (startIso: string, endIso: string) => {
    const now = Date.now();
    const start = Date.parse(startIso);
    const end = Date.parse(endIso);
    if (now < start) return "upcoming";
    if (now >= start && now <= end) return "active";
    return "inactive";
  };

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      if (!supabase) throw new Error("Supabase not configured");

      const { data, error } = await supabase
        .from("RestroHolidays")
        .select("*")
        .eq("restro_code", codeStr)
        .order("start_at", { ascending: false });

      if (error) throw error;

      setRows((data ?? []) as Row[]);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeStr, supabase]);

  // Sort: active → upcoming → inactive; inside each: latest start_at first
  const view = [...rows].sort((a, b) => {
    const sa = calcStatus(a.start_at, a.end_at);
    const sb = calcStatus(b.start_at, b.end_at);
    const rank = (s: string) => (s === "active" ? 0 : s === "upcoming" ? 1 : 2);
    if (rank(sa) !== rank(sb)) return rank(sa) - rank(sb);
    return (Date.parse(b.start_at) || 0) - (Date.parse(a.start_at) || 0);
  });

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Future Closed</h3>
          <p className="text-sm text-gray-500">Schedule future closed dates here.</p>
        </div>
        <button
          className="rounded-md bg-orange-600 px-4 py-2 text-white"
          onClick={() => setOpen(true)}
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
        ) : view.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No holidays yet.</div>
        ) : (
          view.map((r) => {
            const status = calcStatus(r.start_at, r.end_at);
            const rowBg =
              status === "active" ? "bg-green-50"
              : status === "upcoming" ? "bg-blue-50"
              : "bg-rose-50";

            return (
              <div key={r.id} className={`grid grid-cols-6 border-t px-4 py-3 text-sm ${rowBg}`}>
                <div className="truncate">{fmt(r.start_at)}</div>
                <div className="truncate">{fmt(r.end_at)}</div>
                <div className="truncate">{r.comment ?? "—"}</div>
                <div className="truncate">
                  {r.created_by_name ?? r.created_by_id ?? "—"}
                </div>
                <div className="truncate">{fmt(r.created_at)}</div>
                <div className="text-right font-medium capitalize">{status}</div>
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
        currentUser={currentUser ?? null}
      />
    </div>
  );
}
