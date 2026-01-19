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
      console.error(e);
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

  /* ================= TOGGLE ================= */
  async function toggleStatus(id: string, status: "active" | "inactive") {
    await fetch(`/api/restros/${restroCode}/fssai`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: status === "active" ? "inactive" : "active",
      }),
    });
    loadData();
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h4>FSSAI</h4>
        <button
          type="button" // 🔥 VERY IMPORTANT
          onClick={() => setShowAdd(true)}
          style={{ background: "#06b6d4", color: "#fff", padding: "6px 12px", borderRadius: 6 }}
        >
          Add New FSSAI
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && rows.length === 0 && (
        <div style={{ color: "#666" }}>No FSSAI added yet</div>
      )}

      {rows.map((r) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 120px",
            gap: 12,
            padding: 10,
            borderBottom: "1px solid #eee",
          }}
        >
          <div>{r.fssai_number}</div>
          <div>{r.expiry_date || "—"}</div>
          <div>{r.file_url ? "Uploaded" : "—"}</div>
          <button
            type="button" // 🔥 VERY IMPORTANT
            onClick={() => toggleStatus(r.id, r.status)}
            style={{
              padding: "4px 8px",
              borderRadius: 6,
              background: r.status === "active" ? "#16a34a" : "#9ca3af",
              color: "#fff",
            }}
          >
            {r.status === "active" ? "Active" : "Inactive"}
          </button>
        </div>
      ))}

      {/* ================= ADD MODAL ================= */}
      {showAdd && (
        <div style={{ background: "#f9fafb", padding: 12, marginTop: 12 }}>
          <h4>Add FSSAI</h4>

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
            onClick={(e) => e.stopPropagation()} // 🔥 FILE PICKER FIX
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button" // 🔥 IMPORTANT
              onClick={saveNew}
              className="px-3 py-2 bg-cyan-500 text-white rounded"
            >
              Save
            </button>
            <button
              type="button" // 🔥 IMPORTANT
              onClick={() => setShowAdd(false)}
              className="px-3 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
