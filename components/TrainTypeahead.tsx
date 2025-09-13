// components/TrainTypeahead.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function TrainTypeahead({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return;
    const handler = setTimeout(async () => {
      const { data, error } = await supabase
        .rpc('rpc_search_trains', { q: query, limit_rows: 10 });
      if (!error) setResults(data ?? []);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border px-3 py-2 rounded"
        placeholder="Enter train no or name"
      />
      {results.length > 0 && (
        <ul className="absolute w-full bg-white border rounded mt-1 z-10 max-h-64 overflow-auto">
          {results.map((t) => (
            <li
              key={t.train_no}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelect(t.train_no)}
            >
              {t.train_no} — {t.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
