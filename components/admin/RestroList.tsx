'use client';
import React, { useEffect, useState } from 'react';
import RestroModal from './RestroModal';

export default function RestroList() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  async function fetchList(search = '') {
    setLoading(true);
    try {
      const url = new URL('/api/restros', location.origin);
      if (search) url.searchParams.set('q', search);
      const res = await fetch(url.toString());
      const json = await res.json();
      setList(Array.isArray(json) ? json : []);
    } catch (e) { console.error(e); setList([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchList(); }, []);

  function openAdd() { setEditing(null); setModalOpen(true); }
  function openEdit(row: any) { setEditing(row); setModalOpen(true); }

  async function handleSave(payload: any) {
    setSaving(true);
    try {
      if (editing && editing.RestroCode) {
        const res = await fetch(`/api/restros/${encodeURIComponent(editing.RestroCode)}`, {
          method: 'PATCH',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok) {
          setList(prev => prev.map(r => r.RestroCode === json.RestroCode ? json : r));
        } else {
          alert('Update failed: ' + (json.error || 'unknown'));
        }
      } else {
        const res = await fetch('/api/restros', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (res.ok || res.status === 201) {
          setList(prev => [json, ...prev]);
        } else {
          alert('Create failed: ' + (json.error || 'unknown'));
        }
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('Save error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search Restro code/name/owner/station..." className="border p-2 rounded flex-1" />
        <button onClick={()=>fetchList(q)} className="px-4 py-2 bg-blue-600 text-white rounded">Search</button>
        <button onClick={openAdd} className="px-4 py-2 bg-green-600 text-white rounded">+ Add New Restro</button>
      </div>

      {loading ? <div>Loading…</div> : (
        <div className="overflow-auto">
          <table className="min-w-full border">
            <thead>
              <tr>
                <th className="p-2 border">Restro Code</th>
                <th className="p-2 border">Restro Name</th>
                <th className="p-2 border">Owner</th>
                <th className="p-2 border">Station Code</th>
                <th className="p-2 border">Station Name</th>
                <th className="p-2 border">Owner Phone</th>
                <th className="p-2 border">FSSAI No</th>
                <th className="p-2 border">FSSAI Expiry</th>
                <th className="p-2 border">IRCTC Status</th>
                <th className="p-2 border">Raileats Status</th>
                <th className="p-2 border">IRCTC Approved</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={12} className="p-4 text-center">No restros found</td></tr>}
              {list.map((r:any) => (
                <tr key={r.RestroCode}>
                  <td className="p-2 border">{r.RestroCode}</td>
                  <td className="p-2 border">{r.RestroName}</td>
                  <td className="p-2 border">{r.OwnerName}</td>
                  <td className="p-2 border">{r.StationCode}</td>
                  <td className="p-2 border">{r.StationName}</td>
                  <td className="p-2 border">{r.OwnerPhone}</td>
                  <td className="p-2 border">{r.FSSAINumber}</td>
                  <td className="p-2 border">{r.FSSAIExpiryDate ? new Date(r.FSSAIExpiryDate).toLocaleDateString() : ''}</td>
                  <td className="p-2 border">{r.IRCTCStatus}</td>
                  <td className="p-2 border">{r.RaileatsStatus}</td>
                  <td className="p-2 border">{r.IsIrctcApproved ? 'Yes' : 'No'}</td>
                  <td className="p-2 border">
                    <button onClick={()=>openEdit(r)} className="px-3 py-1 bg-yellow-400 rounded">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RestroModal open={modalOpen} onClose={()=>setModalOpen(false)} initial={editing} onSave={handleSave} saving={saving} />
    </div>
  );
}
