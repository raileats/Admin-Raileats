// components/TrainTypeahead.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/db';

type Train = {
  train_no?: string | number;
  train_name?: string;
  number?: string | number;
  [k: string]: any;
};

export default function TrainTypeahead({ onSelect }: { onSelect: (v: any) => void }) {
  const [q, setQ] = useState<string>('');
  const [results, setResults] = useState<Train[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const timer = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!q || q.trim() === '') {
      setResults([]);
      return;
    }
    if (!supabase) {
      setResults([]);
      return;
    }

    setLoading(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const like = `${q}%`;
        const { data, error } = await supabase
          .from('Trains')
          .select('train_no,train_name,number')
          .or(`train_name.ilike.${like},train_no.ilike.${like},number.ilike.${like}`)
          .limit(10);

        if (error) {
          console.error('TrainTypeahead supabase error:', error);
          setResults([]);
        } else {
          setResults((data as Train[]) || []);
        }
      } catch (err) {
        console.error('TrainTypeahead fetch error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  // basic click outside to close
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Type train number or name..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          if (q) setQ(q);
        }}
      />
      { (loading || results.length > 0) && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
          {loading && <div className="p-2 text-sm">Searching...</div>}
          {!loading && results.length === 0 && <div className="p-2 text-sm text-gray-500">No trains found</div>}
          {!loading && results.map((t) => (
            <div
              key={(t.train_no ?? t.number ?? t.train_name) as any}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect(t);
                setQ(t.train_name ? `${t.train_name} (${t.train_no ?? t.number ?? ''})` : String(t.train_no ?? t.number ?? ''));
                setResults([]);
              }}
            >
              <div className="text-sm font-medium">
                {t.train_name ?? t.number} <span className="text-xs text-gray-500">({t.train_no ?? t.number})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
