// components/admin/StationsTable.tsx
"use client";
import React, { useEffect, useState } from "react";
import AdminTable, { Column } from "@/components/AdminTable";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // fail early in dev — but in prod ensure env vars exist
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type StationRow = { [k: string]: any; id?: string | number };

export default function StationsTable(): JSX.Element {
  const router = useRouter();

  // filters (three separate boxes)
  const [stationId, setStationId] = useState("");
  const [stationName, setStationName] = useState("");
  const [stationCode, setStationCode] = useState("");

  // data states
  const [rows, setRows] = useState<StationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStations(filters?: { [k: string]: any }) {
    setLoading(true);
    setError(null);
    try {
      let query: any = supabase.from("Stations").select("*").limit(1000); // adjust table name / limit as needed

      // stationId: if numeric use equality, else try ilike on StationName maybe
      if (filters?.stationId) {
        const s = String(filters.stationId).trim();
        if (/^\d+$/.test(s)) {
          query = query.eq("StationId", Number(s));
        } else {
          // if not numeric, search in StationName fallback
          query = query.ilike("StationName", `%${s}%`);
        }
      }

      if (filters?.stationName) {
        const s = String(filters.stationName).trim();
        if (s.length) query = query.ilike("StationName", `%${s}%`);
      }

      if (filters?.stationCode) {
        const s = String(filters.stationCode).trim();
        if (s.length) query = query.ilike("StationCode", `%${s}%`);
      }

      // you can add ordering if you like
      const { data, error: e } = await query;
      if (e) throw e;
      // normalize id
      const normalized = (data ?? []).map((r: any, idx: number) => ({
        id: r.StationId ?? r.id ?? idx,
        ...r,
      }));
      setRows(normalized);
    } catch (err: any) {
      console.error("fetchStations error:", err);
      setError(err?.message ?? String(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function onSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    fetchStations({
      stationId,
      stationName,
      stationCode,
    });
  }

  function onClear() {
    setStationId("");
    setStationName("");
    setStationCode("");
    fetchStations();
  }

  // CSV helpers
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  async function handleExportAll() {
    try {
      setExporting(true);
      setError(null);

      const { data, error } = await supabase.from("Stations").select("*");
      if (error) throw error;

      const rows = data ?? [];
      if (!rows.length) {
        setError("No data found in Stations table.");
        return;
      }

      const headers = Object.keys(rows[0]);
      const BOM = "\uFEFF";
      const csv =
        BOM +
        headers.join(",") +
        "\n" +
        rows
          .map((r: any) => headers.map((h) => escapeCsv(r[h])).join(","))
          .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stations_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("export error:", err);
      setError(err?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function openEditRoute(code: string | number) {
    const c = encodeURIComponent(String(code));
    router.push(`/admin/stations/${c}/edit`);
  }

  const columns: Column<StationRow>[] = [
    { key: "StationId", title: "StationId", width: "90px" },
    { key: "StationName", title: "StationName" },
    { key: "StationCode", title: "StationCode", width: "90px" },
    { key: "Category", title: "Category", width: "80px" },
    { key: "EcatRank", title: "EcatRank", width: "80px" },
    { key: "Division", title: "Division" },
    { key: "RailwayZone", title: "RailwayZone", width: "110px" },
    { key: "EcatZone", title: "EcatZone", width: "90px" },
    { key: "District", title: "District" },
    { key: "State", title: "State", width: "140px" },
    { key: "Lat", title: "Lat", width: "120px", render: r => r.Lat ?? "-" },
    { key: "Long", title: "Long", width: "120px", render: r => r.Long ?? "-" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Stations Management</h3>

        <div className="flex items-center gap-3">
          <button onClick={handleExportAll} disabled={exporting} className="px-4 py-2 bg-sky-500 text-white rounded-lg">
            {exporting ? "Exporting..." : "Download Stations CSV"}
          </button>
        </div>
      </div>

      {/* Filter form: three separate boxes */}
      <form onSubmit={onSearch} className="bg-white mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station ID</label>
            <input
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              placeholder="Station ID"
              className="search-pill-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station Name</label>
            <input
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              placeholder="Station Name"
              className="search-pill-sm"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Search by Station Code</label>
            <input
              value={stationCode}
              onChange={(e) => setStationCode(e.target.value)}
              placeholder="Station Code"
              className="search-pill-sm"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClear} className="px-3 py-2 border rounded-lg bg-white">
              Clear
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Search
            </button>
          </div>
        </div>
      </form>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <AdminTable
        columns={columns}
        data={rows}
        loading={loading}
        pageSize={15}
        // keep internal header minimal; filters already above
        actions={(row) => (
          <button onClick={() => openEditRoute(row.StationId ?? row.id)} className="px-3 py-1 rounded-md bg-amber-400 text-black">
            Edit
          </button>
        )}
        title=""
        subtitle=""
      />
    </div>
  );
}
