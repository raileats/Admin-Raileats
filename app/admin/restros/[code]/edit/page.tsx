// components/RestroEditModal.tsx
"use client";

import React, { useMemo, useState } from "react";
import BankTab from "./BankTab";

type Restro = { [k: string]: any };

interface Props {
  restro: Restro;
  initialTab?: string;
  onClose: () => void;
  onSave: (payload: any) => Promise<
    | { ok: true; row: any }
    | { ok: false; error: any }
  >;
}

/**
 * Modal with tabs. "Bank" tab shows a list view and opens popup form (BankFormModal) via BankTab.
 */
export default function RestroEditModal({
  restro,
  initialTab = "Basic Information",
  onClose,
  onSave,
}: Props) {
  const tabs = useMemo(
    () => [
      "Basic Information",
      "Station Settings",
      "Address & Documents",
      "Contacts",
      "Bank",
      "Future Closed",
      "Menu",
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // yahan aap form payload collect karo (basic/address/contacts etc.)
  // Bank tab ka data BankTab hi handle karega (separate table).
  const [payload, setPayload] = useState<any>({});

  const handleSave = async () => {
    try {
      setSaving(true);
      setErr(null);
      const res = await onSave(payload);
      if (!res.ok) throw new Error(res.error);
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal card */}
      <div className="relative z-10 flex h-[90vh] w-[1200px] max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="text-sm font-semibold">
              {restro?.RestroCode} {restro?.RestroName}
            </div>
            {restro?.StationName && (
              <div className="text-xs text-blue-600 underline">
                {restro.StationName} {restro.State ? `- ${restro.State}` : ""}
              </div>
            )}
          </div>

          <button
            className="rounded-md border px-3 py-1 text-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`px-3 py-2 text-sm ${
                  activeTab === t
                    ? "border-b-2 border-blue-600 font-medium text-blue-700"
                    : "text-gray-700 hover:text-black"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {activeTab === "Basic Information" && (
            <div className="text-sm text-gray-700">
              {/* TODO: aapka Basic form yahan render karein.
                  setPayload((p)=>({...p, ...basicValues})) use karein */}
              <p className="text-gray-500">
                Basic Information form yahan aayega.
              </p>
            </div>
          )}

          {activeTab === "Station Settings" && (
            <div className="text-sm text-gray-700">
              <p className="text-gray-500">Station Settings form yahan.</p>
            </div>
          )}

          {activeTab === "Address & Documents" && (
            <div className="text-sm text-gray-700">
              <p className="text-gray-500">Address & Documents form yahan.</p>
            </div>
          )}

          {activeTab === "Contacts" && (
            <div className="text-sm text-gray-700">
              <p className="text-gray-500">Contacts form yahan.</p>
            </div>
          )}

          {/* ✅ NEW: Bank tab (view + popup via BankTab) */}
          {activeTab === "Bank" && (
            <BankTab
              restroCode={restro?.RestroCode /* table me jis field se map karte ho */}
              // tableName="RestroBank" // change only if your table name different
            />
          )}

          {activeTab === "Future Closed" && (
            <div className="text-sm text-gray-700">
              <p className="text-gray-500">Future Closed screen yahan.</p>
            </div>
          )}

          {activeTab === "Menu" && (
            <div className="text-sm text-gray-700">
              <p className="text-gray-500">Menu config yahan.</p>
            </div>
          )}

          {err && <p className="mt-4 text-sm text-red-600">Error: {err}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button className="rounded-md border px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
