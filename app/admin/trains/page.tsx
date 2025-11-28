"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type TrainSummary = {
  trainId: number;
  trainNumber: number | null;
  trainName: string | null;
  stationFrom: string | null;
  stationTo: string | null;
  runningDays: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function TrainsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<TrainSummary[]>([]);
  const [error, setError] = useState<string>("");

  async function loadTrains(search?: string) {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (search && search.trim()) params.set("q", search.trim());
      const res = await fetch(`/api/admin/trains?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json?.ok) {
        console.error("trains list failed", json);
        setError("Failed to load trains.");
        setRows([]);
        return;
      }
      setRows(json.trains || []);
    } catch (e) {
      console.error("trains list error", e);
      setError("Failed to load trains.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrains();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadTrains(q);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Trains</h1>
      <p className="text-sm text-gray-600 mb-4">Manage trains here.</p>

      {/* Search bar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-wrap gap-2 items-end mb-4"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Search (Train ID / Number / Name / Station)
          </label>
          <input
            className="border rounded px-3 py-2 w-full text-sm"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. 11016, Jhelum Express, BPL..."
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
          disabled={loading}
        >
          {loading ? "Loading..." : "Search"}
        </button>
        <button
          type="button"
          className="px-3 py-2 rounded border text-sm"
          onClick={() => {
            setQ("");
            loadTrains("");
          }}
          disabled={loading}
        >
          Reset
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {/* Table */}
      <div className="border rounded bg-white overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Train ID</th>
              <th className="px-3 py-2 text-left">Train Number</th>
              <th className="px-3 py-2 text-left">Train Name</th>
              <th className="px-3 py-2 text-left">From</th>
              <th className="px-3 py-2 text-left">To</th>
              <th className="px-3 py-2 text-left">Running Days</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Updated</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-6 text-center text-gray-500"
                >
                  No trains found.
                </td>
              </tr>
            )}

            {rows.map((t) => (
              <tr key={t.trainId} className="border-t last:border-b-0">
                <td className="px-3 py-2">{t.trainId}</td>
                <td className="px-3 py-2">{t.trainNumber ?? "-"}</td>
                <td className="px-3 py-2">{t.trainName ?? "-"}</td>
                <td className="px-3 py-2">{t.stationFrom ?? "-"}</td>
                <td className="px-3 py-2">{t.stationTo ?? "-"}</td>
                <td className="px-3 py-2">{t.runningDays ?? "-"}</td>
                <td className="px-3 py-2">
                  {t.status ?? (
                    <span className="text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {t.created_at
                    ? new Date(t.created_at).toLocaleString()
                    : "-"}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {t.updated_at
                    ? new Date(t.updated_at).toLocaleString()
                    : "-"}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/trains/${t.trainId}`}
                    className="inline-flex items-center px-3 py-1 rounded border text-xs hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
