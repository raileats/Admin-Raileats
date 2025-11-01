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

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase: SupabaseClient | null = useMemo(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }, [SUPABASE_URL, SUPABASE_ANON_KEY]);

  const restroCode =
    String(local?.RestroCode ?? local?.restro_code ?? local?.code ?? "");

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      if (!supabase) throw new Error("Supabase not configured");
      if (!restroCode) throw new Error("Missing RestroCode");

      // NOTE: table name is plural here
      const { data, error } = await supabase
        .from("RestroHolidays")
        .select(
          "id, restro_code, start_at, end_at, comment, created_by_id, created_by_name"
        )
        .eq("restro_code", restroCode)
        .order("start_at", { ascending: false });

      if (error) throw error;

      setRows((data ?? []) as Row[]);
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
  }, [restroCode, supabase]);

  const now = Date.now();
  const computeStatus = (r: Row) => {
    const s = new Date(r.start_at).getTime();
    const e = new Date(r.end_at).getTime();
    if (now < s) return "Upcoming";
    if (now >= s && now <= e) return "Active";
    return "Inactive";
  };

  const fmt = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div>
      <h3 className="text-center mt-0">Future Closed</h3>

      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-orange-600 px-4 py-2 text-white"
        >
          Add New Holiday
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-5 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Holiday Start</div>
          <div>Holiday End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div className="text-right">Status</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : err ? (
          <div className="px-4 py-6 text-sm text-red-600">Error: {err}</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No holidays yet.</div>
        ) : (
          rows.map((r) => {
            const st = computeStatus(r);
            return (
              <div
                key={r.id}
                className={`grid grid-cols-5 border-t px-4 py-3 text-sm ${
                  st === "Active" ? "bg-amber-50" : ""
                }`}
              >
                <div className="truncate">{fmt(r.start_at)}</div>
                <div className="truncate">{fmt(r.end_at)}</div>
                <div className="truncate">{r.comment || "—"}</div>
                <div className="truncate">
                  {r.created_by_name || r.created_by_id || "—"}
                </div>
                <div className="text-right font-medium">{st}</div>
              </div>
            );
          })
        )}
      </div>

      <FutureClosedFormModal
        open={open}
        restroCode={restroCode}
        currentUserId={local?.UserId ?? local?.user_id ?? null}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}
