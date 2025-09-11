"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function StationSearch({ value, onChange }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("Stations")
        .select("StationId, StationName, StationCode, State")
        .ilike("StationName", `${q}%`)
        .limit(10);
      if (!error) setResults(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  return (
    <div className="relative">
      <input
        className="w-full border rounded p-2"
        placeholder="Search station..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <div className="text-sm p-2">Searching…</div>}
      {results.length > 0 && (
        <div className="absolute bg-white border rounded w-full max-h-60 overflow-auto z-10">
          {results.map((s) => (
            <div
              key={s.StationId}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onChange(s); // parent को station भेजें
                setQ(`${s.StationName} (${s.StationCode})`);
                setResults([]);
              }}
            >
              {s.StationName} ({s.StationCode}) – {s.State}
            </div>
          ))}
        </div>
      )}
      {value && (
        <div className="text-xs text-green-700 mt-1">
          Selected: {value.StationName} ({value.StationCode})
        </div>
      )}
    </div>
  );
}
