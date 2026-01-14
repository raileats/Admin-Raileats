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
      if (!res.ok) {
        console.error('restromaster fetch failed', res.status);
        setList([]);
        return;
      }

      const json = await res.json();
      const rows = Array.isArray(json) ? json : [];

      const sorted = [...rows].sort((a, b) => {
        const aCode = Number(a.RestroCode);
        const bCode = Number(b.RestroCode);
        if (isNaN(aCode) && isNaN(bCode)) return 0;
        if (isNaN(aCode)) return 1;
        if (isNaN(bCode)) return -1;
        return bCode - aCode; // DESC
      });

      setList(sorted);
    } catch (e) {
      console.error('fetchList error', e);
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

  async function handleSave(payload: any) {
    setSaving(true);
    try {
      if (payload.RestroCode && editing) {
        const res = await fetch('/api/restromaster', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (res.ok) {
          setList(prev =>
            prev.map(p => (p.RestroCode === json.RestroCode ? json : p))
          );
        } else {
          alert('Update failed');
        }
      } else {
        const res = await fetch('/api/restromaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (res.ok || res.status === 201) {
          setList(prev => [json, ...prev]); // new restro top
        } else {
          alert('Create failed');
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
          style={{
            flex: 1,
            padding: 8,
            border: '1px solid #ddd',
            borderRadius: 6,
          }}
        />
        <button onClick={() => fetchList(q)} style={{ padding: '8px 12px' }}>
          Search
        </button>
        <button
          onClick={openAdd}
          style={{
            padding: '8px 12px',
            background: '#16a34a',
            color: '#fff',
            borderRadius: 6,
          }}
        >
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
                <th style={th}>FSSAI Expiry</th>
                <th style={th}>IRCTC</th>
                <th style={th}>Raileats</th>
                <th style={th}>IRCTC Approved</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td style={cell} colSpan={12}>
                    No restros found
                  </td>
                </tr>
              )}

              {list.map((r: any) => (
                <tr key={String(r.RestroCode)}>
                  <td style={cell}>{r.RestroCode}</td>
                  <td style={cell}>{r.RestroName}</td>
                  <td style={cell}>{r.OwnerName}</td>
                  <td style={cell}>{r.StationCode}</td>
                  <td style={cell}>{r.StationName}</td>
                  <td style={cell}>{r.OwnerPhone}</td>
                  <td style={cell}>{r.FSSAINumber}</td>
                  <td style={cell}>
                    {r.FSSAIExpiryDate
                      ? new Date(r.FSSAIExpiryDate).toLocaleDateString()
                      : ''}
                  </td>
                  <td style={cell}>{r.IRCTCStatus}</td>
                  <td style={cell}>{r.RaileatsStatus}</td>
                  <td style={cell}>{r.IsIrctcApproved ? 'Yes' : 'No'}</td>
                  <td style={cell}>
                    <button
                      onClick={() => openEdit(r)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        background: '#f59e0b',
                        border: 'none',
                      }}
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
   STYLES
   ========================= */
const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px',
  borderBottom: '1px solid #eee',
  background: '#fafafa',
};

const cell: React.CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid #f3f3f3',
};
