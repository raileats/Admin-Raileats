"use client";

import React, { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (payload: {
    HolidayStartDateTime: string;
    HolidayEndDateTime: string;
    HolidayComment: string;
  }) => void;
};

export default function FutureClosedFormModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    HolidayStartDateTime: "",
    HolidayEndDateTime: "",
    HolidayComment: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const change = (k: keyof typeof form, v: string) =>
    setForm((s) => ({ ...s, [k]: v }));

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);
      if (!form.HolidayStartDateTime || !form.HolidayEndDateTime) {
        throw new Error("Start and End date-time are required");
      }
      onSaved({
        HolidayStartDateTime: form.HolidayStartDateTime,
        HolidayEndDateTime: form.HolidayEndDateTime,
        HolidayComment: form.HolidayComment.trim(),
      });
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose()}
        aria-label="Close"
      />
      {/* Modal */}
      <div className="relative z-10 w-[880px] max-w-[95vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Holiday</h2>
          <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => !saving && onClose()}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm">Holiday Start DateTime</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={form.HolidayStartDateTime}
              onChange={(e) => change("HolidayStartDateTime", e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Holiday End DateTime</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={form.HolidayEndDateTime}
              onChange={(e) => change("HolidayEndDateTime", e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm">Comment</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={form.HolidayComment}
              onChange={(e) => change("HolidayComment", e.target.value)}
              placeholder="Reason / note"
            />
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
