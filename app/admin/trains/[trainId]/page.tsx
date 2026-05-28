// app/admin/trains/[trainId]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput } from "@/components/admin/AdminField";
import AdminPage from "@/components/admin/AdminPage";

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

function formatDateTime(value?: string | null) {
  return value ? value.slice(0, 19).replace("T", " ") : "-";
}

function toNumberOrNull(value: string) {
  return value === "" ? null : Number(value) || null;
}

export default function AdminTrainEditPage() {
  const router = useRouter();
  const rawParams = useParams() as { trainId?: string | string[] };
  const trainIdParam =
    Array.isArray(rawParams.trainId)
      ? rawParams.trainId[0]
      : rawParams.trainId || "";

  const [head, setHead] = useState<TrainHead | null>(null);
  const [routeRows, setRouteRows] = useState<TrainRouteRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!trainIdParam) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/admin/trains/${encodeURIComponent(trainIdParam)}`,
          { cache: "no-store" }
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
  }, [trainIdParam]);

  function updateHead<K extends keyof TrainHead>(key: K, value: TrainHead[K]) {
    setHead((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateRouteRow<K extends keyof TrainRouteRow>(
    index: number,
    key: K,
    value: TrainRouteRow[K]
  ) {
    setRouteRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  }

  async function onSave() {
    if (!head || !trainIdParam) return;

    try {
      setSaving(true);
      setError("");

      const res = await fetch(
        `/api/admin/trains/${encodeURIComponent(trainIdParam)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            train: head,
            route: routeRows,
          }),
        }
      );

      const json = await res.json();
      if (!json.ok) {
        console.error("save failed", json);
        setError("Failed to save changes.");
        return;
      }

      router.refresh();
    } catch (e) {
      console.error("save error", e);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !head) {
    return (
      <AdminPage title="Edit Train" subtitle="Loading train details">
        <AdminCard>
          <p className="text-sm text-slate-500">Loading train...</p>
        </AdminCard>
      </AdminPage>
    );
  }

  if (!head) {
    return (
      <AdminPage title="Edit Train" subtitle="Train details unavailable">
        <AdminCard>
          <p className="text-sm font-semibold text-red-600">Train not found.</p>
        </AdminCard>
      </AdminPage>
    );
  }

  const statusValue = head.status === "ACTIVE" ? "ACTIVE" : "INACTIVE";

  return (
    <AdminPage
      title={`Edit Train #${head.trainNumber ?? head.trainId}`}
      subtitle="Update train master details and route station rows"
      actions={
        <>
          <AdminButton variant="secondary" onClick={() => router.push("/admin/trains")}>
            Back
          </AdminButton>
          <AdminButton variant="success" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </AdminButton>
        </>
      }
    >
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <AdminCard title="Train Details">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminField label="Train ID">
            <AdminInput value={head.trainId} readOnly />
          </AdminField>

          <AdminField label="Train Number">
            <AdminInput
              value={head.trainNumber ?? ""}
              onChange={(e) => updateHead("trainNumber", toNumberOrNull(e.target.value))}
            />
          </AdminField>

          <AdminField label="Train Name">
            <AdminInput
              value={head.trainName ?? ""}
              onChange={(e) => updateHead("trainName", e.target.value)}
            />
          </AdminField>

          <AdminField label="Status">
            <div className="flex h-10 items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  updateHead(
                    "status",
                    statusValue === "ACTIVE" ? "INACTIVE" : "ACTIVE"
                  )
                }
                className={[
                  "relative h-6 w-12 rounded-full transition",
                  statusValue === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-all",
                    statusValue === "ACTIVE" ? "left-7" : "left-1",
                  ].join(" ")}
                />
              </button>
              <span className="text-sm font-semibold text-slate-700">{statusValue}</span>
            </div>
          </AdminField>

          <AdminField label="Station From">
            <AdminInput
              value={head.stationFrom ?? ""}
              onChange={(e) => updateHead("stationFrom", e.target.value)}
            />
          </AdminField>

          <AdminField label="Station To">
            <AdminInput
              value={head.stationTo ?? ""}
              onChange={(e) => updateHead("stationTo", e.target.value)}
            />
          </AdminField>

          <AdminField label="Running Days" className="md:col-span-2">
            <AdminInput
              value={head.runningDays ?? ""}
              onChange={(e) => updateHead("runningDays", e.target.value)}
            />
          </AdminField>
        </div>

        <div className="mt-4 rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          Created: {formatDateTime(head.created_at)} | Updated: {formatDateTime(head.updated_at)}
        </div>
      </AdminCard>

      <AdminCard title="Route (stations)" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-left font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Stn #</th>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Arrives</th>
                <th className="px-3 py-3">Departs</th>
                <th className="px-3 py-3">Stop Time</th>
                <th className="px-3 py-3">Distance</th>
                <th className="px-3 py-3">Platform</th>
                <th className="px-3 py-3">Day</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routeRows.map((r, idx) => (
                <tr key={r.id ?? idx} className="bg-white hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-20"
                      value={r.StnNumber ?? ""}
                      onChange={(e) => updateRouteRow(idx, "StnNumber", toNumberOrNull(e.target.value))}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-24"
                      value={r.StationCode ?? ""}
                      onChange={(e) => updateRouteRow(idx, "StationCode", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-56"
                      value={r.StationName ?? ""}
                      onChange={(e) => updateRouteRow(idx, "StationName", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-28"
                      value={r.Arrives ?? ""}
                      onChange={(e) => updateRouteRow(idx, "Arrives", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-28"
                      value={r.Departs ?? ""}
                      onChange={(e) => updateRouteRow(idx, "Departs", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-28"
                      value={r.Stoptime ?? ""}
                      onChange={(e) => updateRouteRow(idx, "Stoptime", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-24"
                      value={r.Distance ?? ""}
                      onChange={(e) => updateRouteRow(idx, "Distance", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-20"
                      value={r.Platform ?? ""}
                      onChange={(e) => updateRouteRow(idx, "Platform", e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <AdminInput
                      className="h-8 w-20"
                      value={r.Day ?? ""}
                      onChange={(e) => updateRouteRow(idx, "Day", toNumberOrNull(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </AdminPage>
  );
}
