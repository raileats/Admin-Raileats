"use client";

import React, { useEffect, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Restro = {
  RestroCode?: number | string;
  RestroName?: string;
  StationCode?: string;
  StationName?: string;
  OwnerName?: string;
  OwnerPhone?: string;
  IRCTC?: any;
  Raileats?: any;
  FSSAIExpiryDate?: string;
  FSSAINumber?: string;
  [k: string]: any;
};

export default function RestroMasterPage(): JSX.Element {
  const router = useRouter();

  // filter fields
  const [restroCode, setRestroCode] = useState<string>("");
  const [restroName, setRestroName] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");
  const [stationCode, setStationCode] = useState<string>("");
  const [stationName, setStationName] = useState<string>("");
  const [ownerPhone, setOwnerPhone] = useState<string>("");
  const [fssaiNumber, setFssaiNumber] = useState<string>("");

  const [results, setResults] = useState<Restro[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // export state
  const [exporting, setExporting] = useState<boolean>(false);

  useEffect(() => {
    fetchRestros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRestros(filters?: { [k: string]: any }) {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("RestroMaster").select("*").limit(500);

      if (filters?.restroCode) {
        const rc = String(filters.restroCode).trim();
        if (/^\d+$/.test(rc)) {
          query = query.eq("RestroCode", Number(rc));
        } else {
          query = (query as any).ilike("RestroName", `%${rc}%`);
        }
      }

      const ilikeIf = (col: string, v?: string) => {
        if (!v) return;
        const s = String(v).trim();
        if (s.length === 0) return;
        (query as any) = (query as any).ilike(col, `%${s}%`);
      };

      ilikeIf("RestroName", filters?.restroName);
      ilikeIf("OwnerName", filters?.ownerName);
      ilikeIf("StationCode", filters?.stationCode);
      ilikeIf("StationName", filters?.stationName);
      ilikeIf("OwnerPhone", filters?.ownerPhone);
      ilikeIf("FSSAINumber", filters?.fssaiNumber);

      const { data, error: e } = await query;
      if (e) throw e;
      setResults((data ?? []) as Restro[]);
    } catch (err: any) {
      console.error("fetchRestros error:", err);
      setError(err?.message ?? String(err));
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function onSearch(e?: React.FormEvent) {
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

  // build CSV from array of objects
  function toCSV(rows: Restro[], columns: string[], headers: string[]) {
    // CSV with BOM for excel
    const BOM = "\uFEFF";
    const escape = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      // if contains comma/quote/newline, wrap in quotes and escape quotes
      if (/[",\n\r]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const head = headers.join(",");
    const body = rows
      .map((r) =>
        columns
          .map((c) => {
            // For boolean-like fields convert 1/0 to On/Off for readability
            if (c === "IRCTC" || c === "Raileats") {
              const v = r[c];
              return escape(v === 1 || v === "1" || v === true || v === "true" ? "On" : "Off");
            }
            return escape(r[c] ?? "");
          })
          .join(",")
      )
      .join("\n");
    return BOM + head + "\n" + body;
  }

  async function handleExportAll() {
    try {
      setExporting(true);
      setError(null);
      // fetch full table without limit (if large, you may want pagination)
      const { data, error } = await supabase.from("RestroMaster").select("*");
      if (error) throw error;
      const rows = (data ?? []) as Restro[];

      // define column order and header labels
      const columns = [
        "RestroCode",
        "RestroName",
        "StationCode",
        "StationName",
        "OwnerName",
        "OwnerPhone",
        "FSSAINumber",
        "IRCTC",
        "Raileats",
        "FSSAIExpiryDate",
      ];
      const headers = [
        "RestroCode",
        "RestroName",
        "StationCode",
        "StationName",
        "OwnerName",
        "OwnerPhone",
        "FSSAINumber",
        "IRCTC",
        "Raileats",
        "FSSAIExpiryDate",
      ];

      const csv = toCSV(rows, columns, headers);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `restro_master_${ts}.csv`;
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

  return (
    <main style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Restro Master</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExportAll}
            disabled={exporting}
            style={{
              background: "#0ea5e9", // blue like search
              color: "white",
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              cursor: exporting ? "not-allowed" : "pointer",
            }}
            title="Export all RestroMaster rows as CSV"
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>

          <button
            onClick={() => router.push("/admin/restros/new")}
            style={{
              background: "#10b981",
              color: "white",
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            + Add New Restro
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form
        onSubmit={onSearch}
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        {/* First row - search fields */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 1fr 120px 1fr 160px 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <input placeholder="Restro Code" value={restroCode} onChange={(e) => setRestroCode(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Restro Name" value={restroName} onChange={(e) => setRestroName(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Station Code" value={stationCode} onChange={(e) => setStationCode(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Station Name" value={stationName} onChange={(e) => setStationName(e.target.value)} style={{ padding: 8 }} />
          <input
            placeholder="Owner Phone"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            style={{ padding: 8 }}
            maxLength={10}
          />
          <input placeholder="FSSAI Number" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} style={{ padding: 8 }} />
        </div>

        {/* Second row - buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClear} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}>
            Clear
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              background: "#0ea5e9",
              color: "#fff",
              minWidth: 90,
            }}
          >
            Search
          </button>
        </div>
      </form>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

      {/* Results Table */}
      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: 12 }}>Restro Code</th>
              <th style={{ padding: 12 }}>Restro Name</th>
              <th style={{ padding: 12 }}>Station Code</th>
              <th style={{ padding: 12 }}>Station Name</th>
              <th style={{ padding: 12 }}>Owner Name</th>
              <th style={{ padding: 12 }}>Owner Phone</th>
              <th style={{ padding: 12 }}>FSSAI Number</th>
              <th style={{ padding: 12 }}>IRCTC Status</th>
              <th style={{ padding: 12 }}>Raileats Status</th>
              <th style={{ padding: 12 }}>FSSAI Expiry Date</th>
              <th style={{ padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} style={{ padding: 20, textAlign: "center" }}>
                  Loading...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                  No restros found
                </td>
              </tr>
            ) : (
              results.map((r) => {
                const code = r.RestroCode ?? r.RestroId ?? "";
                return (
                  <tr key={String(code)} style={{ borderBottom: "1px solid #fafafa" }}>
                    <td style={{ padding: 12 }}>{code}</td>
                    <td style={{ padding: 12 }}>{r.RestroName}</td>
                    <td style={{ padding: 12 }}>{r.StationCode}</td>
                    <td style={{ padding: 12 }}>{r.StationName}</td>
                    <td style={{ padding: 12 }}>{r.OwnerName}</td>
                    <td style={{ padding: 12 }}>{r.OwnerPhone ?? "-"}</td>
                    <td style={{ padding: 12 }}>{r.FSSAINumber ?? "-"}</td>
                    <td style={{ padding: 12 }}>{r.IRCTC ? "On" : "Off"}</td>
                    <td style={{ padding: 12 }}>{r.Raileats ? "On" : "Off"}</td>
                    <td style={{ padding: 12 }}>{r.FSSAIExpiryDate ?? "-"}</td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => router.push(`/admin/restros/edit/${code}`)}
                        style={{
                          background: "#f59e0b",
                          color: "#000",
                          padding: "6px 10px",
                          borderRadius: 6,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
