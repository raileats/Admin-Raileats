// components/BankFormModal.tsx
"use client";

import React, { useState } from "react";

type BankStatus = "active" | "inactive";

export type BankRow = {
  id?: number;
  restro_code: number | string;
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch: string;
  status: BankStatus;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  open: boolean;
  restroCode: number | string;
  onClose: () => void;
  onSaved: () => void;
  historyTable?: string; // (kept for compatibility; not used here)
  masterTable?: string;  // (kept for compatibility; not used here)
};

export default function BankFormModal({
  open,
  restroCode,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<BankRow>({
    restro_code: restroCode,
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    branch: "",
    status: "active",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const onChange = (k: keyof BankRow, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  // Save via server API (uses service role key server-side → no RLS issues)
  const save = async () => {
    try {
      setSaving(true);
      setErr(null);

      const res = await fetch(
        `/api/restros/${encodeURIComponent(String(restroCode))}/bank`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            account_holder_name: form.account_holder_name,
            account_number: form.account_number,
            ifsc_code: form.ifsc_code,
            bank_name: form.bank_name,
            branch: form.branch,
            status: form.status,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      onSaved(); // refresh parent list
      onClose();
    } catch (e: any) {
      console.error("Bank save error:", e);
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose()}
        aria-label="Close"
      />
      {/* modal */}
      <div className="relative z-10 w-[880px] max-w-[95vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Bank Details</h2>
          <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => !saving && onClose()}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm">Account Holder Name</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.account_holder_name}
              onChange={(e) => onChange("account_holder_name", e.target.value)}
              placeholder="Account Holder Name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Account Number</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.account_number}
              onChange={(e) => onChange("account_number", e.target.value)}
              placeholder="Account Number"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">IFSC Code</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.ifsc_code}
              onChange={(e) => onChange("ifsc_code", e.target.value)}
              placeholder="IFSC Code"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Bank Name</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.bank_name}
              onChange={(e) => onChange("bank_name", e.target.value)}
              placeholder="Bank Name"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Branch</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.branch}
              onChange={(e) => onChange("branch", e.target.value)}
              placeholder="Branch"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-sm">Bank Status</label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  checked={form.status === "active"}
                  onChange={() => onChange("status", "active")}
                />
                Active
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  checked={form.status === "inactive"}
                  onChange={() => onChange("status", "inactive")}
                />
                Inactive
              </label>
            </div>
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-md border px-4 py-2">
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
