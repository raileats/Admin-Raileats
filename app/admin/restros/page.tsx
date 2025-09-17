"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Restro = {
  RestroCode: number;
  RestroName: string;
  OwnerName: string;
  StationCode: string;
  StationName: string;
};

export default function RestroMasterPage() {
  const [restros, setRestros] = useState<Restro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from("RestroMaster").select("*").limit(200);
      if (error) {
        setError(error.message);
      } else {
        setRestros(data as Restro[]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Restro Master</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {!loading && !error && restros.length === 0 && <p>No restros found</p>}

      <table border={1} cellPadding={8} style={{ marginTop: 16, width: "100%" }}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Restro Name</th>
            <th>Owner</th>
            <th>Station Code</th>
            <th>Station Name</th>
          </tr>
        </thead>
        <tbody>
          {restros.map((r) => (
            <tr key={r.RestroCode}>
              <td>{r.RestroCode}</td>
              <td>{r.RestroName}</td>
              <td>{r.OwnerName}</td>
              <td>{r.StationCode}</td>
              <td>{r.StationName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
