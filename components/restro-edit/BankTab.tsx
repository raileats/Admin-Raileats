// components/BankTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import BankFormModal, { BankRow } from "./BankFormModal";

type Props = {
  restroCode: number | string;
  tableName?: string; // default: "RestroBank"
};

export default function BankTab({ restroCode, tableName = "RestroBank" }: Props) {
  const [rows, setRows] = useState<BankRow[]>([]);
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

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      if (!supabase) throw new Error("Supabase client not configured");

      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("restro_code", restroCode)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setRows((data as BankRow[]) || []);
    } catch (e: any) {
      console.error("Bank load error:", e);
      setErr(e?.message ?? "Failed to load bank details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restroCode, supabase]);

  return (
    <div className="px-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Bank</h3>
          <p className="text-sm text-gray-500">Current bank details for this restaurant.</p>
        </div>
        <button
          type="button"                 // ✅ prevent form submit
          onClick={(e) => {
            e.preventDefault();         // ✅ extra safety
            setOpen(true);
          }}
          className="rounded-md bg-orange-600 px-4 py-2 text-white"
        >
          Add New Bank Details
        </button>
      </div>

      {/* list view */}
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-6 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Account Holder Name</div>
          <div>Account Number</div>
          <div>IFSC Code</div>
          <div>Bank Name</div>
          <div>Branch</div>
          <div className="text-right">Status</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No bank details added yet.</div>
        ) : (
          rows.map((r) => (
            <div
              key={r.id ?? `${r.account_number}-${r.ifsc_code}`}
              className="grid grid-cols-6 border-t px-4 py-3 text-sm"
            >
              <div className="truncate">{r.account_holder_name}</div>
              <div className="truncate">{r.account_number}</div>
              <div className="truncate">{r.ifsc_code}</div>
              <div className="truncate">{r.bank_name}</div>
              <div className="truncate">{r.branch}</div>
              <div className="text-right font-medium capitalize">{r.status}</div>
            </div>
          ))
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      {/* modal */}
      <BankFormModal
        open={open}
        restroCode={restroCode}
        initialData={null}
        onClose={() => setOpen(false)}
        onSaved={(row) => setRows((prev) => [row, ...prev])}
        tableName={tableName}
      />
    </div>
  );
}
