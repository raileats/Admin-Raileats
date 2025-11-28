// app/admin/trains/[trainNumber]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type TrainHead = {
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

type TrainRouteRow = {
  id?: number;
  trainId: number;
  trainNumber: number | null;
  trainName: string | null;
  stationFrom: string | null;
  stationTo: string | null;
  runningDays: string | null;
  StnNumber: number | null;
  StationCode: string | null;
  StationName: string | null;
  Arrives: string | null;
  Departs: string | null;
  Stoptime: string | null;
  Distance: string | null;
  Platform: string | null;
  Route: number | null;
  Day: number | null;
};

type ApiResponse = {
  ok: boolean;
  train?: TrainHead;
  route?: TrainRouteRow[];
  error?: string;
};

export default function AdminTrainEditPage() {
  const router = useRouter();
  const params = useParams() as { trainNumber?: string };
  const trainNumberParam = params?.trainNumber;

  const [head, setHead] = useState<TrainHead | null>(null);
  const [routeRows, setRouteRows] = useState<TrainRouteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // ─── Load train by TRAIN NUMBER ──────────────────────────────
  useEffect(() => {
    if (!trainNumberParam) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/admin/trains/${encodeURIComponent(trainNumberParam)}`,
          { cache: "no-store" },
        );
        const json: ApiResponse = await res.json();

        if (!json.ok || !json.train) {
          console.error("train load failed", json);
          setError("Train not found.");
          setHead(null);
          setRouteRows([]);
          return;
        }

        setHead(json.train);
        setRouteRows(json.route || []);
      } catch (e) {
        console.error("train load error", e);
        setError("Failed to load train.");
        setHead(null);
        setRouteRows([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [trainNumberParam]);

  // ─── Simple helpers ──────────────────────────────────────────
  function updateHead<K extends keyof TrainHead>(key: K, value: TrainHead[K]) {
    setHead((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateRouteRow<K extends keyof TrainRouteRow>(
    index: number,
    key: K,
    value: TrainRouteRow[K],
  ) {
    setRouteRows((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], [key]: value };
      copy[index] = row;
      return copy;
    });
  }

  async function onSave() {
    if (!head) return;
    try {
      setSaving(true);
      setError("");

      const res = await fetch(
        `/api/admin/trains/${encodeURIComponent(String(head.trainNumber ?? ""))}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            train: head,
            route: routeRows,
          }),
        },
      );

      const json = await res.json();
      if (!json.ok) {
        console.error("save failed", json);
        setError("Failed to save changes.");
        return;
      }
      // reload after save
      router.refresh();
    } catch (e) {
      console.error("save error", e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  /* ───────────────────── UI ───────────────────── */

  if (loading && !head) {
    return (
      <div className="page-root">
        <p className="text-sm text-gray-500">Loading train…</p>
      </div>
    );
  }

  if (!head) {
    return (
      <div className="page-root">
        <p className="text-sm text-red-600">Train not found.</p>
      </div>
    );
  }

  const statusValue = head.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";

  return (
    <div className="page-root">
      {/* Title (subtitle hata diya) */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Edit Train #{head.trainNumber ?? head.trainId}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded border text-sm"
            type="button"
            onClick={() => router.push("/admin/trains")}
          >
            Back
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white text-sm"
            type="button"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">
          {error}
        </p>
      )}

      {/* Top form: Train details */}
      <section className="bg-white border rounded p-4 mb-4">
        <h2 className="font-semibold mb-3">Train Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Train ID</label>
            <input
              className="input w-full"
              value={head.trainId}
              readOnly
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Train Number
            </label>
            <input
              className="input w-full"
              value={head.trainNumber ?? ""}
              onChange={(e) =>
                updateHead("trainNumber", Number(e.target.value) || null)
              }
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Train Name
            </label>
            <input
              className="input w-full"
              value={head.trainName ?? ""}
              onChange={(e) => updateHead("trainName", e.target.value)}
            />
          </div>

          {/* STATUS TOGGLE ─ slider style */}
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Status
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  updateHead(
                    "status",
                    statusValue === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  statusValue === "ACTIVE" ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    statusValue === "ACTIVE"
                      ? "translate-x-5"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm">
                {statusValue === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Station From
            </label>
            <input
              className="input w-full"
              value={head.stationFrom ?? ""}
              onChange={(e) => updateHead("stationFrom", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              Station To
            </label>
            <input
              className="input w-full"
              value={head.stationTo ?? ""}
              onChange={(e) => updateHead("stationTo", e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs text-gray-600 block mb-1">
              Running Days
            </label>
            <input
              className="input w-full"
              value={head.runningDays ?? ""}
              onChange={(e) => updateHead("runningDays", e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Created:{" "}
          {head.created_at ? head.created_at.slice(0, 19).replace("T", " ") : "-"}{" "}
          | Updated:{" "}
          {head.updated_at ? head.updated_at.slice(0, 19).replace("T", " ") : "-"}
        </div>
      </section>

      {/* Route table */}
      <section className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Route (stations)</h2>

        <div className="overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-2 py-1 text-left">Stn #</th>
                <th className="px-2 py-1 text-left">Code</th>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Arrives</th>
                <th className="px-2 py-1 text-left">Departs</th>
                <th className="px-2 py-1 text-left">Stop Time</th>
                <th className="px-2 py-1 text-left">Distance</th>
                <th className="px-2 py-1 text-left">Platform</th>
                <th className="px-2 py-1 text-left">Day</th>
              </tr>
            </thead>
            <tbody>
              {routeRows.map((r, idx) => (
                <tr key={r.id ?? idx} className="border-t">
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-16"
                      value={r.StnNumber ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "StnNumber",
                          Number(e.target.value) || null,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-20"
                      value={r.StationCode ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "StationCode", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-48"
                      value={r.StationName ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "StationName", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-24"
                      value={r.Arrives ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "Arrives", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-24"
                      value={r.Departs ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "Departs", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-24"
                      value={r.Stoptime ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "Stoptime", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-20"
                      value={r.Distance ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "Distance", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-16"
                      value={r.Platform ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "Platform", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="input input-xs w-16"
                      value={r.Day ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "Day",
                          Number(e.target.value) || null,
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
