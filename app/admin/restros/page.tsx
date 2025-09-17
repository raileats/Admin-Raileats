"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Restro = {
  RestroCode: number;
  RestroName: string;
  StationCode: string;
  StationName: string;
  OwnerName: string;
  IRCTCStatus?: string;
  RaileatsStatus?: string;
  IsIrctcApproved?: boolean;
  FSSAIExpiry?: string;
};

export default function RestroMasterPage() {
  const router = useRouter();

  // Search fields
  const [restroCode, setRestroCode] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [stationName, setStationName] = useState("");
  const [restroName, setRestroName] = useState("");

  const [restros, setRestros] = useState<Restro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    fetchRestros();
  }, []);

  async function fetchRestros(filters?: any) {
    setLoading(true);
    setError(null);

    let query = supabase.from("RestroMaster").select("*").limit(200);

    if (filters?.restroCode) {
      query = query.ilike("RestroCode", `%${filters.restroCode}%`);
    }
    if (filters?.ownerName) {
      query = query.ilike("OwnerName", `%${filters.ownerName}%`);
    }
    if (filters?.stationCode) {
      query = query.ilike("StationCode", `%${filters.stationCode}%`);
    }
    if (filters?.stationName) {
      query = query.ilike("StationName", `%${filters.stationName}%`);
    }
    if (filters?.restroName) {
      query = query.ilike("RestroName", `%${filters.restroName}%`);
    }

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setRestros(data as Restro[]);
    }
    setLoading(false);
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchRestros({ restroCode, ownerName, stationCode, stationName, restroName });
  }

  return (
    <main style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Restro Master</h1>
        <button
          onClick={() => router.push("/admin/restros/new")}
          style={{
            background: "#16a34a",
            color: "white",
            padding: "8px 14px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          + Add New Restro
        </button>
      </div>

      {/* Search Form */}
      <form
        onSubmit={onSearch}
        style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}
      >
        <input
          placeholder="Restro Code"
          value={restroCode}
          onChange={(e) => setRestroCode(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Owner Name"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Station Code"
          value={stationCode}
          onChange={(e) => setStationCode(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Station Name"
          value={stationName}
          onChange={(e) => setStationName(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="Restro Name"
          value={restroName}
          onChange={(e) => setRestroName(e.target.value)}
          style={{ padding: 8 }}
        />
        <button
          type="submit"
          style={{
            gridColumn: "span 5",
            background: "#0ea5e9",
            color: "white",
            padding: "10px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      {/* Error */}
      {error && <div style={{ color: "red", marginBottom: 12 }}>Error: {error}</div>}

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
            <th style={{ padding: 10 }}>Restro Code</th>
            <th style={{ padding: 10 }}>Restro Name</th>
            <th style={{ padding: 10 }}>Station Code</th>
            <th style={{ padding: 10 }}>Station Name</th>
            <th style={{ padding: 10 }}>Owner Name</th>
            <th style={{ padding: 10 }}>IRCTC Status</th>
            <th style={{ padding: 10 }}>Raileats Status</th>
            <th style={{ padding: 10 }}>Is IRCTC Approved</th>
            <th style={{ padding: 10 }}>FSSAI Expiry</th>
            <th style={{ padding: 10 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={10} style={{ padding: 20, textAlign: "center" }}>
                Loading...
              </td>
            </tr>
          ) : restros.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ padding: 20, textAlign: "center" }}>
                No restros found
              </td>
            </tr>
          ) : (
            restros.map((r) => (
              <tr key={r.RestroCode} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{r.RestroCode}</td>
                <td style={{ padding: 8 }}>{r.RestroName}</td>
                <td style={{ padding: 8 }}>{r.StationCode}</td>
                <td style={{ padding: 8 }}>{r.StationName}</td>
                <td style={{ padding: 8 }}>{r.OwnerName}</td>
                <td style={{ padding: 8 }}>{r.IRCTCStatus ?? "-"}</td>
                <td style={{ padding: 8 }}>{r.RaileatsStatus ?? "-"}</td>
                <td style={{ padding: 8 }}>{r.IsIrctcApproved ? "Yes" : "No"}</td>
                <td style={{ padding: 8 }}>{r.FSSAIExpiry ?? "-"}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => router.push(`/admin/restros/edit/${r.RestroCode}`)}
                    style={{
                      background: "#facc15",
                      padding: "6px 10px",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </main>
  );
}
