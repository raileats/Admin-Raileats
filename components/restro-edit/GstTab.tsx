"use client";

import React, { useEffect, useState } from "react";

type Props = {
  restroCode: string | number;
};

type GstRow = {
  id: string;
  GstNumber: string;
  GstType: string | null;
  fileurl: string | null;
  Gststatus: "Active" | "Inactive";
  createdDate: string | null;
};

export default function GstTab({ restroCode }: Props) {
  const [rows, setRows] = useState<GstRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  const [gstType, setGstType] = useState<"Regular" | "Composition">("Regular");
  const [file, setFile] = useState<File | null>(null);

  /* ================= GST REGEX ================= */
  const GST_REGEX =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const gstLength = gstNumber.length;
  const isValidLength = gstLength === 15;
  const isValidGST = GST_REGEX.test(gstNumber);

  /* ================= FETCH ================= */
  async function loadData() {
    if (!restroCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/restros/${restroCode}/gst`);
      const json = await res.json();
      if (json.ok) setRows(json.rows || []);
    } catch (e) {
      console.error("GST load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [restroCode]);

  /* ================= SAVE ================= */
  async function saveNew() {
    if (!isValidGST) {
      alert("Enter valid 15 digit GST number");
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

  /* ================= DATE ================= */
  function formatDate(d?: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB");
  }

  const activeRows = rows.filter((r) => r.Gststatus === "Active");
  const inactiveRows = rows.filter((r) => r.Gststatus === "Inactive");

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

      {/* Table Head */}
      <div className="grid grid-cols-5 gap-3 text-xs font-semibold text-gray-600 mb-1">
        <div>GST No</div>
        <div>GST Type</div>
        <div>Status</div>
        <div>Created</div>
        <div>Document</div>
      </div>

      {/* Active */}
      {activeRows.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-5 gap-3 text-sm items-center p-2 border border-green-300 bg-green-50 rounded mb-1"
        >
          <div className="font-semibold">{r.GstNumber}</div>
          <div>{r.GstType}</div>
          <div className="text-green-700 font-semibold">Active</div>
          <div>{formatDate(r.createdDate)}</div>
          <div>
            {r.fileurl ? (
              <a href={r.fileurl} target="_blank" className="text-blue-600 underline">
                View
              </a>
            ) : (
              "—"
            )}
          </div>
        </div>
      ))}

      {/* Inactive */}
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
              <div className="font-semibold">{r.GstNumber}</div>
              <div>{r.GstType}</div>
              <div className="text-red-600 font-semibold">Inactive</div>
              <div>{formatDate(r.createdDate)}</div>
              <div>
                {r.fileurl ? (
                  <a href={r.fileurl} target="_blank" className="text-red-600 underline">
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

      {/* ADD FORM */}
      {showAdd && (
        <div className="mt-3 p-3 bg-gray-50 border rounded">
          <h5 className="font-semibold mb-2 text-sm">Add GST</h5>

          {/* GST INPUT */}
          <input
            value={gstNumber}
            placeholder="15 Digit GST Number"
            maxLength={15} // 🔥 HARD STOP
            onChange={(e) => {
              const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
              setGstNumber(v.slice(0, 15));
            }}
            className={`w-full p-2 rounded mb-1 text-sm border
              ${
                gstLength === 0
                  ? "border-gray-300"
                  : isValidLength
                  ? "border-green-500 bg-green-50"
                  : "border-red-500 bg-red-50"
              }`}
          />

          <div className="text-xs mb-2">
            {gstLength < 15 && (
              <span className="text-red-600">
                {15 - gstLength} characters remaining
              </span>
            )}
            {isValidLength && (
              <span className="text-green-600">GST length valid</span>
            )}
          </div>

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
              disabled={!isValidGST}
              className={`px-3 py-1 rounded text-sm text-white
                ${isValidGST ? "bg-cyan-500" : "bg-gray-400 cursor-not-allowed"}`}
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
