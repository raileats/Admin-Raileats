'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Train = {
  train_no?: string;
  number?: string;
  name?: string;
};

export default function TrainTypeahead({
  onSelect,
  placeholder = 'Train number or name...',
}: {
  onSelect: (val: string | Train) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Train[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        // अपनी table के नाम/columns के हिसाब से बदल लें
        // यहाँ generic example है: table 'Trains' with columns: train_no, name
        const { data, error } = await supabase
          .from('Trains')
          .select('train_no,name')
          .or(`train_no.ilike.${q}%,name.ilike.${q}%`)
          .order('train_no', { ascending: true })
          .limit(10);

        if (error) {
          console.warn('Trains search error:', error.message);
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
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="button"
          className="px-3 py-2 border rounded"
          onClick={() => {
            setQ('');
            setResults([]);
            setOpen(false);
          }}
        >
          Clear
        </button>
      </div>

      {open && (results.length > 0 || loading || q) && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-64 overflow-auto">
          {loading && <div className="p-2 text-sm">Searching…</div>}
          {!loading && results.length === 0 && q && (
            <div className="p-2 text-sm text-gray-500">No trains</div>
          )}
          {!loading &&
            results.map((t, idx) => {
              const no = t.train_no ?? t.number ?? '';
              return (
                <div
                  key={`${no}-${idx}`}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    onSelect(no || (t as Train));
                    setQ(no || t.name || '');
                    setOpen(false);
                  }}
                >
                  <div className="text-sm font-medium">
                    {no}{no ? ' — ' : ''}{t.name ?? ''}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
