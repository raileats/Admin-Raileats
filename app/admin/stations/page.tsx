"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Station = {
  id?: number;
  stationid?: string;
  stationname?: string;
  StationCode?: string;
};

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("Stations").select("*").limit(200);
      if (error) {
        setError(error.message);
      } else {
        setStations(data as Station[]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Stations</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && stations.length === 0 && <p>No stations found</p>}

      <table border={1} cellPadding={8} style={{ marginTop: 16, width: "100%" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Station Code</th>
            <th>Station Name</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((s, idx) => (
            <tr key={s.id ?? idx}>
              <td>{s.id ?? s.stationid}</td>
              <td>{s.StationCode ?? s.stationid}</td>
              <td>{s.stationname}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
