"use client";

import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AdminTable, { Column } from "@/components/AdminTable";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Restro = { [k: string]: any; id?: string | number };

export default function RestroMasterPage(): JSX.Element {
  const router = useRouter();

  // filters
  const [restroCode, setRestroCode] = useState("");
  const [restroName, setRestroName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [stationCode, setStationCode] = useState("");
  const [stationName, setStationName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [fssaiNumber, setFssaiNumber] = useState("");

  // states
  const [results, setResults] = useState<Restro[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchRestros();
  }, []);

  async function fetchRestros(filters?: { [k: string]: any }) {
    setLoading(true);
    setError(null);
    try {
      let query: any = supabase.from("RestroMaster").select("*").limit(500);

      if (filters?.restroCode) {
        const rc = String(filters.restroCode).trim();
        if (/^\d+$/.test(rc)) {
          query = query.eq("RestroCode", Number(rc));
        } else {
          query = query.ilike("RestroName", `%${rc}%`);
        }
      }

      const ilikeIf = (col: string, v?: string) => {
        if (!v) return;
        const s = String(v).trim();
        if (s.length === 0) return;
        query = query.ilike(col, `%${s}%`);
      };

      ilikeIf("RestroName", filters?.restroName);
      ilikeIf("OwnerName", filters?.ownerName);
      ilikeIf("StationCode", filters?.stationCode);
      ilikeIf("StationName", filters?.stationName);
      ilikeIf("OwnerPhone", filters?.ownerPhone);
      ilikeIf("FSSAINumber", filters?.fssaiNumber ?? filters?.fssainumber);

      const { data, error: e } = await query;
      if (e) throw e;
      const normalized = (data ?? []).map((r: any, idx: number) => ({
        id: r.RestroCode ?? r.RestroId ?? idx,
        ...r,
      }));
      setResults(normalized as Restro[]);
    } catch (err: any) {
      console.error("fetchRestros error:", err);
      setError(err?.message ?? String(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function onSearchForm(e?: React.FormEvent) {
    if (e) e.preventDefault();
    fetchRestros({
      restroCode,
      restroName,
      ownerName,
      stationCode,
      stationName,
      ownerPhone,
      fssaiNumber,
    });
  }

  function onClear() {
    setRestroCode("");
    setRestroName("");
    setOwnerName("");
    setStationCode("");
    setStationName("");
    setOwnerPhone("");
    setFssaiNumber("");
    fetchRestros();
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
      setError(null);

      const { data, error } = await supabase.from("RestroMaster").select("*");
      if (error) throw error;

      const rows = data ?? [];
      if (!rows.length) {
        setError("No data found in RestroMaster table.");
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
      a.download = `restro_master_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
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
    router.push(`/admin/restros/${c}/edit`);
  }

  const columns: Column<Restro>[] = [
    { key: "RestroCode", title: "Restro Code", width: "110px" },
    { key: "RestroName", title: "Restro Name" },
    { key: "StationCode", title: "Station Code", width: "100px" },
    { key: "StationName", title: "Station Name" },
    { key: "OwnerName", title: "Owner Name" },
    { key: "OwnerPhone", title: "Owner Phone", width: "140px" },
    { key: "FSSAINumber", title: "FSSAI Number" },
    {
      key: "IRCTC",
      title: "IRCTC Status",
      render: (r) => (r.IRCTC ? "On" : "Off"),
      width: "100px",
    },
    {
      key: "Raileats",
      title: "Raileats Status",
      render: (r) => (r.Raileats ? "On" : "Off"),
      width: "110px",
    },
    { key: "FSSAIExpiryDate", title: "FSSAI Expiry Date", width: "140px" },
  ];

  return (
    <main className="mx-6 my-4 max-w-full">
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Restro Master</h2>
        </div>

        {/* Search filters */}
        <form onSubmit={onSearchForm} className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            <input placeholder="Restro Code" value={restroCode} onChange={(e) => setRestroCode(e.target.value)} className="search-pill-sm" />
            <input placeholder="Restro Name" value={restroName} onChange={(e) => setRestroName(e.target.value)} className="search-pill-sm" />
            <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="search-pill-sm" />
            <input placeholder="Station Code" value={stationCode} onChange={(e) => setStationCode(e.target.value)} className="search-pill-sm" />
            <input placeholder="Station Name" value={stationName} onChange={(e) => setStationName(e.target.value)} className="search-pill-sm" />
            <input placeholder="Owner Phone" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} maxLength={10} className="search-pill-sm" />
            <input placeholder="FSSAI Number" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} className="search-pill-sm" />
          </div>

          <div className="flex justify-end gap-3 mt-3">
            <button type="button" onClick={onClear} className="px-3 py-2 border rounded-lg bg-white">
              Clear
            </button>
            <button type="submit" className="px-4 py-2 bg-sky-500 text-white rounded-lg">
              Search
            </button>
          </div>
        </form>

        {/* error */}
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {/* Export & Add buttons (top of table) */}
        <div className="flex items-center justify-end gap-3 mb-3">
          <button onClick={handleExportAll} disabled={exporting} className="px-4 py-2 bg-sky-500 text-white rounded-lg">
            {exporting ? "Exporting..." : "Download Restro Master"}
          </button>
          <button onClick={() => alert("Add Restro not implemented")} className="px-4 py-2 bg-green-600 text-white rounded-lg">
            + Add New Restro
          </button>
        </div>

        {/* AdminTable (yellow add removed) */}
        <AdminTable
          title=""
          subtitle=""
          columns={columns}
          data={results}
          loading={loading}
          pageSize={10}
          searchPlaceholder="Search restro..."
          actions={(row) => (
            <button onClick={() => openEditRoute(row.RestroCode ?? row.RestroId)} className="px-3 py-1 rounded-md bg-amber-400 text-black">
              Edit
            </button>
          )}
        />
      </div>
    </main>
  );
}
