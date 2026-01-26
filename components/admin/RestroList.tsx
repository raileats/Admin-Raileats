'use client';
import React, { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

export default function RestroList() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH LIST ================= */
  async function fetchList(search = '') {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/restrosmaster', location.origin);
      if (search) url.searchParams.set('q', search);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.error || 'Fetch failed');
        setList([]);
        return;
      }

      const json = await res.json();
      const rows = Array.isArray(json)
        ? json
        : Array.isArray(json?.data)
        ? json.data
        : [];

      const sorted = [...rows].sort(
        (a, b) => Number(b.RestroCode) - Number(a.RestroCode)
      );

      setList(sorted);
    } catch (e: any) {
      setError(String(e?.message || e));
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  /* ================= TOGGLE STATUS ================= */
  async function toggleRaileats(r: any) {
    const nextStatus = r.RaileatsStatus === 'On' ? 'Off' : 'On';

    try {
      const res = await fetch('/api/restrosmaster', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          RestroCode: r.RestroCode,
          RaileatsStatus: nextStatus,
        }),
      });

      if (!res.ok) {
        alert('Status update failed');
        return;
      }

      // refresh list
      fetchList(q);
    } catch {
      alert('Status update error');
    }
  }

  return (
    <div>
      {/* SEARCH */}
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
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
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

              {list.map((r: any) => {
                const isOn = r.RaileatsStatus === 'On';

                return (
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
                    <td style={cell}>{String(r.IRCTCStatus ?? '')}</td>

                    {/* 🔵 SLIDE SWITCH */}
                    <td style={cell}>
                      <div
                        onClick={() => toggleRaileats(r)}
                        style={{
                          width: 44,
                          height: 22,
                          borderRadius: 999,
                          background: isOn ? '#2563eb' : '#9ca3af',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#fff',
                            position: 'absolute',
                            top: 2,
                            left: isOn ? 24 : 2,
                            transition: 'left 0.2s',
                          }}
                        />
                      </div>
                    </td>

                    <td style={cell}>
                      {r.IsIrctcApproved ? 'Yes' : 'No'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
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
  padding: 8,
  border: '1px solid #ddd',
  borderRadius: 6,
};

const btn: CSSProperties = {
  padding: '8px 12px',
};
