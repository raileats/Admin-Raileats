'use client';

import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import RestroModal from '../admin/RestroModal';

export default function RestroMasterList() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  /* =========================
     FETCH + SORT (RestroCode DESC)
     ========================= */
  async function fetchList(search = '') {
    setLoading(true);
    try {
      const url = new URL('/api/restromaster', location.origin);
      if (search) url.searchParams.set('q', search);

      const res = await fetch(url.toString());
      const rows = await res.json();

      const sorted = [...rows].sort(
        (a, b) => Number(b.RestroCode) - Number(a.RestroCode)
      );

      setList(sorted);
    } catch (e) {
      console.error(e);
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(r: any) {
    setEditing(r);
    setModalOpen(true);
  }

  async function toggleStatus(r: any) {
    const updated = {
      ...r,
      RaileatsStatus: r.RaileatsStatus === 'On' ? 'Off' : 'On',
    };

    const res = await fetch('/api/restromaster', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      setList(prev =>
        prev.map(x => (x.RestroCode === r.RestroCode ? updated : x))
      );
    } else {
      alert('Status update failed');
    }
  }

  async function handleSave(payload: any) {
    setSaving(true);
    try {
      const res = await fetch('/api/restromaster', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        fetchList();
        setModalOpen(false);
      } else {
        alert('Save failed');
      }
    } catch {
      alert('Save error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* SEARCH + ADD */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search code / name / owner / station"
          value={q}
          onChange={e => setQ(e.target.value)}
          style={input}
        />
        <button onClick={() => fetchList(q)} style={btn}>
          Search
        </button>
        <button onClick={openAdd} style={addBtn}>
          + Add New Restro
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Code</th>
                <th style={th}>Name</th>
                <th style={th}>Owner</th>
                <th style={th}>Station Code</th>
                <th style={th}>Station Name</th>
                <th style={th}>Phone</th>
                <th style={th}>FSSAI</th>
                <th style={th}>RailEats</th>
                <th style={th}>IRCTC</th>
                <th style={th}>Status</th>
                <th style={th}>Action</th>
              </tr>
            </thead>

            <tbody>
              {list.length === 0 && (
                <tr>
                  <td style={cell} colSpan={11}>
                    No restros found
                  </td>
                </tr>
              )}

              {list.map(r => (
                <tr key={r.RestroCode}>
                  <td style={cell}>{r.RestroCode}</td>
                  <td style={cell}>{r.RestroName}</td>
                  <td style={cell}>{r.OwnerName}</td>
                  <td style={cell}>{r.StationCode}</td>
                  <td style={cell}>{r.StationName}</td>
                  <td style={cell}>{r.OwnerPhone}</td>
                  <td style={cell}>{r.FSSAINumber}</td>
                  <td style={cell}>{r.RaileatsStatus}</td>
                  <td style={cell}>
                    {r.IsIrctcApproved ? 'Yes' : 'No'}
                  </td>

                  {/* STATUS TOGGLE */}
                  <td style={cell}>
                    <button
                      onClick={() => toggleStatus(r)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #ddd',
                        background:
                          r.RaileatsStatus === 'On'
                            ? '#dcfce7'
                            : '#fee2e2',
                        color:
                          r.RaileatsStatus === 'On'
                            ? '#166534'
                            : '#991b1b',
                      }}
                    >
                      {r.RaileatsStatus === 'On' ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* EDIT */}
                  <td style={cell}>
                    <button
                      onClick={() => openEdit(r)}
                      style={editBtn}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL */}
      <RestroModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}

/* =========================
   STYLES (TS SAFE)
   ========================= */

const th: CSSProperties = {
  textAlign: 'left',
  padding: '8px',
  borderBottom: '1px solid #eee',
  background: '#fafafa',
};

const cell: CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid #f3f3f3',
};

const input: CSSProperties = {
  flex: 1,
  padding: '8px',
  border: '1px solid #ddd',
  borderRadius: '6px',
};

const btn: CSSProperties = {
  padding: '8px 12px',
};

const addBtn: CSSProperties = {
  padding: '8px 12px',
  background: '#16a34a',
  color: '#fff',
  borderRadius: '6px',
  border: 'none',
};

const editBtn: CSSProperties = {
  padding: '6px 10px',
  borderRadius: '6px',
  background: '#f59e0b',
  border: 'none',
};
