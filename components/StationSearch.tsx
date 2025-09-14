// components/StationSearch.tsx  (CLIENT)
'use client';
import React, { useState, useEffect } from 'react';

export default function StationSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!q) {
        setResults([]);
        return;
      }
      setLoading(true);
      fetch(`/api/stations?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
          setResults(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error('fetch stations error', err);
          setResults([]);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(t);
  }, [q]);

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search stations..." />
      {loading && <div>Loading…</div>}
      <ul>
        {results.map(r => (
          <li key={r.stationid ?? r.id}>{r.stationname ?? r.name} ({r.StationCode ?? ''})</li>
        ))}
      </ul>
    </div>
  );
}
