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

  /* ================= FETCH ================= */
  async function fetchList(search = '') {
    setLoading(true);
    try {
      const url = new URL('/api/restromaster', location.origin);
      if (search) url.searchParams.set('q', search);

      const res = await fetch(url.toString());
      const json = await res.json();

      const rows = Array.isArray(json) ? json : [];
      rows.sort((a, b) => Number(b.RestroCode) - Number(a.RestroCode));
      setList(rows);
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

  /* ================= STATUS TOGGLE ================= */
  async function toggleStatus(r: any) {
    const next = r.RaileatsStatus === 'On' ? 'Off' : 'On';

    await fetch('/api/restromaster', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        RestroCode: r.RestroCode,
        RaileatsStatus: next,
      }),
    });

    fetchList(q); // refresh
  }

  function openEdit(r: any) {
    setEditing(r);
    setModalOpen(true);
  }

  return (
    <div>
      {/* SEARCH */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search restro"
          style={input}
        />
        <button onClick={() => fetchList(q)}>Search</button>
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
                <th style={th}>Station</th>
                <th style={th}>Owner</th>
                <th style={th}>Phone</th>
                <th style={th}>Raileats</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {list.map((r) => {
                const on = r.RaileatsStatus === 'On';

                return (
                  <tr key={r.RestroCode}>
                    <td style={cell}>{r.RestroCode}</td>
                    <td style={cell}>{r.RestroName}</td>
                    <td style={cell}>{r.StationName}</td>
                    <td style={cell}>{r.OwnerName}</td>
                    <td style={cell}>{r.OwnerPhone}</td>

                    {/* 🔵 SLIDER */}
                    <td style={cell}>
                      <div
                        onClick={() => toggleStatus(r)}
                        style={{
                          width: 44,
                          height: 22,
                          borderRadius: 999,
                          background: on ? '#2563eb' : '#9ca3af',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            background: '#fff',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: 2,
                            left: on ? 24 : 2,
                            transition: 'left 0.2s',
                          }}
                        />
                      </div>
                    </td>

                    {/* ACTION */}
                    <td style={cell}>
                      <button
                        onClick={() => openEdit(r)}
                        style={editBtn}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <RestroModal
        open={modalOpen}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSave={() => fetchList(q)}
        saving={saving}
      />
    </div>
  );
}

/* ================= STYLES ================= */
const th: CSSProperties = {
  textAlign: 'left',
  padding: 8,
  background: '#fafafa',
  borderBottom: '1px solid #eee',
};

const cell: CSSProperties = {
  padding: 8,
  borderBottom: '1px solid #f3f3f3',
};

const input: CSSProperties = {
  flex: 1,
  padding: 8,
  border: '1px solid #ddd',
  borderRadius: 6,
};

const editBtn: CSSProperties = {
  background: '#facc15',
  border: 'none',
  padding: '6px 10px',
  borderRadius: 6,
};
