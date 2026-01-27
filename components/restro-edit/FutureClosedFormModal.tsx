"use client";

import React, { useState } from "react";

type Props = {
  isOpen: boolean; // 🔴 renamed from open → isOpen
  restroCode: string | number;
  currentUserId?: string | number | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function FutureClosedFormModal({
  isOpen,
  restroCode,
  currentUserId,
  onClose,
  onSaved,
}: Props) {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 🔴 important fix
  if (!isOpen) return null;

  const handleClose = () => {
    if (!saving) onClose();
  };

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);

      if (!start || !end) {
        throw new Error("Please select start & end date/time.");
      }

      const payload = {
        start_at: new Date(start).toISOString(),
        end_at: new Date(end).toISOString(),
        comment: (comment ?? "").trim(),
        applied_by: currentUserId ? String(currentUserId) : "system",
      };

      const res = await fetch(
        `/api/restros/${encodeURIComponent(String(restroCode))}/holidays`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Save failed (${res.status})`);
      }

      onSaved();
      handleClose();
    } catch (e: any) {
      console.error("holiday save error:", e);
      setErr(e?.message ?? "Failed to save");
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
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-[820px] max-w-[95vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Holiday</h2>
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm">Holiday Start</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">Holiday End</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-sm">Comment</label>
            <textarea
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Why is the restaurant closed?"
            />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleClose}
            className="rounded-md border px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
