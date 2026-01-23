"use client";

import React, { useEffect, useState } from "react";

type Props = {
  restroCode: string | number;
};

type PanRow = {
  id: string;
  pan_number: string;
  status: "active" | "inactive";
  created_at: string;
  file_url: string | null;
};

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "—";

export default function PanTab({ restroCode }: Props) {
  const [rows, setRows] = useState<PanRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [pan, setPan] = useState("");
  const [file, setFile] = useState<File | null>(null);

  /* ================= LOAD ================= */
  async function loadData() {
    if (!restroCode) return;
    setLoading(true);
    const res = await fetch(`/api/restros/${restroCode}/pan`);
    const json = await res.json();
    if (json.ok) setRows(json.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [restroCode]);

  /* ================= SAVE ================= */
  async function saveNew() {
    if (!panRegex.test(pan)) {
      alert("Invalid PAN format (ABCDE1234F)");
      return;
    }

    const fd = new FormData();
    fd.append("pan_number", pan);
    if (file) fd.append("file", file);

    const res = await fetch(`/api/restros/${restroCode}/pan`, {
      method: "POST",
      body: fd,
    });

    const json = await res.json();
    if (!json.ok) return alert(json.error || "Save failed");

    setShowAdd(false);
    setPan("");
    setFile(null);
    loadData();
  }

  const active = rows.filter((r) => r.status === "active");
  const inactive = rows.filter((r) => r.status === "inactive");

  /* ================= ROW ================= */
  const Row = ({ r }: { r: PanRow }) => (
    <div
      className={`grid grid-cols-4 gap-3 items-center px-3 py-2 rounded text-sm ${
        r.status === "active"
          ? "bg-green-50 border border-green-300"
          : "bg-red-50 border border-red-300"
      }`}
    >
      <div className="font-semibold">{r.pan_number}</div>

      <div
        className={
          r.status === "active"
            ? "text-green-700 font-semibold"
            : "text-red-700 font-semibold"
        }
      >
        {r.status === "active" ? "Active" : "Inactive"}
      </div>

      <div>{fmt(r.created_at)}</div>

      <div>
        {r.file_url ? (
          <a
            href={r.file_url}
            target="_blank"
            className="text-blue-600 underline"
          >
            View
          </a>
        ) : (
          "—"
        )}
      </div>
    </div>
  );

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold">PAN Card</h4>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="bg-cyan-500 text-white px-3 py-1.5 rounded"
        >
          Add PAN
        </button>
      </div>

      {/* Column Header */}
      <div className="grid grid-cols-4 gap-3 px-3 py-2 text-xs font-semibold text-gray-600 border-b">
        <div>PAN Number</div>
        <div>Status</div>
        <div>Created</div>
        <div>Document</div>
      </div>

      {/* Active */}
      {active.map((r) => (
        <Row key={r.id} r={r} />
      ))}

      {/* Inactive */}
      {inactive.length > 0 && (
        <div className="mt-3 text-xs font-semibold text-red-600">
          Old / Inactive PAN
        </div>
      )}

      {inactive.map((r) => (
        <Row key={r.id} r={r} />
      ))}

      {loading && <div className="text-sm mt-2">Loading...</div>}

      {/* ADD FORM */}
      {showAdd && (
        <div className="mt-4 p-4 bg-gray-50 border rounded">
          <h4 className="font-semibold mb-2">Add PAN</h4>

          <input
            value={pan}
            onChange={(e) =>
              setPan(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 10)
              )
            }
            placeholder="ABCDE1234F"
            className={`w-full p-2 border rounded mb-2 ${
              pan.length === 0
                ? ""
                : panRegex.test(pan)
                ? "border-green-500"
                : "border-red-500"
            }`}
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-3"
          />

          <div className="flex gap-2">
            <button
              onClick={saveNew}
              className="bg-cyan-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="border px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

