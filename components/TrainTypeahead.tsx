// components/TrainTypeahead.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Train = { train_no?: string; number?: string; name?: string };

export default function TrainTypeahead({
  onSelect,
  placeholder = 'Train number or name...'
}: {
  onSelect: (val: string | Train) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        // CHANGE TABLE/COLUMNS HERE if your schema is different
        const { data, error } = await supabase
          .from('Trains')
          .select('train_no,name')
          .ilike('train_no', `${q}%`)
          .or(`name.ilike.%${q}%`)
          .limit(10);

        if (error) {
          console.warn('Trains search error:', error);
          setResults([]);
        } else {
          setResults((data as Train[]) ?? []);
        }
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250) as unknown as number;

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder={placeholder}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          className="px-3 py-2 border rounded"
          onClick={() => { setQ(''); setResults([]); setOpen(false); onSelect(''); }}
        >
          Clear
        </button>
      </div>

      {open && (loading || results.length > 0 || q) && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
          {loading && <div className="p-2 text-sm">Searching…</div>}
          {!loading && results.length === 0 && q && <div className="p-2 text-sm text-gray-500">No results</div>}
          {!loading && results.map((t, i) => {
            const no = t.train_no ?? (t.number ?? '');
            return (
              <div key={`${no}-${i}`} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { onSelect(no || t); setQ(no || t.name || ''); setOpen(false); }}>
                <div className="text-sm font-medium">{no}{no ? ' — ' : ''}{t.name}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
