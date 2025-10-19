// components/admin/StationsTable.tsx
"use client";
import React, { useEffect, useState } from "react";

const HEADERS = [
  "StationId",
  "StationName",
  "StationCode",
  "Category",
  "EcatRank",
  "Division",
  "RailwayZone",
  "EcatZone",
  "District",
  "State",
  "Lat",
  "Long",
  "Address",
  "ReGroup",
];

function getField(obj: any, name: string) {
  if (!obj) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, name)) return obj[name];
  const lower = name.toLowerCase();
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === lower) return obj[k];
  }
  return undefined;
}

export default function StationsTable() {
  const [stations, setStations] = useState<any[]>([]);
  const [stationId, setStationId] = useState("");
  const [stationName, setStationName] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build query q for legacy API: combine inputs (server likely searches all fields)
  function buildQ() {
    const parts = [];
    if (stationId.trim()) parts.push(stationId.trim());
    if (stationName.trim()) parts.push(stationName.trim());
    if (stationCode.trim()) parts.push(stationCode.trim());
    return parts.join(" ").trim();
  }

  async function fetchStations(overrideSearch?: string) {
    setLoading(true);
    setError(null);
    try {
      // Prefer to send stationId/stationName/stationCode individually
      // but also support legacy 'q' param by sending combined q.
      const url = new URL("/api/stations", location.origin);

      if (typeof overrideSearch === "string") {
        if (overrideSearch) url.searchParams.set("q", overrideSearch);
      } else {
        const q = buildQ();
        if (q) url.searchParams.set("q", q);
        // also include explicit params in case backend supports them
        if (stationId.trim()) url.searchParams.set("stationId", stationId.trim());
        if (stationName.trim()) url.searchParams.set("stationName", stationName.trim());
        if (stationCode.trim()) url.searchParams.set("stationCode", stationCode.trim());
      }

      const res = await fetch(url.toString());
      const json = await res.json();
      if (!res.ok) {
        console.error("stations API error", json);
        setStations([]);
        setError(json?.error ?? "Failed to load stations");
      } else {
        // ensure array
        setStations(Array.isArray(json) ? json : []);
      }
    } catch (e: any) {
      console.error("fetchStations error", e);
      setError((e && e.message) || "Network error");
      setStations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleActive(station: any) {
    const id = getField(station, "StationId") ?? getField(station, "stationid") ?? station.id;
    const current = getField(station, "is_active") ?? getField(station, "IsActive") ?? true;
    const next = !current;

    // optimistic update
    setStations((prev) => prev.map((s) => {
      const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
      if (sid === id) return { ...s, is_active: next };
      return s;
    }));

    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("toggle update failed", json);
        // rollback
        setStations((prev) => prev.map((s) => {
          const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
          if (sid === id) return { ...s, is_active: current };
          return s;
        }));
      } else {
        // merge server response
        setStations((prev) => prev.map((s) => {
          const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
          if (sid === id) return { ...s, ...json };
          return s;
        }));
      }
    } catch (e) {
      console.error("toggleActive error", e);
    }
  }

  function openEdit(station: any) {
    const editable = {
      StationId: getField(station, "StationId") ?? getField(station, "stationid") ?? station.id,
      StationName: getField(station, "StationName") ?? getField(station, "stationname") ?? "",
      StationCode: getField(station, "StationCode") ?? getField(station, "stationcode") ?? "",
      Category: getField(station, "Category") ?? getField(station, "category") ?? "",
      District: getField(station, "District") ?? getField(station, "district") ?? "",
      State: getField(station, "State") ?? getField(station, "state") ?? "",
      Address: getField(station, "Address") ?? getField(station, "address") ?? "",
      is_active: getField(station, "is_active") ?? getField(station, "IsActive") ?? true,
    };
    setEditing(editable);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const id = editing.StationId;
    const payload = {
      StationName: editing.StationName,
      StationCode: editing.StationCode,
      Category: editing.Category,
      District: editing.District,
      State: editing.State,
      Address: editing.Address,
      is_active: !!editing.is_active,
    };
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("saveEdit failed", json);
        alert("Save failed: " + (json?.error ?? "unknown"));
      } else {
        setStations((prev) => prev.map((s) => {
          const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
          if (sid === id) return { ...s, ...json };
          return s;
        }));
        setEditing(null);
      }
    } catch (e) {
      console.error("saveEdit error", e);
      alert("Save error");
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setStationId("");
    setStationName("");
    setStationCode("");
    fetchStations();
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Stations Management</h3>
        <div />
      </div>

      {/* three filter inputs */}
      <form onSubmit={(e) => { e.preventDefault(); fetchStations(); }} className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station ID</label>
            <input
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              placeholder="Station ID"
              className="search-pill-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station Name</label>
            <input
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              placeholder="Station Name"
              className="search-pill-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station Code</label>
            <input
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
              placeholder="Station Code"
              className="search-pill-sm"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={clearFilters} className="px-3 py-2 border rounded-lg bg-white">Clear</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Search</button>
          </div>
        </div>
      </form>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              {HEADERS.map((h) => <th key={h} className="px-3 py-2 border bg-gray-50 text-left text-sm text-gray-700">{h}</th>)}
              <th className="px-3 py-2 border bg-gray-50 text-left text-sm text-gray-700">Active</th>
              <th className="px-3 py-2 border bg-gray-50 text-left text-sm text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={HEADERS.length + 2} className="p-6 text-center">Loading...</td></tr>
            ) : stations.length === 0 ? (
              <tr><td colSpan={HEADERS.length + 2} className="p-6 text-center text-gray-400">No records found</td></tr>
            ) : stations.map((s, idx) => {
              const id = getField(s, "StationId") ?? getField(s, "stationid") ?? idx;
              const active = getField(s, "is_active") ?? getField(s, "IsActive") ?? true;
              return (
                <tr key={String(id)} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  {HEADERS.map((h) => <td key={h} className="px-3 py-2 border text-sm">{String(getField(s, h) ?? "")}</td>)}
                  <td className="px-3 py-2 border">
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={!!active} onChange={() => toggleActive(s)} className="mr-2" />
                      <span className="text-sm">{active ? "On" : "Off"}</span>
                    </label>
                  </td>
                  <td className="px-3 py-2 border">
                    <button onClick={() => openEdit(s)} className="mr-2 px-3 py-1 bg-amber-400 rounded text-sm">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded w-[90%] max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Station {editing.StationId}</h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <div className="text-sm">Station Name</div>
                <input value={editing.StationName} onChange={(e) => setEditing({ ...editing, StationName: e.target.value })} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">Station Code</div>
                <input value={editing.StationCode} onChange={(e) => setEditing({ ...editing, StationCode: e.target.value })} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">Category</div>
                <input value={editing.Category} onChange={(e) => setEditing({ ...editing, Category: e.target.value })} className="w-full border p-2 rounded" />
              </label>
              <label className="col-span-2">
                <div className="text-sm">Address</div>
                <input value={editing.Address} onChange={(e) => setEditing({ ...editing, Address: e.target.value })} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">District</div>
                <input value={editing.District} onChange={(e) => setEditing({ ...editing, District: e.target.value })} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">State</div>
                <input value={editing.State} onChange={(e) => setEditing({ ...editing, State: e.target.value })} className="w-full border p-2 rounded" />
              </label>
              <label className="col-span-2 flex items-center gap-3">
                <input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                <div className="text-sm">Active</div>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
