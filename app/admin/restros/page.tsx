// app/admin/restros/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import RestroEditModal from "@/components/RestroEditModal"; // adjust path if needed

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Restro = { [k: string]: any };
type SaveResult = { ok: boolean; row?: any; error?: any };

export default function RestroMasterPage(): JSX.Element {
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

  // modal state
  const [editingRestro, setEditingRestro] = useState<Restro | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchRestros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      a.download = `restro_master_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
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

  // open modal with restro object (fast)
  function openEditModalWith(restro: Restro) {
    setEditingRestro(restro);
    setModalOpen(true);
  }

  // optional: open modal only with code (modal will fetch if missing details)
  function openEditModalByCode(code: string | number) {
    setEditingRestro({ RestroCode: code });
    setModalOpen(true);
  }

  // update list row after successful save
  function updateRowInState(code: string | number, updated: any) {
    setResults((s) =>
      s.map((r) => {
        const rcode = r.RestroCode ?? r.RestroId ?? "";
        if (String(rcode) === String(code)) {
          return { ...r, ...updated };
        }
        return r;
      })
    );
  }

  // modal onSave wrapper (calls API and updates list)
  async function handleModalSave(payload: any): Promise<SaveResult> {
    try {
      const code = editingRestro?.RestroCode ?? editingRestro?.restro_code;
      if (!code) throw new Error("Missing restro code for save");

      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Save failed (${res.status})`);
      }
      const json = await res.json().catch(() => null);
      const updatedRow = json?.row ?? payload ?? {};
      // update local list so changes reflect immediately
      updateRowInState(code, updatedRow);
      return { ok: true, row: updatedRow };
    } catch (err: any) {
      console.error("modal save error:", err);
      return { ok: false, error: err?.message ?? String(err) };
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
            style={{ background: "#0ea5e9", color: "white", padding: "8px 12px", borderRadius: 6, border: "none", cursor: exporting ? "not-allowed" : "pointer" }}
            title="Download Restro Master CSV"
          >
            {exporting ? "Exporting..." : "Download Restro Master"}
          </button>

          <button
            onClick={() => alert("New Restro route not implemented")}
            style={{ background: "#10b981", color: "white", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" }}
          >
            + Add New Restro
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={onSearch} style={{ background: "#fff", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 120px 1fr 160px 1fr", gap: 12, marginBottom: 12 }}>
          <input placeholder="Restro Code" value={restroCode} onChange={(e) => setRestroCode(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Restro Name" value={restroName} onChange={(e) => setRestroName(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Station Code" value={stationCode} onChange={(e) => setStationCode(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Station Name" value={stationName} onChange={(e) => setStationName(e.target.value)} style={{ padding: 8 }} />
          <input placeholder="Owner Phone" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} style={{ padding: 8 }} maxLength={10} />
          <input placeholder="FSSAI Number" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} style={{ padding: 8 }} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClear} style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}>
            Clear
          </button>
          <button type="submit" style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff", minWidth: 90 }}>
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
                    <td style={{ padding: 12, display: "flex", gap: 8 }}>
                      {/* Quick edit via modal (recommended) */}
                      <button
                        onClick={() => openEditModalWith(r)}
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

                      {/* Keep direct route available (optional) */}
                      <Link href={`/admin/restros/${encodeURIComponent(String(code))}/edit/basic`}>
                        <a style={{ textDecoration: "none" }}>
                          <button
                            style={{
                              background: "#efefef",
                              color: "#111",
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid #ddd",
                              cursor: "pointer",
                            }}
                          >
                            Open Page
                          </button>
                        </a>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal - rendered when modalOpen true */}
      {modalOpen && editingRestro && (
        <RestroEditModal
          restro={editingRestro}
          initialTab="Basic Information"
          onClose={() => {
            setModalOpen(false);
            setEditingRestro(null);
          }}
          onSave={async (payload) => {
            const res = await handleModalSave(payload);
            if (res.ok) {
              // close modal after successful save
              setModalOpen(false);
              setEditingRestro(null);
            }
            return res;
          }}
        />
      )}
    </main>
  );
}
