"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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
  train: TrainHead;
  route: TrainRouteRow[];
  error?: string;
};

export default function AdminTrainEditPage() {
  const router = useRouter();
  const params = useParams<{ trainId: string }>();
  const trainIdParam = params?.trainId;

  const [head, setHead] = useState<TrainHead | null>(null);
  const [routeRows, setRouteRows] = useState<TrainRouteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // ------------ LOAD -------------
  useEffect(() => {
    if (!trainIdParam) return;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/admin/trains/${trainIdParam}`, {
          cache: "no-store",
        });
        const json: ApiResponse = await res.json();

        if (!json.ok) {
          console.error("train detail load failed", json);
          setError("Failed to load train details.");
          return;
        }

        setHead(json.train);
        setRouteRows(json.route || []);
      } catch (e) {
        console.error("train detail load error", e);
        setError("Failed to load train details.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [trainIdParam]);

  // ------------ HANDLERS -------------

  function updateHead<K extends keyof TrainHead>(field: K, value: string) {
    setHead((prev) =>
      prev
        ? {
            ...prev,
            [field]:
              field === "trainNumber"
                ? (value === "" ? null : Number(value))
                : value,
          }
        : prev,
    );
  }

  function updateRouteRow<
    K extends keyof TrainRouteRow,
  >(index: number, field: K, value: string) {
    setRouteRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        // numeric fields
        const numericFields: (keyof TrainRouteRow)[] = [
          "StnNumber",
          "Platform",
          "Day",
          "Route",
        ];

        if (numericFields.includes(field)) {
          const num =
            value === "" ? null : Number(value.replace(/[^\d]/g, ""));
          return { ...row, [field]: (num as any) };
        }

        // everything else string
        return { ...row, [field]: (value as any) };
      }),
    );
  }

  async function onSave() {
    if (!head || !trainIdParam) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        train: {
          trainName: head.trainName,
          trainNumber: head.trainNumber,
          stationFrom: head.stationFrom,
          stationTo: head.stationTo,
          runningDays: head.runningDays,
          status: head.status ?? null,
        },
        route: routeRows,
      };

      const res = await fetch(`/api/admin/trains/${trainIdParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!json.ok) {
        console.error("train save failed", json);
        setError("Failed to save changes.");
        return;
      }

      alert("Train route updated successfully.");
      router.push("/admin/trains");
    } catch (e) {
      console.error("train save error", e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  // ------------ UI -------------

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
        <p className="text-sm text-red-600">
          {error || "Train not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="page-root">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-semibold">
          Edit Train #{head.trainId}
        </h1>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded border text-sm"
            onClick={() => router.back()}
          >
            Back
          </button>
          <button
            className="px-4 py-2 rounded bg-green-600 text-white text-sm"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Update train information and route.
      </p>

      {error && (
        <p className="text-sm text-red-600 mb-3">{error}</p>
      )}

      {/* -------- Train header form -------- */}
      <section className="border rounded bg-white p-4 mb-4">
        <h2 className="font-semibold mb-3 text-sm">Train Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs block mb-1">Train ID</label>
            <input
              className="input bg-gray-100"
              value={head.trainId}
              readOnly
            />
          </div>
          <div>
            <label className="text-xs block mb-1">
              Train Number
            </label>
            <input
              className="input"
              value={head.trainNumber ?? ""}
              onChange={(e) =>
                updateHead("trainNumber", e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs block mb-1">Train Name</label>
            <input
              className="input"
              value={head.trainName ?? ""}
              onChange={(e) => updateHead("trainName", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs block mb-1">Status</label>
            <input
              className="input"
              placeholder="e.g. ACTIVE / INACTIVE"
              value={head.status ?? ""}
              onChange={(e) => updateHead("status", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs block mb-1">Station From</label>
            <input
              className="input"
              value={head.stationFrom ?? ""}
              onChange={(e) =>
                updateHead("stationFrom", e.target.value)
              }
            />
          </div>
          <div>
            <label className="text-xs block mb-1">Station To</label>
            <input
              className="input"
              value={head.stationTo ?? ""}
              onChange={(e) =>
                updateHead("stationTo", e.target.value)
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1">Running Days</label>
            <input
              className="input"
              value={head.runningDays ?? ""}
              onChange={(e) =>
                updateHead("runningDays", e.target.value)
              }
            />
          </div>
          <div className="text-xs text-gray-500 flex items-end gap-4">
            <span>
              Created:{" "}
              {head.created_at
                ? head.created_at.slice(0, 10)
                : "-"}
            </span>
            <span>
              Updated:{" "}
              {head.updated_at
                ? head.updated_at.slice(0, 10)
                : "-"}
            </span>
          </div>
        </div>
      </section>

      {/* -------- Route table (ALL STATIONS) -------- */}
      <section className="border rounded bg-white p-4">
        <h2 className="font-semibold mb-3 text-sm">
          Route (stations)
        </h2>

        <div className="overflow-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-100 text-[11px] uppercase text-gray-600">
              <tr>
                <th className="px-2 py-1 text-left">Stn #</th>
                <th className="px-2 py-1 text-left">Code</th>
                <th className="px-2 py-1 text-left">Name</th>
                <th className="px-2 py-1 text-left">Arrives</th>
                <th className="px-2 py-1 text-left">Departs</th>
                <th className="px-2 py-1 text-left">Stop time</th>
                <th className="px-2 py-1 text-left">Distance</th>
                <th className="px-2 py-1 text-left">Platform</th>
                <th className="px-2 py-1 text-left">Day</th>
              </tr>
            </thead>
            <tbody>
              {routeRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-2 py-3 text-center text-gray-500"
                  >
                    No route rows found for this train.
                  </td>
                </tr>
              ) : (
                routeRows.map((r, idx) => (
                  <tr key={r.id ?? idx} className="border-t">
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        value={r.StnNumber ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "StnNumber",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        value={r.StationCode ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "StationCode",
                            e.target.value.toUpperCase(),
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        value={r.StationName ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "StationName",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        placeholder="HH:MM:SS"
                        value={r.Arrives ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "Arrives",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        placeholder="HH:MM:SS"
                        value={r.Departs ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "Departs",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        placeholder="HH:MM:SS"
                        value={r.Stoptime ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "Stoptime",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        value={r.Distance ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "Distance",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        value={r.Platform ?? ""}
                        onChange={(e) =>
                          updateRouteRow(
                            idx,
                            "Platform",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="input input-xs"
                        value={r.Day ?? ""}
                        onChange={(e) =>
                          updateRouteRow(idx, "Day", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
