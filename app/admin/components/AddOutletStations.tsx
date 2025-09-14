'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/db';
export default function AddOutletStations({ onSelect }: { onSelect: (station: any) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        if (!supabase) {
          console.warn('Supabase client not initialized');
          setResults([]);
          return;
        }

        const likePattern = `%${q.trim()}%`;

        const { data, error } = await supabase
          .from('Stations')
          .select('StationId,StationName,StationCode,State,District,Lat,Long')
          .or(`StationName.ilike.${likePattern},StationCode.ilike.${likePattern}`)
          .limit(10);

        if (error) {
          console.error('Station fetch error:', error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="relative w-full">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search Station..."
        className="border px-3 py-2 rounded w-full"
      />

      {loading && <div className="p-2 text-sm">Searching...</div>}

      {!loading && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
          {results.map((s) => (
            <div
              key={s.StationId}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect(s);
                setQ(`${s.StationName} (${s.StationCode})`);
              }}
            >
              <div className="text-sm font-medium">
                {s.StationName}{' '}
                <span className="text-xs text-gray-500">({s.StationCode})</span>
              </div>
              <div className="text-xs text-gray-500">{s.District} • {s.State}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
