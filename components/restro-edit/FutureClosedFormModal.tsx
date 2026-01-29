"use client";

import React, { useState } from "react";
import { useAdminUser } from "@/components/admin/AdminUserContext";

type Props = {
  open: boolean;
  restroCode: string | number;
  onClose: () => void;
  onSaved: () => void;
};

export default function FutureClosedFormModal({
  open,
  restroCode,
  onClose,
  onSaved,
}: Props) {
  const admin = useAdminUser(); // ✅ logged-in admin from context

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const save = async () => {
    try {
      setSaving(true);
      setErr(null);

      if (!start || !end) {
        throw new Error("Please select start & end date/time");
      }

      if (!admin?.id || !admin?.name) {
        throw new Error("Admin session missing");
      }

      const payload = {
        start_at: new Date(start).toISOString(),
        end_at: new Date(end).toISOString(),
        comment: comment?.trim() || null,

        // ✅ EXACT DB COLUMN NAMES (THIS WAS THE BUG)
        created_by_id: String(admin.id),
        created_by_name: admin.name,
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
      console.error("Holiday save error:", e);
      setErr(e?.message || "Failed to save");
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
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 w-[800px] rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold">Add New Holiday</h2>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded border px-3 py-2"
          />
          <textarea
            className="col-span-2 rounded border px-3 py-2"
            placeholder="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {err && <p className="mt-3 text-sm text-red-600">Error: {err}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded border px-4 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
