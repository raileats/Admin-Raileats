"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TrainHeader = {
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

type RouteRow = {
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

export default function TrainEditPage({
  params,
}: {
  params: { trainId: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [train, setTrain] = useState<TrainHeader | null>(null);
  const [route, setRoute] = useState<RouteRow[]>([]);

  const trainId = params.trainId;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/admin/trains/${trainId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!json?.ok) {
          setError("Failed to load train details.");
          return;
        }
        setTrain(json.train);
        setRoute(json.route || []);
      } catch (e) {
        console.error("train detail error", e);
        setError("Failed to load train details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [trainId]);

  async function handleSave() {
    if (!train) return;
    try {
      setSaving(true);
      setError("");
      const res = await fetch(`/api/admin/trains/${trainId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ train, route }),
      });
      const json = await res.json();
      if (!json?.ok) {
        console.error("save failed", json);
        setError("Failed to save changes.");
        return;
      }
      alert("Train updated successfully.");
      router.push("/admin/trains");
    } catch (e) {
      console.error("save error", e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  function updateTrainField<K extends keyof TrainHeader>(
    key: K,
    value: TrainHeader[K],
  ) {
    setTrain((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateRouteRow(
    index: number,
    field: keyof RouteRow,
    value: any,
  ) {
    setRoute((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">Loading train details…</p>
      </div>
    );
  }

  if (!train) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">
          Train not found or failed to load.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Edit Train #{train.trainId}
          </h1>
          <p className="text-sm text-gray-600">
            Update train information and route.
          </p>
        </div>
        <div className="space-x-2">
          <button
            type="button"
            className="px-3 py-2 text-sm rounded border"
            onClick={() => router.push("/admin/trains")}
          >
            Back
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm rounded bg-green-600 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Train header form */}
      <section className="border rounded bg-white p-4 space-y-3">
        <h2 className="font-semibold text-base mb-2">Train Details</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Train ID
            </label>
            <input
              className="border rounded px-3 py-2 w-full text-sm bg-gray-100"
              value={train.trainId}
              disabled
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Train Number
            </label>
            <input
              className="border rounded px-3 py-2 w-full text-sm"
              value={train.trainNumber ?? ""}
              onChange={(e) =>
                updateTrainField(
                  "trainNumber",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Status
            </label>
            <input
              className="border rounded px-3 py-2 w-full text-sm"
              value={train.status ?? ""}
              onChange={(e) => updateTrainField("status", e.target.value)}
              placeholder="e.g. ACTIVE / INACTIVE"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">
              Train Name
            </label>
            <input
              className="border rounded px-3 py-2 w-full text-sm"
              value={train.trainName ?? ""}
              onChange={(e) =>
                updateTrainField("trainName", e.target.value || null)
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Running Days
            </label>
            <input
              className="border rounded px-3 py-2 w-full text-sm"
              value={train.runningDays ?? ""}
              onChange={(e) =>
                updateTrainField("runningDays", e.target.value || null)
              }
              placeholder="e.g. Mon,Tue,Wed,Thu,Fri,Sat,Sun"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Station From
            </label>
            <input
              className="border rounded px-3 py-2 w-full text-sm"
              value={train.stationFrom ?? ""}
              onChange={(e) =>
                updateTrainField("stationFrom", e.target.value || null)
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Station To
            </label>
            <input
              className="border rounded px-3 py-2 w-full text-sm"
              value={train.stationTo ?? ""}
              onChange={(e) =>
                updateTrainField("stationTo", e.target.value || null)
              }
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-500 mt-2">
          <div>
            Created:{" "}
            {train.created_at
              ? new Date(train.created_at).toLocaleString()
              : "-"}
          </div>
          <div>
            Updated:{" "}
            {train.updated_at
              ? new Date(train.updated_at).toLocaleString()
              : "-"}
          </div>
        </div>
      </section>

      {/* Route editable table */}
      <section className="border rounded bg-white p-4">
        <h2 className="font-semibold text-base mb-3">Route (stations)</h2>

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
              {route.map((r, idx) => (
                <tr key={r.id ?? idx} className="border-t">
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-16"
                      value={r.StnNumber ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "StnNumber",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-20"
                      value={r.StationCode ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "StationCode",
                          e.target.value || null,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-56"
                      value={r.StationName ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "StationName",
                          e.target.value || null,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-20"
                      placeholder="HH:MM"
                      value={r.Arrives ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "Arrives", e.target.value || null)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-20"
                      placeholder="HH:MM"
                      value={r.Departs ?? ""}
                      onChange={(e) =>
                        updateRouteRow(idx, "Departs", e.target.value || null)
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-24"
                      value={r.Stoptime ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "Stoptime",
                          e.target.value || null,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-20"
                      value={r.Distance ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "Distance",
                          e.target.value || null,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-16"
                      value={r.Platform ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "Platform",
                          e.target.value || null,
                        )
                      }
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className="border rounded px-1 py-0.5 w-16"
                      value={r.Day ?? ""}
                      onChange={(e) =>
                        updateRouteRow(
                          idx,
                          "Day",
                          e.target.value ? Number(e.target.value) : null,
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
