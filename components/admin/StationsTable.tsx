// components/admin/StationsTable.tsx
"use client";
import React, { useEffect, useState } from "react";

/**
 * HEADERS: keys used to read fields from API result.
 * title: display label in header / edit form.
 * width optional: hint for column width.
 */
const HEADERS: { key: string; title: string; width?: string }[] = [
  { key: "StationId", title: "Station Id", width: "90px" },
  { key: "StationName", title: "Station Name" },
  { key: "StationCode", title: "Station Code", width: "100px" },
  { key: "Category", title: "Category", width: "90px" },
  { key: "EcatRank", title: "Ecat Rank", width: "80px" },
  { key: "Division", title: "Division", width: "140px" },
  { key: "RailwayZone", title: "Railway Zone", width: "110px" },
  { key: "EcatZone", title: "Ecat Zone", width: "90px" },
  { key: "District", title: "District" },
  { key: "State", title: "State", width: "140px" },
  { key: "Lat", title: "Lat", width: "120px" },
  { key: "Long", title: "Long", width: "120px" },
  { key: "Address", title: "Address" },
  { key: "ReGroup", title: "Re Group", width: "90px" },
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

/** helper to build Supabase public storage URL for StationImage,
 * expects NEXT_PUBLIC_SUPABASE_URL env var like https://xyz.supabase.co
 */
function stationImageUrlFor(code?: string) {
  if (!code) return null;
  const base = (process?.env?.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  if (!base || !base.startsWith("http")) return null;
  // bucket name: StationImage, file pattern: StationImage_<CODE>.png
  return `${base}/storage/v1/object/public/StationImage/StationImage_${encodeURIComponent(String(code))}.png`;
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

  // Build q param by combining fields — backend likely expects q
  function buildQ() {
    const parts: string[] = [];
    if (stationId.trim()) parts.push(stationId.trim());
    if (stationName.trim()) parts.push(stationName.trim());
    if (stationCode.trim()) parts.push(stationCode.trim());
    return parts.join(" ").trim();
  }

  async function fetchStations(overrideSearch?: string) {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/stations", location.origin);

      // If override provided, send it as q
      if (typeof overrideSearch === "string" && overrideSearch.length > 0) {
        url.searchParams.set("q", overrideSearch);
      } else {
        const q = buildQ();
        if (q) url.searchParams.set("q", q);
        // also send explicit params in case backend supports them:
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

  // nicer toggle switch component (pure css)
  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <button
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full p-0.5 flex items-center transition-colors ${checked ? "bg-green-500" : "bg-gray-300"}`}
        title={checked ? "Active" : "Inactive"}
        style={{ outline: "none", border: "none" }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "white",
            transform: checked ? "translateX(20px)" : "translateX(0px)",
            transition: "transform 150ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
        />
      </button>
    );
  }

  async function toggleActive(station: any) {
    const id = getField(station, "StationId") ?? getField(station, "stationid") ?? station.id;
    const current = getField(station, "is_active") ?? getField(station, "IsActive") ?? true;
    const next = !current;

    // optimistic update
    setStations((prev) =>
      prev.map((s) => {
        const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
        if (sid === id) return { ...s, is_active: next };
        return s;
      })
    );

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
        setStations((prev) =>
          prev.map((s) => {
            const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
            if (sid === id) return { ...s, is_active: current };
            return s;
          })
        );
      } else {
        // merge server response
        setStations((prev) =>
          prev.map((s) => {
            const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
            if (sid === id) return { ...s, ...json };
            return s;
          })
        );
      }
    } catch (e) {
      console.error("toggleActive error", e);
    }
  }

  function openEdit(station: any) {
    // create editable object containing all keys from HEADERS + is_active
    const editable: any = {};
    for (const h of HEADERS) {
      editable[h.key] = getField(station, h.key) ?? "";
    }
    editable.is_active = getField(station, "is_active") ?? getField(station, "IsActive") ?? true;
    setEditing(editable);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    const id = editing.StationId;
    // Only send editable fields (exclude StationId/StationCode/StationName if they are read-only)
    const payload: any = {};
    for (const h of HEADERS) {
      if (["StationId", "StationCode", "StationName"].includes(h.key)) continue; // don't update these
      payload[h.key] = editing[h.key];
    }
    payload.is_active = !!editing.is_active;

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
        setStations((prev) =>
          prev.map((s) => {
            const sid = getField(s, "StationId") ?? getField(s, "stationid") ?? s.id;
            if (sid === id) return { ...s, ...json };
            return s;
          })
        );
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
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Stations Management</h3>
      </div>

      {/* filters */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchStations();
        }}
        className="mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station ID</label>
            <input
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              placeholder="Station ID"
              className="search-pill-sm"
              // when user presses Enter in this field, the form submits
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station Name</label>
            <input value={stationName} onChange={(e) => setStationName(e.target.value)} placeholder="Station Name" className="search-pill-sm" />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station Code</label>
            <input value={stationCode} onChange={(e) => setStationCode(e.target.value)} placeholder="Station Code" className="search-pill-sm" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={clearFilters} className="px-3 py-2 border rounded-lg bg-white">
              Clear
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Search
            </button>
          </div>
        </div>
      </form>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      <div className="overflow-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h.key}
                  className="px-3 py-2 border bg-gray-50 text-left text-sm text-gray-700 whitespace-normal break-words"
                  style={h.width ? { width: h.width } : undefined}
                >
                  {h.title}
                </th>
              ))}
              <th className="px-3 py-2 border bg-gray-50 text-left text-sm text-gray-700">Active</th>
              <th className="px-3 py-2 border bg-gray-50 text-left text-sm text-gray-700">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={HEADERS.length + 2} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : stations.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length + 2} className="p-6 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              stations.map((s, idx) => {
                const id = getField(s, "StationId") ?? getField(s, "stationid") ?? idx;
                const active = getField(s, "is_active") ?? getField(s, "IsActive") ?? true;
                return (
                  <tr key={String(id)} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {HEADERS.map((h) => (
                      <td key={h.key} className="px-3 py-2 border text-sm" style={h.width ? { width: h.width } : undefined}>
                        {String(getField(s, h.key) ?? "")}
                      </td>
                    ))}

                    {/* Active toggle */}
                    <td className="px-3 py-2 border">
                      <div className="flex items-center gap-3">
                        <Toggle checked={!!active} onChange={() => toggleActive(s)} />
                        <span className="text-sm">{active ? "On" : "Off"}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2 border">
                      <button onClick={() => openEdit(s)} className="mr-2 px-3 py-1 bg-amber-400 rounded text-sm">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <div className="bg-white p-6 rounded w-full max-w-4xl overflow-auto" style={{ maxHeight: "90vh" }}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold mb-2">Edit Station {editing.StationId}</h3>
              <div className="text-sm text-gray-500">Station Code: <strong>{editing.StationCode}</strong></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left: image preview */}
              <div className="col-span-1">
                {editing.StationCode ? (
                  <img
                    src={stationImageUrlFor(editing.StationCode) ?? ""}
                    alt={editing.StationCode}
                    onError={(e) => {
                      // hide broken image
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    className="w-full h-48 object-contain rounded border"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-50 rounded border flex items-center justify-center text-sm text-gray-400">
                    No image
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">Image loaded from storage path: <code>StationImage/StationImage_{editing.StationCode}.png</code></div>
              </div>

              {/* Right: form fields */}
              <div className="col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  {/* StationId (read-only) */}
                  <label className="col-span-2">
                    <div className="text-sm">Station Id</div>
                    <input value={editing.StationId} readOnly className="w-full border p-2 rounded bg-gray-50" />
                  </label>

                  {/* Station Name (read-only) */}
                  <label className="col-span-2">
                    <div className="text-sm">Station Name</div>
                    <input value={editing.StationName} readOnly className="w-full border p-2 rounded bg-gray-50" />
                  </label>

                  {/* Station Code (read-only) */}
                  <label>
                    <div className="text-sm">Station Code</div>
                    <input value={editing.StationCode} readOnly className="w-full border p-2 rounded bg-gray-50" />
                  </label>

                  {/* Editable fields — loop HEADERS and show inputs for editable ones */}
                  {HEADERS.filter(h => !["StationId","StationName","StationCode"].includes(h.key)).map(h => (
                    <label key={h.key}>
                      <div className="text-sm">{h.title}</div>
                      <input
                        value={editing[h.key] ?? ""}
                        onChange={(e) => setEditing({ ...editing, [h.key]: e.target.value })}
                        className="w-full border p-2 rounded"
                      />
                    </label>
                  ))}

                  {/* is_active toggle within form */}
                  <label className="col-span-2 flex items-center gap-3 mt-2">
                    <div className="text-sm">Active</div>
                    <Toggle checked={!!editing.is_active} onChange={(v) => setEditing({ ...editing, is_active: v })} />
                    <span className="text-sm">{editing.is_active ? "On" : "Off"}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded">
                Cancel
              </button>
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
