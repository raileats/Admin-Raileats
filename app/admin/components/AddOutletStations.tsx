"use client";

import React, { useEffect, useState, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  placeholder = "Search stations by name or code..."
}: {
  value?: Station | null;
  onChange: (s: Station | null) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    if (timer.current) window.clearTimeout(timer.current);
    // debounce 250ms
    timer.current = window.setTimeout(async () => {
      try {
        // search by name prefix or exact code. Using ILIKE prefix for names.
        const nameFilter = `${q}%`;
        const { data, error } = await supabase
          .from("Stations")
          .select("StationId,StationName,StationCode,State,District,Lat,Long")
          .or(`StationName.ilike.${nameFilter},StationCode.ilike.${q}%`)
          .order("StationName", { ascending: true })
          .limit(10);

        if (error) {
          console.error("Stations search error:", error);
          setResults([]);
        } else setResults(data as Station[]);
      } finally {
        setLoading(false);
      }
    }, 250);

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

      {open && (results.length > 0 || q) && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
          {loading && <div className="p-2 text-sm">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No stations</div>
          )}
          {!loading &&
            results.map((s) => (
              <div
                key={s.StationId}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(s);
                  setQ(s.StationName);
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
    </div>
  );
}
