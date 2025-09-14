"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Station = {
  StationId: number;
  StationName: string;
  StationCode: string;
  State: string;
};

export default function StationSearch({ onSelect }: { onSelect?: (s: Station) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    if (timer.current) window.clearTimeout(timer.current);

    // debounce: wait 300ms
    timer.current = window.setTimeout(async () => {
      const { data, error } = await supabase
        .from("Stations")
        .select("StationId, StationName, StationCode, State")
        .ilike("StationName", `${q}%`)
        .limit(10);

      if (!error && data) setResults(data as Station[]);
      setLoading(false);
    }, 300);

    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [q]);

  return (
    <div className="relative">
      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Search station..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <div className="p-2 text-sm">Searching…</div>}
      {results.length > 0 && (
        <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-60 overflow-auto">
          {results.map((s) => (
            <div
              key={s.StationId}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setQ(s.StationName);
                setResults([]);
                onSelect?.(s);
              }}
            >
              {s.StationName} ({s.StationCode}) – {s.State}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
