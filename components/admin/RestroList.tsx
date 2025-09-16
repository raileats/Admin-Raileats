// components/admin/RestroList.tsx
'use client';
import React, { useEffect, useState } from 'react';

export default function RestroList() {
  const [list, setList] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NOTE: changed endpoint to /api/restros (collection GET)
  async function fetchList(search = '') {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/restros', location.origin); // <-- corrected endpoint
      if (search) url.searchParams.set('q', search);
      const res = await fetch(url.toString());
      if (!res.ok) {
        // try to parse error body, otherwise fallback
        const err = await res.json().catch(() => ({ error: res.statusText || 'Fetch error' }));
        console.error('restros fetch error', err);
        setList([]);
        setError(err?.error || `Request failed (${res.status})`);
        return;
      }
      const json = await res.json().catch(() => null);
      // handle different shapes: { data: [...] } or direct array [...]
      const rows = Array.isArray(json) ? json : (json && Array.isArray(json.data) ? json.data : []);
      setList(rows);
    } catch (e: any) {
      console.error('fetchList error', e);
      setList([]);
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <input
          placeholder="Search code / name / owner / station"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{flex:1, padding:8, border:'1px solid #ddd', borderRadius:6}}
        />
        <button onClick={() => fetchList(q)} style={{padding:'8px 12px'}}>Search</button>
      </div>

      {loading ? <div>Loading...</div> : error ? (
        <div style={{color: 'red'}}>Error: {error}</div>
      ) : (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
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
                  <td style={cell} colSpan={11}>No restros found</td>
                </tr>
              )}
              {list.map((r: any) => (
                <tr key={String(r.RestroCode ?? r.id ?? Math.random())}>
                  <td style={cell}>{r.RestroCode}</td>
                  <td style={cell}>{r.RestroName}</td>
                  <td style={cell}>{r.OwnerName}</td>
                  <td style={cell}>{r.StationCode}</td>
                  <td style={cell}>{r.StationName}</td>
                  <td style={cell}>{r.OwnerPhone}</td>
                  <td style={cell}>{r.FSSAINumber}</td>
                  <td style={cell}>{r.FSSAIExpiryDate ? new Date(r.FSSAIExpiryDate).toLocaleDateString() : ''}</td>
                  <td style={cell}>{String(r.IRCTCStatus ?? '')}</td>
                  <td style={cell}>{String(r.RaileatsStatus ?? '')}</td>
                  <td style={cell}>{r.IsIrctcApproved ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px',
  borderBottom: '1px solid #eee',
  background: '#fafafa'
};
const cell: React.CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid #f3f3f3'
};
