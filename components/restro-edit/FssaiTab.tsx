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

function formatDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB"); // 21/01/2026
}

export default function FssaiTab({ restroCode }: Props) {
  const [rows, setRows] = useState<FssaiRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);

  /* ================= FETCH ================= */
  async function loadData() {
    if (!restroCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/restros/${restroCode}/fssai`);
      const json = await res.json();
      if (json.ok) setRows(json.rows || []);
    } catch (e) {
      console.error("FSSAI load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [restroCode]);

  /* ================= SAVE NEW ================= */
  async function saveNew() {
    if (!number) {
      alert("Enter FSSAI number");
      return;
    }

    const form = new FormData();
    form.append("fssai_number", number);
    if (expiry) form.append("expiry_date", expiry);
    if (file) form.append("file", file);

    const res = await fetch(`/api/restros/${restroCode}/fssai`, {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Save failed");
      return;
    }

    setShowAdd(false);
    setNumber("");
    setExpiry("");
    setFile(null);
    loadData();
  }

  /* ================= DATA SPLIT ================= */
  const active = rows.filter((r) => r.status === "active");
  const inactive = rows.filter((r) => r.status === "inactive");

  /* ================= UI ================= */
  return (
    <div style={{ marginTop: 24 }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-lg">FSSAI</h4>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="bg-cyan-500 text-white px-4 py-2 rounded"
        >
          Add New FSSAI
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {/* ======= GRID ======= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ACTIVE */}
        <div>
          <h5 className="mb-2 font-semibold text-green-700">Active FSSAI</h5>

          {active.length === 0 && (
            <div className="text-sm text-gray-500">No active FSSAI</div>
          )}

          {active.map((r) => (
            <div
              key={r.id}
              className="border border-green-300 bg-green-50 rounded p-4 mb-3"
            >
              <div><strong>FSSAI No:</strong> {r.fssai_number}</div>
              <div><strong>Expiry:</strong> {formatDate(r.expiry_date)}</div>
              <div className="text-green-700 font-semibold">Status: Active</div>
              <div><strong>Created:</strong> {formatDate(r.created_at)}</div>

              {r.file_url && (
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline mt-1 inline-block"
                >
                  View Document
                </a>
              )}
            </div>
          ))}
        </div>

        {/* INACTIVE */}
        <div>
          <h5 className="mb-2 font-semibold text-red-700">Inactive / Old FSSAI</h5>

          {inactive.length === 0 && (
            <div className="text-sm text-gray-500">No old FSSAI</div>
          )}

          {inactive.map((r) => (
            <div
              key={r.id}
              className="border border-red-300 bg-red-50 rounded p-4 mb-3"
            >
              <div><strong>FSSAI No:</strong> {r.fssai_number}</div>
              <div><strong>Expiry:</strong> {formatDate(r.expiry_date)}</div>
              <div className="text-red-700 font-semibold">Status: Inactive</div>
              <div><strong>Created:</strong> {formatDate(r.created_at)}</div>

              {r.file_url && (
                <a
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-red-600 underline mt-1 inline-block"
                >
                  View Document
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ================= ADD FORM ================= */}
      {showAdd && (
        <div className="mt-6 bg-gray-50 p-4 rounded border">
          <h4 className="font-semibold mb-3">Add FSSAI</h4>

          <input
            placeholder="FSSAI Number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

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
              type="button"
              onClick={saveNew}
              className="bg-cyan-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
            <button
              type="button"
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
