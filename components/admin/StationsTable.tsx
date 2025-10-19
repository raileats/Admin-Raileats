// components/admin/StationsTable.tsx
"use client";
import React, { useEffect, useState } from "react";
import AdminTable, { Column } from "@/components/AdminTable";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Station = { [k: string]: any; id?: string | number };

export default function StationsTable(): JSX.Element {
  const router = useRouter();

  // filters (three separate fields)
  const [stationId, setStationId] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [stationName, setStationName] = useState("");

  // data state
  const [rows, setRows] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStations(filters?: { stationId?: string; stationCode?: string; stationName?: string }) {
    setLoading(true);
    setError(null);
    try {
      let q: any = supabase.from("Stations").select("*").limit(1000);

      if (filters?.stationId) {
        const s = String(filters.stationId).trim();
        if (/^\d+$/.test(s)) q = q.eq("StationId", Number(s));
        else q = q.ilike("StationName", `%${s}%`);
      }

      if (filters?.stationCode) {
        const s = String(filters.stationCode).trim();
        if (s.length) q = q.ilike("StationCode", `%${s}%`);
      }

      if (filters?.stationName) {
        const s = String(filters.stationName).trim();
        if (s.length) q = q.ilike("StationName", `%${s}%`);
      }

      const { data, error: e } = await q;
      if (e) throw e;

      const normalized = (data ?? []).map((r: any, idx: number) => ({
        id: r.StationId ?? idx,
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
    fetchStations({ stationId, stationCode, stationName });
  }

  function onClear() {
    setStationId("");
    setStationCode("");
    setStationName("");
    fetchStations();
  }

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
      const { data, error } = await supabase.from("Stations").select("*");
      if (error) throw error;
      const rowsAll = data ?? [];
      if (!rowsAll.length) {
        setError("No station data available");
        return;
      }
      const headers = Object.keys(rowsAll[0]);
      const BOM = "\uFEFF";
      const csv =
        BOM +
        headers.join(",") +
        "\n" +
        rowsAll.map((r: any) => headers.map((h) => escapeCsv(r[h])).join(",")).join("\n");

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

  const columns: Column<Station>[] = [
    { key: "StationId", title: "StationId", width: "90px" },
    { key: "StationName", title: "StationName" },
    { key: "StationCode", title: "StationCode", width: "90px" },
    { key: "Category", title: "Category", width: "80px" },
    { key: "EcatRank", title: "EcatRank", width: "80px" },
    { key: "Division", title: "Division", width: "140px" },
    { key: "RailwayZone", title: "RailwayZone", width: "90px" },
    { key: "EcatZone", title: "EcatZone", width: "90px" },
    { key: "District", title: "District", width: "160px" },
    { key: "State", title: "State", width: "140px" },
    { key: "Lat", title: "Lat", width: "110px" },
    { key: "Long", title: "Long", width: "110px" },
  ];

  return (
    <div>
      {/* Header + filters */}
      <div className="mb-4">
        <h3 className="text-lg font-medium">Stations Management</h3>

        <form onSubmit={onSearch} className="mt-3 bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row items-start md:items-end gap-3">
          <div className="w-full md:w-1/4">
            <label className="text-xs text-gray-500 mb-1 block">Search by Station ID</label>
            <input value={stationId} onChange={(e) => setStationId(e.target.value)} placeholder="Station ID" className="search-pill-sm" />
          </div>

          <div className="w-full md:w-1/4">
            <label className="text-xs text-gray-500 mb-1 block">Search by Station Code</label>
            <input value={stationCode} onChange={(e) => setStationCode(e.target.value)} placeholder="Station Code" className="search-pill-sm" />
          </div>

          <div className="w-full md:w-1/3">
            <label className="text-xs text-gray-500 mb-1 block">Search by Station Name</label>
            <input value={stationName} onChange={(e) => setStationName(e.target.value)} placeholder="Station Name" className="search-pill-sm" />
          </div>

          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={onClear} className="px-3 py-2 border rounded-lg bg-white">Clear</button>
            <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-lg">Search</button>
          </div>
        </form>
      </div>

      {/* Export button */}
      <div className="flex justify-end mb-3 gap-3">
        <button onClick={handleExportAll} disabled={exporting} className="px-4 py-2 bg-sky-500 text-white rounded-lg">
          {exporting ? "Exporting..." : "Download Stations CSV"}
        </button>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={rows}
        loading={loading}
        pageSize={15}
        // no built-in search there; filters are above
        actions={(row) => (
          <button onClick={() => openEditRoute(row.StationId ?? row.id)} className="px-3 py-1 rounded-md bg-amber-400 text-black">
            Edit
          </button>
        )}
      />
      {error && <div className="text-red-600 mt-3">{error}</div>}
    </div>
  );
}
