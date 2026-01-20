"use client";

import React, { useEffect, useState } from "react";

type Props = {
  restroCode: string | number;
};

type FssaiRow = {
  id: string;
  fssai_number: string;
  expiry_date: string | null;
  file_url: string | null;
  status: "active" | "inactive";
  created_at: string;
};

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "—";

export default function FssaiTab({ restroCode }: Props) {
  const [rows, setRows] = useState<FssaiRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);

  /* ================= VALIDATION ================= */
  const isValidLength = number.length === 14;

  /* ================= LOAD ================= */
  async function loadData() {
    if (!restroCode) return;
    setLoading(true);
    const res = await fetch(`/api/restros/${restroCode}/fssai`);
    const json = await res.json();
    if (json.ok) setRows(json.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [restroCode]);

  /* ================= SAVE ================= */
  async function saveNew() {
    if (!isValidLength) {
      alert("FSSAI number must be exactly 14 digits");
      return;
    }

    const fd = new FormData();
    fd.append("fssai_number", number);
    if (expiry) fd.append("expiry_date", expiry);
    if (file) fd.append("file", file);

    const res = await fetch(`/api/restros/${restroCode}/fssai`, {
      method: "POST",
      body: fd,
    });

    const json = await res.json();
    if (!json.ok) return alert(json.error || "Save failed");

    setShowAdd(false);
    setNumber("");
    setExpiry("");
    setFile(null);
    loadData();
  }

  const active = rows.filter((r) => r.status === "active");
  const inactive = rows.filter((r) => r.status === "inactive");

  /* ================= ROW ================= */
  const Row = ({ r }: { r: FssaiRow }) => (
    <div
      className={`grid grid-cols-5 gap-3 items-center px-3 py-2 rounded text-sm ${
        r.status === "active"
          ? "bg-green-50 border border-green-300"
          : "bg-red-50 border border-red-300"
      }`}
    >
      <div>
        <strong>{r.fssai_number}</strong>
      </div>
      <div>{fmt(r.expiry_date)}</div>
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
        <h4 className="font-semibold">FSSAI</h4>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="bg-cyan-500 text-white px-3 py-1.5 rounded"
        >
          Add New FSSAI
        </button>
      </div>

      {/* Column Header */}
      <div className="grid grid-cols-5 gap-3 px-3 py-2 text-xs font-semibold text-gray-600 border-b">
        <div>FSSAI No</div>
        <div>Expiry</div>
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
          Old / Inactive FSSAI
        </div>
      )}

      {inactive.map((r) => (
        <Row key={r.id} r={r} />
      ))}

      {loading && <div className="text-sm mt-2">Loading...</div>}

      {/* ADD FORM */}
      {showAdd && (
        <div className="mt-4 p-4 bg-gray-50 border rounded">
          <h4 className="font-semibold mb-2">Add FSSAI</h4>

          {/* FSSAI INPUT */}
          <input
            value={number}
            maxLength={14} // 🔥 HARD LIMIT
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, ""); // 🔥 numeric only
              setNumber(v.slice(0, 14));
            }}
            placeholder="14 Digit FSSAI Number"
            className={`w-full p-2 rounded mb-1 border ${
              number.length === 0
                ? "border-gray-300"
                : isValidLength
                ? "border-green-500 bg-green-50"
                : "border-red-500 bg-red-50"
            }`}
          />

          <div className="text-xs mb-2">
            {!isValidLength ? (
              <span className="text-red-600">
                {14 - number.length} digits remaining
              </span>
            ) : (
              <span className="text-green-600">
                FSSAI number length valid
              </span>
            )}
          </div>

          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-3"
          />

          <div className="flex gap-2">
            <button
              onClick={saveNew}
              disabled={!isValidLength}
              className={`px-4 py-2 rounded text-white ${
                isValidLength
                  ? "bg-cyan-500"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
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
