// app/admin/components/AddOutletStations.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // सुनिश्चित करो: lib/supabaseClient.js project root पर मौजूद हो

type Station = {
  StationId: number | string;
  StationName: string;
  StationCode?: string;
  State?: string;
  District?: string;
  Lat?: number | null;
  Long?: number | null;
};

export default function AddOutletStations({
  value,
  onChange,
  placeholder = 'Search stations by name or code...',
}: {
  value?: Station | null;
  onChange: (s: Station | null) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        const likePattern = `%${q.trim()}%`;
        const { data, error } = await supabase
          .from('Stations') // ध्यान: अगर तुम्हारी टेबल का नाम lowercase 'stations' है तो उसे बदलकर 'stations' कर दो
          .select('StationId,StationName,StationCode,State,District,Lat,Long')
          .or(`StationName.ilike.${likePattern},StationCode.ilike.${likePattern}`)
          .order('StationName', { ascending: true })
          .limit(10);

        if (error) {
          console.error('Stations search error:', error);
          setResults([]);
        } else {
          setResults((data as Station[]) ?? []);
        }
      } catch (err) {
        console.error('Stations search exception:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  function handleSelect(s: Station) {
    onChange(s);
    setQ(s.StationName);
    setOpen(false);
  }

  function handleClear() {
    setQ('');
    onChange(null);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          className="px-3 py-2 bg-gray-100 border rounded"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>

      {open && (results.length > 0 || q) && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
          {loading && <div className="p-2 text-sm">Searching...</div>}

          {!loading && results.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No stations</div>
          )}

          {!loading &&
            results.map((s) => (
              <div
                key={String(s.StationId)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelect(s)}
              >
                <div className="text-sm font-medium">
                  {s.StationName}{' '}
                  <span className="text-xs text-gray-500">({s.StationCode ?? '—'})</span>
                </div>
                <div className="text-xs text-gray-500">
                  {s.District ?? ''} {s.District && s.State ? '•' : ''} {s.State ?? ''}
                </div>
              </div>
            ))}
        </div>
      )}

      {value && !open && (
        <div className="mt-2 text-sm text-green-700">
          Selected: {value.StationName} ({value.StationCode})
        </div>
      )}
    </div>
  );
}
