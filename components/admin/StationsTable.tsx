// components/admin/StationsTable.tsx
'use client';
import React, { useEffect, useState } from 'react';

const HEADERS = [
  'StationId','StationName','StationCode','Category','EcatRank','Division',
  'RailwayZone','EcatZone','District','State','Lat','Long','Address','ReGroup'
];

// helper: safe getter supporting different casings
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
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  // modal state
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchStations(search = '') {
    setLoading(true);
    try {
      const url = new URL('/api/stations', location.origin);
      if (search) url.searchParams.set('q', search);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (res.ok) setStations(Array.isArray(json) ? json : []);
      else { console.error('API error', json); setStations([]); }
    } catch (e) {
      console.error('fetchStations error', e);
      setStations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStations(); }, []);

  // toggle is_active
  async function toggleActive(station: any) {
    const id = getField(station, 'StationId') ?? getField(station, 'stationid') ?? station.id;
    const current = getField(station, 'is_active') ?? getField(station, 'IsActive') ?? true;
    const next = !current;

    // optimistic UI update
    setStations(prev => prev.map(s => {
      const sid = getField(s, 'StationId') ?? getField(s, 'stationid') ?? s.id;
      if (sid === id) return { ...s, is_active: next };
      return s;
    }));

    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: next })
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('toggle update failed', json);
        // revert on failure
        setStations(prev => prev.map(s => {
          const sid = getField(s, 'StationId') ?? getField(s, 'stationid') ?? s.id;
          if (sid === id) return { ...s, is_active: current };
          return s;
        }));
      } else {
        // replace with server-returned row if provided
        setStations(prev => prev.map(s => {
          const sid = getField(s, 'StationId') ?? getField(s, 'stationid') ?? s.id;
          if (sid === id) return { ...s, ...json };
          return s;
        }));
      }
    } catch (e) {
      console.error('toggleActive error', e);
    }
  }

  // start editing
  function openEdit(station: any) {
    // clone and normalize fields we will edit
    const editable = {
      StationId: getField(station, 'StationId') ?? getField(station, 'stationid') ?? station.id,
      StationName: getField(station, 'StationName') ?? getField(station, 'stationname') ?? '',
      StationCode: getField(station, 'StationCode') ?? getField(station, 'stationcode') ?? '',
      Category: getField(station, 'Category') ?? getField(station, 'category') ?? '',
      District: getField(station, 'District') ?? getField(station, 'district') ?? '',
      State: getField(station, 'State') ?? getField(station, 'state') ?? '',
      Address: getField(station, 'Address') ?? getField(station, 'address') ?? '',
      is_active: getField(station, 'is_active') ?? getField(station, 'IsActive') ?? true
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
      is_active: !!editing.is_active
    };
    try {
      const res = await fetch(`/api/stations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('saveEdit failed', json);
        alert('Save failed: ' + (json?.error ?? 'unknown'));
      } else {
        // update local list
        setStations(prev => prev.map(s => {
          const sid = getField(s, 'StationId') ?? getField(s, 'stationid') ?? s.id;
          if (sid === id) return { ...s, ...json };
          return s;
        }));
        setEditing(null);
      }
    } catch (e) {
      console.error('saveEdit error', e);
      alert('Save error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Station name or code..."
          className="border p-2 rounded"
        />
        <button onClick={() => fetchStations(q)} className="btn px-4 py-2 bg-blue-600 text-white rounded">Search</button>
      </div>

      {loading ? <div>Loading…</div> : (
        <div className="overflow-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                {HEADERS.map(h => <th key={h} className="px-2 py-1 border bg-gray-100 text-left">{h}</th>)}
                <th className="px-2 py-1 border bg-gray-100 text-left">Active</th>
                <th className="px-2 py-1 border bg-gray-100 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stations.length === 0 && (
                <tr><td colSpan={HEADERS.length + 2} className="p-4 text-center">No stations found</td></tr>
              )}
              {stations.map((s, idx) => {
                const id = getField(s, 'StationId') ?? getField(s, 'stationid') ?? idx;
                const active = getField(s, 'is_active') ?? getField(s, 'IsActive') ?? true;
                return (
                  <tr key={id}>
                    {HEADERS.map(h => (
                      <td key={h} className="px-2 py-1 border">{String(getField(s, h) ?? '')}</td>
                    ))}
                    <td className="px-2 py-1 border">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!active}
                          onChange={() => toggleActive(s)}
                          className="mr-2"
                        />
                        <span className="text-sm">{active ? 'On' : 'Off'}</span>
                      </label>
                    </td>
                    <td className="px-2 py-1 border">
                      <button onClick={() => openEdit(s)} className="mr-2 px-3 py-1 bg-yellow-400 rounded">Edit</button>
                      {/* future: add delete or more actions */}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white p-6 rounded w-[90%] max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Edit Station {editing.StationId}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <div className="text-sm">Station Name</div>
                <input value={editing.StationName} onChange={(e)=>setEditing({...editing, StationName: e.target.value})} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">Station Code</div>
                <input value={editing.StationCode} onChange={(e)=>setEditing({...editing, StationCode: e.target.value})} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">Category</div>
                <input value={editing.Category} onChange={(e)=>setEditing({...editing, Category: e.target.value})} className="w-full border p-2 rounded" />
              </label>
              <label className="col-span-2">
                <div className="text-sm">Address</div>
                <input value={editing.Address} onChange={(e)=>setEditing({...editing, Address: e.target.value})} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">District</div>
                <input value={editing.District} onChange={(e)=>setEditing({...editing, District: e.target.value})} className="w-full border p-2 rounded" />
              </label>
              <label>
                <div className="text-sm">State</div>
                <input value={editing.State} onChange={(e)=>setEditing({...editing, State: e.target.value})} className="w-full border p-2 rounded" />
              </label>
              <label className="col-span-2 flex items-center gap-3">
                <input type="checkbox" checked={!!editing.is_active} onChange={(e)=>setEditing({...editing, is_active: e.target.checked})} />
                <div className="text-sm">Active</div>
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={()=>setEditing(null)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
