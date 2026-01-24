"use client";

import React, { useState } from "react";
import UI from "@/components/AdminUI";

const { AdminForm } = UI;

type Props = {
  restroCode: string | number;
};

type Holiday = {
  start: string;
  end: string;
  comment: string;
};

export default function FutureClosedTab({ restroCode }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [comment, setComment] = useState("");

  function saveHoliday() {
    if (!start || !end) {
      alert("Please select holiday start and end date");
      return;
    }

    setHolidays((prev) => [
      ...prev,
      { start, end, comment },
    ]);

    setStart("");
    setEnd("");
    setComment("");
    setShowAdd(false);
  }

  return (
    <AdminForm>
      <div className="border rounded-md p-4 bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <h4 className="font-semibold text-sm">Future Closed</h4>
            <p className="text-xs text-gray-500">
              Schedule restaurant holiday / closure windows
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="bg-orange-500 text-white px-3 py-1.5 rounded text-sm"
          >
            Add New Holiday
          </button>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-6 gap-3 px-3 py-2 text-xs font-semibold text-gray-600 border-b bg-gray-50 rounded-t">
          <div>Holiday Start</div>
          <div>Holiday End</div>
          <div>Comment</div>
          <div>Applied By</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        {/* Rows */}
        {holidays.length === 0 && (
          <div className="px-3 py-6 text-sm text-gray-500 border border-t-0 rounded-b">
            No holidays yet.
          </div>
        )}

        {holidays.map((h, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-3 px-3 py-2 text-sm border border-t-0"
          >
            <div>{h.start}</div>
            <div>{h.end}</div>
            <div>{h.comment || "—"}</div>
            <div>Admin</div>
            <div className="text-green-700 font-semibold">Active</div>
            <div className="text-red-600 cursor-pointer">Remove</div>
          </div>
        ))}

        {/* ADD FORM */}
        {showAdd && (
          <div className="mt-4 p-4 bg-sky-50 border rounded">
            <h5 className="font-semibold text-sm mb-3">
              Add Holiday
            </h5>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Holiday Start
                </label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Holiday End
                </label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Comment
                </label>
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional"
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveHoliday}
                className="bg-orange-500 text-white px-4 py-2 rounded text-sm"
              >
                Save Holiday
              </button>

              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="border px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminForm>
  );
}
