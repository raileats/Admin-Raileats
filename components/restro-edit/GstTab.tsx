"use client";

import React, { useEffect, useState } from "react";

type Props = {
  restroCode: string | number;
};

type GstRow = {
  id: string;
  gst_number: string;
  gst_type: string | null;
  file_url: string | null;
  status: "active" | "inactive";
  created_at: string;
};

export default function GstTab({ restroCode }: Props) {
  const [rows, setRows] = useState<GstRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstType, setGstType] = useState<"Regular" | "Composition">("Regular");
  const [file, setFile] = useState<File | null>(null);

  /* ================= FETCH ================= */
  async function loadData() {
    if (!restroCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/restros/${restroCode}/gst`);
      const json = await res.json();
      if (json.ok) {
        setRows(json.rows || []);
      }
    } catch (e) {
      console.error("GST load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [restroCode]);

  /* ================= SAVE NEW ================= */
  async function saveNew() {
    if (!gstNumber) {
      alert("Enter GST number");
      return;
    }

    const form = new FormData();
    form.append("gst_number", gstNumber);
    form.append("gst_type", gstType);
    if (file) form.append("file", file);

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
    setGstType("Regular");
    setFile(null);
    loadData();
  }

  /* ================= SPLIT ================= */
  const activeRows = rows.filter((r) => r.status === "active");
  const inactiveRows = rows.filter((r) => r.status === "inactive");

  function formatDate(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB");
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold">GST</h4>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="bg-cyan-500 text-white px-3 py-1 rounded text-sm"
        >
          Add New GST
        </button>
      </div>

      {/* Headings */}
      <div className="grid grid-cols-5 gap-3 text-xs font-semibold text-gray-600 mb-1">
        <div>GST No</div>
        <div>GST Type</div>
        <div>Status</div>
        <div>Created</div>
        <div>Document</div>
      </div>

      {/* Active GST */}
      {activeRows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-5 gap-3 text-sm items-center p-2 border border-green-300 bg-green-50 rounded mb-1"
        >
          <div className="font-semibold">{r.gst_number}</div>
          <div>{r.gst_type || "—"}</div>
          <div className="text-green-700 font-semibold">Active</div>
          <div>{formatDate(r.created_at)}</div>
          <div>
            {r.file_url ? (
              <a
                href={r.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                View
              </a>
            ) : (
              "—"
            )}
          </div>
        </div>
      ))}

      {/* Inactive GST */}
      {inactiveRows.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-red-600 mb-1">
            Old / Inactive GST
          </div>

          {inactiveRows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-5 gap-3 text-sm items-center p-2 border border-red-300 bg-red-50 rounded mb-1"
            >
              <div className="font-semibold">{r.gst_number}</div>
              <div>{r.gst_type || "—"}</div>
              <div className="text-red-600 font-semibold">Inactive</div>
              <div>{formatDate(r.created_at)}</div>
              <div>
                {r.file_url ? (
                  <a
                    href={r.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-600 underline"
                  >
                    View
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-gray-500 text-sm mt-2">
          No GST added yet
        </div>
      )}

      {/* ================= ADD FORM ================= */}
      {showAdd && (
        <div className="mt-3 p-3 bg-gray-50 border rounded">
          <h5 className="font-semibold mb-2 text-sm">Add GST</h5>

          <input
            placeholder="GST Number"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-sm"
          />

          <select
            value={gstType}
            onChange={(e) =>
              setGstType(e.target.value as "Regular" | "Composition")
            }
            className="w-full p-2 border rounded mb-2 text-sm"
          >
            <option value="Regular">Regular</option>
            <option value="Composition">Composition</option>
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-2 text-sm"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveNew}
              className="px-3 py-1 bg-cyan-500 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1 border rounded text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
