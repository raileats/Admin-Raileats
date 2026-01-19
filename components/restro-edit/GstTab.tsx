"use client";

import { useEffect, useState } from "react";

type GstRow = {
  id: string;
  gst_number: string;
  gst_type: string;
  file_url: string | null;
  status: "active" | "inactive";
  created_at: string;
};

export default function GstTab({
  restroCode,
}: {
  restroCode: string | number;
}) {
  const [rows, setRows] = useState<GstRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstType, setGstType] = useState("Regular");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/restros/${restroCode}/gst`);
      const json = await res.json();
      if (json.ok) setRows(json.rows || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (restroCode) loadData();
  }, [restroCode]);

  async function saveNew() {
    if (!gstNumber || !file) {
      alert("GST Number and File required");
      return;
    }

    const form = new FormData();
    form.append("gst_number", gstNumber);
    form.append("gst_type", gstType);
    form.append("file", file);

    const res = await fetch(`/api/restros/${restroCode}/gst`, {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Save failed");
      return;
    }

    setShowAdd(false);
    setGstNumber("");
    setFile(null);
    loadData();
  }

  async function toggleStatus(id: string, status: "active" | "inactive") {
    await fetch(`/api/restros/${restroCode}/gst`, {
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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h4>GST</h4>
        <button
          onClick={() => setShowAdd(true)}
          style={{ background: "#06b6d4", color: "#fff", padding: "6px 12px", borderRadius: 6 }}
        >
          Add New GST
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && rows.length === 0 && (
        <div style={{ color: "#666" }}>No GST added yet</div>
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
          <div>{r.gst_number}</div>
          <div>{r.gst_type}</div>
          <div>{r.file_url ? "Uploaded" : "—"}</div>
          <button
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

      {showAdd && (
        <div style={{ marginTop: 12, padding: 12, background: "#f9fafb" }}>
          <input
            placeholder="GST Number"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />

          <select
            value={gstType}
            onChange={(e) => setGstType(e.target.value)}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="Regular">Regular</option>
            <option value="Composition">Composition</option>
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2"
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={saveNew}
              className="px-3 py-2 bg-cyan-500 text-white rounded"
            >
              Save
            </button>
            <button
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

