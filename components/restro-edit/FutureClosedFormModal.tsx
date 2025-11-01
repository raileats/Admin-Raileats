"use client";

import React, { useState } from "react";

type Props = {
  open: boolean;
  restroCode: string;
  onClose: () => void;
  onSaved: () => void;
  createdByEmail?: string | null; // optional: for “Applied By”
};

export default function FutureClosedFormModal({
  open,
  restroCode,
  onClose,
  onSaved,
  createdByEmail,
}: Props) {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setStart("");
    setEnd("");
    setComment("");
    setErr(null);
  };

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);

      if (!start || !end) throw new Error("Please select start and end.");
      const s = new Date(start);
      const e = new Date(end);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()))
        throw new Error("Invalid date/time.");
      if (s >= e) throw new Error("End must be after start.");

      const res = await fetch(
        `/api/restros/${encodeURIComponent(restroCode)}/holidays`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_iso: s.toISOString(),
            end_iso: e.toISOString(),
            comment,
            created_by_email: createdByEmail ?? null,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Save failed (${res.status})`);
      }
      reset();
      onSaved();
      onClose();
    } catch (e: any) {
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
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose()}
        aria-label="Close"
      />

      {/* modal */}
      <div className="relative z-10 w-[760px] max-w-[95vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Holiday</h2>
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => !saving && onClose()}
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
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Reason / note"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-md border px-4 py-2"
          >
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
