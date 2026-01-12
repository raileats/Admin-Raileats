"use client";

import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AdminTable, { Column } from "@/components/AdminTable";
import RestroEditModal from "@/components/RestroEditModal"; // 🔥 ADD THIS

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Restro = { [k: string]: any; id?: string | number };

export default function RestroMasterPage(): JSX.Element {
  const router = useRouter();

  // 🔥 ADD NEW RESTRO MODAL STATE
  const [openAddRestro, setOpenAddRestro] = useState(false);

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
      ilikeIf("FSSAINumber", filters?.fssaiNumber);

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
      const csv =
        "\uFEFF" +
        headers.join(",") +
        "\n" +
        rows
          .map((r: any) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))
          .join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `restro_master_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.message ?? "Export failed");
    } finally {
      setExporting(false);
    }
  }

  function openEditRoute(code: string | number) {
    router.push(`/admin/restros/${encodeURIComponent(String(code))}/edit`);
  }

  const columns: Column<Restro>[] = [
    { key: "RestroCode", title: "Restro Code", width: "110px" },
    { key: "RestroName", title: "Restro Name" },
    { key: "StationCode", title: "Station Code", width: "100px" },
    { key: "StationName", title: "Station Name" },
    { key: "OwnerName", title: "Owner Name" },
    { key: "OwnerPhone", title: "Owner Phone", width: "140px" },
    { key: "FSSAINumber", title: "FSSAI Number" },
  ];

  return (
    <main className="mx-6 my-4 max-w-full">
      <h2 className="text-xl font-semibold mb-6">Restro Master</h2>

      {/* ACTION BUTTONS */}
      <div className="flex justify-end gap-3 mb-3">
        <button
          onClick={handleExportAll}
          disabled={exporting}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg"
        >
          {exporting ? "Exporting..." : "Download Restro Master"}
        </button>

        <button
          onClick={() => setOpenAddRestro(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          + Add New Restro
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <AdminTable
        title=""
        subtitle=""
        columns={columns}
        data={results}
        loading={loading}
        pageSize={10}
        actions={(row) => (
          <button
            onClick={() => openEditRoute(row.RestroCode)}
            className="px-3 py-1 rounded-md bg-amber-400 text-black"
          >
            Edit
          </button>
        )}
      />

      {/* 🔥 ADD NEW RESTRO MODAL */}
      {openAddRestro && (
        <RestroEditModal
          restro={null}                    // ⭐ NEW MODE
          initialTab="Basic Information"
          onClose={() => setOpenAddRestro(false)}
        />
      )}
    </main>
  );
}
