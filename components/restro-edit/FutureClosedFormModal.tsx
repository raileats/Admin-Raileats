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
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [comment, setComment] = useState("");

  if (!open) return null;

  // 🔥 TEMP ADMIN (replace later with real session)
  const adminUser = {
    id: "admin-1001",
    name: "Test Admin",
  };

  async function submit() {
    const res = await fetch(`/api/restros/${restroCode}/holidays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_at: start,
        end_at: end,
        comment,

        // ✅ THIS FIXES "system"
        created_by_id: adminUser.id,
        created_by_name: adminUser.name,
      }),
    });

    const json = await res.json();
    if (!json?.ok) {
      alert(json?.error || "Save failed");
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-[420px]">
        <h3 className="text-lg font-semibold mb-4">Add Holiday</h3>

        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="w-full mb-3 border px-3 py-2 rounded"
        />

        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="w-full mb-3 border px-3 py-2 rounded"
        />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comment"
          className="w-full mb-3 border px-3 py-2 rounded"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={submit}
            className="bg-orange-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
