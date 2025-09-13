'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // from app/components -> ../../lib

type Station = {
  StationId: number | string;
  StationName: string;
  StationCode?: string;
  State?: string;
  District?: string;
  Lat?: number | null;
  Long?: number | null;
};

export default function StationSearch({ value, onChange, placeholder = 'Search stations...' }: {
  value?: Station | null;
  onChange: (s: Station | null) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setLoading(true);

    timer.current = setTimeout(async () => {
      try {
        const like = `%${q.trim()}%`;
        const { data, error } = await supabase
          .from('Stations') // adjust to 'stations' if your table is lowercase
          .select('StationId,StationName,StationCode,State,District,Lat,Long')
          .or(`StationName.ilike.${like},StationCode.ilike.${like}`)
          .order('StationName', { ascending: true })
          .limit(10);

        if (error) {
          console.error('StationSearch error', error);
          setResults([]);
        } else {
          setResults((data as Station[]) ?? []);
        }
      } catch (err) {
        console.error(err);
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
        className="w-full border rounded px-3 py-2"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <div className="text-sm mt-1">Searching…</div>}
      {!loading && results.length > 0 && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-48 overflow-auto">
          {results.map((s) => (
            <div key={String(s.StationId)} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { onChange(s); setQ(s.StationName); }}>
              <div className="font-medium text-sm">{s.StationName} <span className="text-xs text-gray-500">({s.StationCode ?? '—'})</span></div>
              <div className="text-xs text-gray-500">{s.District ?? ''}{s.District && s.State ? ' • ' : ''}{s.State ?? ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
