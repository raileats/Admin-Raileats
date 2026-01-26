'use client';
import React, { useEffect, useState } from 'react';
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
      const json = await res.json();
      const rows = Array.isArray(json) ? json : [];

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

  /* =========================
     SAVE (ADD / UPDATE)
     ========================= */
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
    } catch (e) {
      console.error(e);
      alert('Save error');
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     TOGGLE RAILEATS STATUS
     ========================= */
  async function toggleRaileats(r: any) {
    try {
      const res = await fetch('/api/restromaster', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          RestroCode: r.RestroCode,
          RaileatsStatus: r.RaileatsStatus === 'ON' ? 'OFF' : 'ON',
        }),
      });

      if (res.ok) {
        setList(prev =>
          prev.map(p =>
            p.RestroCode === r.RestroCode
              ? {
                  ...p,
                  RaileatsStatus:
                    p.RaileatsStatus === 'ON' ? 'OFF' : 'ON',
                }
              : p
          )
        );
      } else {
        alert('Status update failed');
      }
    } catch (e) {
      console.error(e);
      alert('Status error');
    }
  }

  /* =========================
     RENDER
     ========================= */
  return (
    <div>
      {/* SEARCH + ADD */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search code / name / owner / station"
          value={q}
          onChange={(e) => setQ(e.target.value)}
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
                <th style={th}>FSSAI No</th>
                <th style={th}>Raileats Status</th>
                <th style={th}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={9} style={cell}>
                    No restros found
                  </td>
                </tr>
              )}

              {list.map((r) => (
                <tr key={r.RestroCode}>
                  <td style={cell}>{r.RestroCode}</td>
                  <td style={cell}>{r.RestroName}</td>
                  <td style={cell}>{r.OwnerName}</td>
                  <td style={cell}>{r.StationCode}</td>
                  <td style={cell}>{r.StationName}</td>
                  <td style={cell}>{r.OwnerPhone}</td>
                  <td style={cell}>{r.FSSAINumber}</td>

                  {/* ✅ ON / OFF TOGGLE */}
                  <td style={cell}>
                    <button
                      onClick={() => toggleRaileats(r)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: 'none',
                        cursor: 'pointer',
                        background:
                          r.RaileatsStatus === 'ON'
                            ? '#dcfce7'
                            : '#fee2e2',
                        color:
                          r.RaileatsStatus === 'ON'
                            ? '#166534'
                            : '#991b1b',
                        fontWeight: 600,
                      }}
                    >
                      {r.RaileatsStatus}
                    </button>
                  </td>

                  {/* EDIT */}
                  <td style={cell}>
                    <button onClick={() => openEdit(r)} style={editBtn}>
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
   STYLES
   ========================= */
const th = {
  textAlign: 'left',
  padding: 8,
  borderBottom: '1px solid #eee',
  background: '#fafafa',
};

const cell = {
  padding: 8,
  borderBottom: '1px solid #f3f3f3',
};

const input = {
  flex: 1,
  padding: 8,
  border: '1px solid #ddd',
  borderRadius: 6,
};

const btn = {
  padding: '8px 12px',
};

const addBtn = {
  padding: '8px 12px',
  background: '#16a34a',
  color: '#fff',
  borderRadius: 6,
  border: 'none',
};

const editBtn = {
  padding: '6px 10px',
  borderRadius: 6,
  background: '#f59e0b',
  border: 'none',
};
