"use client";

import React, { useState } from "react";

type Props = {
  open: boolean;
  restroCode: string | number;
  onClose: () => void;
  onSaved: () => void;
  currentUser?: { id?: string; name?: string } | null;
};

export default function FutureClosedFormModal({
  open,
  restroCode,
  onClose,
  onSaved,
  currentUser,
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

      const res = await fetch(
        `/api/restros/${encodeURIComponent(String(restroCode))}/holidays`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_at: startAt,
            end_at: endAt,
            comment,
            created_by_id: currentUser?.id ?? null,
            created_by_name: currentUser?.name ?? null,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Save failed");

      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={() => !saving && onClose()} aria-label="Close" />
      <div className="relative z-10 w-[720px] max-w-[95vw] rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Holiday</h2>
          <button className="rounded-md border px-3 py-1 text-sm" onClick={() => !saving && onClose()}>✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm">Holiday Start</label>
            <input type="datetime-local" className="w-full rounded-md border px-3 py-2"
              value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Holiday End</label>
            <input type="datetime-local" className="w-full rounded-md border px-3 py-2"
              value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-sm">Comment</label>
            <input className="w-full rounded-md border px-3 py-2"
              value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Reason / notes" />
          </div>
        </div>

        {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border px-4 py-2" disabled={saving} onClick={onClose}>Cancel</button>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-white" disabled={saving} onClick={save}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
