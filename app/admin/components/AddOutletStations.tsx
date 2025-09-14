'use client';
import React, { useEffect, useState, useRef } from "react";
import { supabase } from '../../../lib/db';  // तुम्हारे db से import

export default function AddOutletStations({ onSelect }: { onSelect: (station: any) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (!q || q.trim() === "") {
      setResults([]);
      return;
    }

    if (!supabase) {
      console.error("Supabase client is not initialized (missing env vars)");
      return;
    }

    setLoading(true);
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        const likePattern = `%${q.trim()}%`;
        const { data, error } = await supabase
          .from("Stations")
          .select("StationId,StationName,StationCode,State,District,Lat,Long")
          .or(`StationName.ilike.${likePattern},StationCode.ilike.${likePattern}`)
          .limit(10);

        if (error) {
          console.error("Supabase error:", error);
          setResults([]);
        } else {
          setResults(data || []);
        }
      } catch (err) {
        console.error("Search failed:", err);
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
    <div>
      <input
        className="border px-2 py-1 rounded w-full"
        value={q}
        placeholder="Search station..."
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <div>Loading...</div>}
      {!loading &&
        results.map((s) => (
          <div
            key={s.StationId}
            onClick={() => {
              onSelect(s);
              setQ(`${s.StationName} (${s.StationCode})`);
            }}
            className="cursor-pointer hover:bg-gray-100 p-2"
          >
            {s.StationName} ({s.StationCode})
          </div>
        ))}
    </div>
  );
}
