"use client";

import React, { useState } from "react";

type Props = {
  isOpen: boolean;
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
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!isOpen) return null;

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);

      if (!start || !end) {
        throw new Error("Please select start & end date/time");
      }

      const payload = {
        start_at: new Date(start).toISOString(),
        end_at: new Date(end).toISOString(),
        comment: comment.trim() || null,
        applied_by: currentUserId ?? null, // ✅ ONLY ID
      };

      const res = await fetch(
        `/api/restros/${encodeURIComponent(String(restroCode))}/holidays`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Save failed");
      }

      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-[800px] rounded-xl bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Add New Holiday</h2>

        <input
          type="datetime-local"
          className="mb-3 w-full border p-2"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />

        <input
          type="datetime-local"
          className="mb-3 w-full border p-2"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />

        <textarea
          className="mb-3 w-full border p-2"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="border px-4 py-2">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 px-4 py-2 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
