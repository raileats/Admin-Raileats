'use client';
import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';  // ✅ सही path

export default function StationSearch({ value, onChange, placeholder = 'Search stations...' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const ref = useRef<any>(null);
// Guarded supabase client — if env not set, supabase will be null and component will degrade gracefully.
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default function StationSearch({ value = null, onChange = () => {}, placeholder = "Search station by name or code..." }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!q || q.trim() === "") {
      setResults([]);
      return;
    }
    if (!supabase) {
      setResults([]);
      return;
    }

    setLoading(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        // prefix search on StationName, and code prefix on StationCode
        const nameFilter = `${q}%`;
        const codeFilter = `${q}%`;
        const { data, error } = await supabase
          .from("Stations")
          .select("StationId,StationName,StationCode,State,District,Lat,Long")
          .or(`StationName.ilike.${nameFilter},StationCode.ilike.${codeFilter}`)
          .order("StationName", { ascending: true })
          .limit(10);

        if (error) {
          console.error("StationSearch supabase error:", error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error("StationSearch fetch error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (timer.current) clearTimeout(timer.current);
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
          className="px-3 py-2 bg-gray-100 border rounded"
          onClick={() => {
            setQ("");
            onChange(null);
            setResults([]);
            setOpen(false);
          }}
        >
          Clear
        </button>
      </div>

      {open && (loading || results.length > 0 || q) && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-56 overflow-auto">
          {loading && <div className="p-2 text-sm">Searching...</div>}
          {!loading && results.length === 0 && q && (
            <div className="p-2 text-sm text-gray-500">No stations found</div>
          )}
          {!loading && results.map((s) => (
            <div
              key={s.StationId}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                const station = {
                  StationId: s.StationId,
                  StationName: s.StationName,
                  StationCode: s.StationCode,
                  State: s.State,
                  District: s.District,
                  Lat: s.Lat,
                  Long: s.Long
                };
                onChange(station);
                setQ(`${s.StationName} (${s.StationCode || ""})`);
                setOpen(false);
              }}
            >
              <div className="text-sm font-medium">{s.StationName} <span className="text-xs text-gray-500">({s.StationCode})</span></div>
              <div className="text-xs text-gray-500">{s.District || ""} • {s.State || ""}</div>
            </div>
          ))}
        </div>
      )}

      {value && !open && (
        <div className="mt-2 text-sm text-green-700">Selected: {value.StationName} ({value.StationCode})</div>
      )}

      {!supabase && (
        <div className="mt-2 text-xs text-orange-600">Supabase env not configured — station search disabled.</div>
      )}
    </div>
  );
}
