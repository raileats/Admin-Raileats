// components/BankTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import BankFormModal from "./BankFormModal";

type BankViewRow = {
  restroCode: number | string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
  status: "active" | "inactive";
};

type Props = {
  restroCode: number | string;
  // optional: in case your table name ever differs
  tableName?: string; // default: "RestroMaster"
};

export default function BankTab({
  restroCode,
  tableName = "RestroMaster",
}: Props) {
  const [row, setRow] = useState<BankViewRow | null>(null);
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

  const normalizeStatus = (v: any): "active" | "inactive" => {
    if (v === 1 || v === "1" || v === true || String(v).toLowerCase() === "active")
      return "active";
    return "inactive";
  };

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      if (!supabase) throw new Error("Supabase client not configured");

      const { data, error } = await supabase
        .from(tableName)
        .select(
          "RestroCode, AccountHolderName, AccountNumber, BankName, IFSCCode, Branch, BankStatus"
        )
        .eq("RestroCode", restroCode)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setRow(null);
      } else {
        const mapped: BankViewRow = {
          restroCode: data.RestroCode,
          account_holder_name: data.AccountHolderName ?? "",
          account_number: data.AccountNumber ?? "",
          ifsc_code: data.IFSCCode ?? "",
          bank_name: data.BankName ?? "",
          branch: data.Branch ?? "",
          status: normalizeStatus(data.BankStatus),
        };
        setRow(mapped);
      }
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
          <p className="text-sm text-gray-500">
            Current bank details for this restaurant.
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
          Add New Bank Details
        </button>
      </div>

      {/* list view (single row from RestroMaster) */}
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
        ) : !row ||
          (!row.account_holder_name &&
            !row.account_number &&
            !row.ifsc_code &&
            !row.bank_name &&
            !row.branch) ? (
          <div className="px-4 py-6 text-sm text-gray-600">
            No bank details added yet.
          </div>
        ) : (
          <div className="grid grid-cols-6 border-t px-4 py-3 text-sm">
            <div className="truncate">{row.account_holder_name}</div>
            <div className="truncate">{row.account_number}</div>
            <div className="truncate">{row.ifsc_code}</div>
            <div className="truncate">{row.bank_name}</div>
            <div className="truncate">{row.branch}</div>
            <div className="text-right font-medium capitalize">{row.status}</div>
          </div>
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      {/* modal */}
      <BankFormModal
        open={open}
        restroCode={restroCode}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load(); // refresh after update
        }}
        tableName={tableName}
      />
    </div>
  );
}
