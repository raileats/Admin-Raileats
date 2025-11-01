"use client";

import React, { useState } from "react";

type Props = {
  open: boolean;
  restroCode: string;
  onClose: () => void;
  onSaved: () => void;
};

export default function FutureClosedFormModal({
  open,
  restroCode,
  onClose,
  onSaved,
}: Props) {
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);

      if (!restroCode) throw new Error("Missing RestroCode");
      if (!startAt || !endAt) throw new Error("Please provide start & end");

      // NOTE: created_by_* — yaha apne app ke current user se bhar lo agar available ho
      const payload = {
        start_at: startAt,
        end_at: endAt,
        comment: comment || null,
        created_by_id: "admin",      // replace if you have auth user id
        created_by_name: "Admin",    // replace if you have auth user name
      };

      const res = await fetch(
        `/api/restros/${encodeURIComponent(restroCode)}/holidays`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      onSaved();
    } catch (e: any) {
      console.error("holiday save error:", e);
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
      <div className="relative z-10 w-[720px] max-w-[95vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Holiday</h2>
          <button type="button" className="rounded-md border px-3 py-1 text-sm" onClick={() => !saving && onClose()}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm">Start (date & time)</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">End (date & time)</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-sm">Comment</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional note"
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
