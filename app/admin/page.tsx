// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type Station = {
  id?: number;
  stationid?: string | number;
  stationname?: string;
  [key: string]: any;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Throwing makes build fail — if you prefer safer behavior remove the throw and handle gracefully.
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
  );
}

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function AdminStationsPage(): JSX.Element {
  const [email, setEmail] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>("");
  const [newStationName, setNewStationName] = useState<string>("");

  // Fetch stations (initial + refresh)
  async function fetchStations() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("stations")
        .select("*")
        .order("id", { ascending: true })
        .limit(500);
      if (e) throw e;
      setStations((data ?? []) as Station[]);
    } catch (err: any) {
      console.error("fetchStations error:", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStations();
  }, []);

  // Filtered view
  const filtered = stations.filter((s) => {
    if (!search) return true;
    const name = String(s.stationname ?? "");
    const id = String(s.stationid ?? s.id ?? "");
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      id.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Add station
  async function addStation() {
    if (!newStationName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const payload = { stationname: newStationName.trim() };
      const { data, error: e } = await supabase.from("stations").insert(payload).select().single();
      if (e) throw e;
      // optimistic: append to list
      setStations((prev) => (data ? [...prev, data as Station] : prev));
      setNewStationName("");
    } catch (err: any) {
      console.error("addStation error:", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  // Delete station (by id)
  async function deleteStation(id?: number | string) {
    if (id === undefined || id === null) return;
    if (!confirm("Delete this station?")) return;
    setLoading(true);
    setError(null);
    try {
      const { error: e } = await supabase.from("stations").delete().eq("id", id).limit(1);
      if (e) throw e;
      setStations((prev) => prev.filter((s) => String(s.id) !== String(id)));
    } catch (err: any) {
      console.error("deleteStation error:", err);
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20, fontFamily: "system-ui, sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Admin — Stations</h1>

      <section style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          Admin email:
          <input
            style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc" }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={fetchStations} disabled={loading} style={{ padding: "6px 10px", borderRadius: 6 }}>
            Refresh
          </button>
        </div>
      </section>

      <section style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center" }}>
        <input
          placeholder="Search stations by name or id..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="New station name"
            value={newStationName}
            onChange={(e) => setNewStationName(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          />
          <button onClick={addStation} disabled={loading || !newStationName.trim()} style={{ borderRadius: 6 }}>
            Add
          </button>
        </div>
      </section>

      <section>
        {loading && <div>Loading…</div>}
        {error && <div style={{ color: "red", marginBottom: 8 }}>Error: {error}</div>}
        {!loading && filtered.length === 0 && <div>No stations found.</div>}

        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filtered.map((s) => {
            const key = s.id ?? s.stationid ?? JSON.stringify(s);
            return (
              <li
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{s.stationname ?? "(no name)"}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    id: {s.id ?? s.stationid ?? "—"} {s.category ? ` · ${s.category}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(s))}
                    title="Copy JSON"
                    style={{ borderRadius: 6 }}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => deleteStation(s.id ?? s.stationid)}
                    style={{ borderRadius: 6, background: "#fff", border: "1px solid #f5c6c6" }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
