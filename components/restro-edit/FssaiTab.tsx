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
      if (json.ok) {
        setRows(json.rows || []);
      }
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

  /* ================= HELPERS ================= */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function isExpired(expiryDate: string | null) {
    if (!expiryDate) return false;
    const d = new Date(expiryDate);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  // 🔥 show only latest active & non-expired
  const activeRow = rows.find(
    (r) => r.status === "active" && !isExpired(r.expiry_date)
  );

  /* ================= RENDER ================= */
  return (
    <div style={{ marginTop: 20 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h4>FSSAI</h4>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          style={{
            background: "#06b6d4",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 6,
          }}
        >
          Add New FSSAI
        </button>
      </div>

      {/* LOADING */}
      {loading && <div>Loading...</div>}

      {/* EMPTY */}
      {!loading && !activeRow && (
        <div style={{ color: "#666" }}>No active FSSAI available</div>
      )}

      {/* ACTIVE FSSAI CARD */}
      {activeRow && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 12,
            padding: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          <div>
            <strong>FSSAI No:</strong> {activeRow.fssai_number}
          </div>

          <div>
            <strong>Expiry:</strong> {activeRow.expiry_date || "—"}
          </div>

          <div>
            <strong>Status:</strong>{" "}
            <span style={{ color: "green", fontWeight: 700 }}>
              Active
            </span>
          </div>

          <div>
            <strong>Created:</strong>{" "}
            {new Date(activeRow.created_at).toLocaleDateString()}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            {activeRow.file_url ? (
              <a
                href={activeRow.file_url}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#2563eb" }}
              >
                View Document
              </a>
            ) : (
              "No document"
            )}
          </div>
        </div>
      )}

      {/* ================= ADD FORM ================= */}
      {showAdd && (
        <div
          style={{
            background: "#f9fafb",
            padding: 12,
            marginTop: 14,
            borderRadius: 8,
          }}
        >
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
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={saveNew}
              className="px-3 py-2 bg-cyan-500 text-white rounded"
            >
              Save
            </button>
            <button
              type="button"
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
