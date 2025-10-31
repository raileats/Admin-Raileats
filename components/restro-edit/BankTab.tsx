// components/BankTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import BankFormModal from "./BankFormModal";

export type BankRow = {
  id?: number;
  restro_code: string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
};

type Props = {
  restroCode: number | string;
  historyTable?: string; // default: RestroBank
  masterTable?: string;  // default: RestroMaster
};

export default function BankTab({
  restroCode,
  historyTable = "RestroBank",
  masterTable = "RestroMaster",
}: Props) {
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

  const codeStr = String(restroCode ?? "");

  const normalizeStatus = (v: any): "active" | "inactive" => {
    const s = String(v ?? "").toLowerCase();
    return s === "1" || s === "true" || s === "active" ? "active" : "inactive";
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(+d) ? "—" : d.toLocaleString();
  };

  const sortActiveThenNewest = (list: BankRow[]) =>
    [...list].sort((a, b) => {
      const aAct = a.status === "active" ? 1 : 0;
      const bAct = b.status === "active" ? 1 : 0;
      if (aAct !== bAct) return bAct - aAct; // active first
      const at = a.created_at ? +new Date(a.created_at) : 0;
      const bt = b.created_at ? +new Date(b.created_at) : 0;
      return bt - at; // newest first
    });

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      if (!supabase) throw new Error("Supabase client not configured");

      // 1) Try history
      const { data: hist, error: histErr } = await supabase
        .from(historyTable)
        .select("*")
        .eq("restro_code", codeStr);

      if (histErr) throw histErr;

      if (hist && hist.length > 0) {
        const list: BankRow[] = (hist as any[]).map((r) => ({
          id: r.id,
          restro_code: String(r.restro_code ?? codeStr),
          account_holder_name: r.account_holder_name ?? "",
          account_number: r.account_number ?? "",
          ifsc_code: r.ifsc_code ?? "",
          bank_name: r.bank_name ?? "",
          branch: r.branch ?? "",
          status: normalizeStatus(r.status),
          created_at: r.created_at ?? undefined,
          updated_at: r.updated_at ?? undefined,
        }));
        setRows(sortActiveThenNewest(list));
        return;
      }

      // 2) Fallback to master snapshot
      const { data: master, error: mErr } = await supabase
        .from(masterTable)
        .select(
          "RestroCode, AccountHolderName, AccountNumber, BankName, IFSCCode, Branch, BankStatus, BankDetailsCreatedDate"
        )
        .eq("RestroCode", codeStr)
        .maybeSingle();
      if (mErr) throw mErr;

      if (master) {
        setRows(
          sortActiveThenNewest([
            {
              restro_code: codeStr,
              account_holder_name: master.AccountHolderName ?? "",
              account_number: master.AccountNumber ?? "",
              ifsc_code: master.IFSCCode ?? "",
              bank_name: master.BankName ?? "",
              branch: master.Branch ?? "",
              status: normalizeStatus(master.BankStatus),
              created_at: master.BankDetailsCreatedDate ?? undefined,
            },
          ])
        );
      } else {
        setRows([]);
      }
    } catch (e: any) {
      console.error("Bank load error:", e);
      setErr(e?.message ?? "Failed to load bank details");
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
        <div>
          <h3 className="text-lg font-semibold">Bank</h3>
          <p className="text-sm text-gray-500">Current bank details for this restaurant.</p>
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

      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-7 bg-gray-50 px-4 py-3 text-sm font-medium">
          <div>Account Holder Name</div>
          <div>Account Number</div>
          <div>IFSC Code</div>
          <div>Bank Name</div>
          <div>Branch</div>
          <div>Created</div>
          <div className="text-right">Status</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-600">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-600">No bank details added yet.</div>
        ) : (
          rows.map((r, idx) => {
            const isActive = r.status === "active";
            const rowBg = isActive ? "bg-green-50" : "bg-red-50";
            const statusColor = isActive ? "text-green-700" : "text-red-600";
            return (
              <div
                key={r.id ?? `${idx}-${r.account_number}-${r.ifsc_code}`}
                className={`grid grid-cols-7 border-t px-4 py-3 text-sm ${rowBg}`}
              >
                <div className="truncate">{r.account_holder_name}</div>
                <div className="truncate">{r.account_number}</div>
                <div className="truncate">{r.ifsc_code}</div>
                <div className="truncate">{r.bank_name}</div>
                <div className="truncate">{r.branch}</div>
                <div className="truncate">{fmtDate(r.created_at)}</div>
                <div className={`text-right font-medium capitalize ${statusColor}`}>{r.status}</div>
              </div>
            );
          })
        )}
      </div>

      {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

      <BankFormModal
        open={open}
        restroCode={codeStr}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          load(); // refresh after save
        }}
        historyTable={historyTable}
        masterTable={masterTable}
      />
    </div>
  );
}
