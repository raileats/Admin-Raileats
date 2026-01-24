"use client";

import React from "react";
import UI from "@/components/AdminUI";

const { AdminForm, SubmitButton } = UI;

type Props = {
  restroCode: string | number;
};

export default function FutureClosedTab({ restroCode }: Props) {
  return (
    <AdminForm>
      {/* ================= FUTURE CLOSED ================= */}
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

        {/* Empty State */}
        <div className="px-3 py-6 text-sm text-gray-500 border border-t-0 rounded-b">
          No holidays yet.
        </div>
      </div>
    </AdminForm>
  );
}
