// app/admin/restros/page.tsx
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
  const [ownerName, setOwnerName] = useState<string>("");
  const [stationCode, setStationCode] = useState<string>("");
  const [stationName, setStationName] = useState<string>("");
  const [restroName, setRestroName] = useState<string>("");
  const [ownerPhone, setOwnerPhone] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("any");

  const [results, setResults] = useState<Restro[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingCode, setUpdatingCode] = useState<number | string | null>(null);

  useEffect(() => {
    fetchRestros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const truthy = (v: any) => v === true || v === 1 || v === "1" || v === "true" || v === "yes";

  async function fetchRestros(filters?: { [k: string]: any }) {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from("RestroMaster").select("*").limit(500);

      if (filters?.restroCode) {
        const rc = String(filters.restroCode).trim();
        if (/^\d+$/.test(rc)) {
          // numeric exact match
          query = query.eq("RestroCode", Number(rc));
        } else {
          // fallback: search by name if non-numeric input
          query = (query as any).ilike("RestroName", `%${rc}%`);
        }
      }

      const ilikeIf = (col: string, v?: string) => {
        if (!v) return;
        const s = String(v).trim();
        if (s.length === 0) return;
        (query as any) = (query as any).ilike(col, `%${s}%`);
      };

      ilikeIf("OwnerName", filters?.ownerName);
      ilikeIf("StationCode", filters?.stationCode);
      ilikeIf("StationName", filters?.stationName);
      ilikeIf("RestroName", filters?.restroName);
      ilikeIf("OwnerPhone", filters?.ownerPhone);
      ilikeIf("FSSAINumber", filters?.fssaiNumber || filters?.FSSAINumber);

      if (filters?.statusFilter && filters.statusFilter !== "any") {
        if (filters.statusFilter === "yes") query = query.eq("Raileats", 1);
        else if (filters.statusFilter === "no") query = query.eq("Raileats", 0);
      }

      const { data, error: e } = await query;
      if (e) throw e;
      setResults((data ?? []) as Restro[]);
    } catch (err: any) {
      console.error("fetchRestros error:", err);
      if (String(err.message || err).includes("bigint ~~*")) {
        setError("Restro Code search must be numeric. Use exact code or search by name.");
      } else {
        setError(err?.message ?? String(err));
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function onSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    fetchRestros({
      restroCode,
      ownerName,
      stationCode,
      stationName,
      restroName,
      ownerPhone,
      statusFilter,
    });
  }

  function onClear() {
    setRestroCode("");
    setOwnerName("");
    setStationCode("");
    setStationName("");
    setRestroName("");
    setOwnerPhone("");
    setStatusFilter("any");
    fetchRestros();
  }

  // Generic numeric-column toggle with optimistic UI + verification + rollback
  async function toggleColumnNumeric(code: number | string, colName: string, currentValue: any) {
    const newVal = truthy(currentValue) ? 0 : 1;
    setUpdatingCode(code);

    // optimistic UI
    setResults((prev) => prev.map((r) => (String(r.RestroCode) === String(code) ? { ...r, [colName]: newVal } : r)));

    try {
      // send update and request updated row back
      const { data, error } = await supabase
        .from("RestroMaster")
        .update({ [colName]: newVal })
        .eq("RestroCode", Number(code)) // if RestroCode is text in your DB, remove Number(...)
        .select()
        .maybeSingle();

      if (error) {
        console.error(`Update ${colName} failed:`, error);
        throw error;
      }

      // patch canonical server row if returned
      if (data) {
        setResults((prev) => prev.map((r) => (String(r.RestroCode) === String(code) ? { ...r, ...data } : r)));
      }
    } catch (err: any) {
      console.error("toggleColumnNumeric error:", err);
      setError("Could not update status. Reloading list.");
      // rollback by reloading full list (no filter)
      await fetchRestros();
    } finally {
      setUpdatingCode(null);
    }
  }

  // wrappers
  async function toggleIrctc(code: number | string, current: any) {
    return toggleColumnNumeric(code, "IRCTC", current);
  }
  async function toggleRaileats(code: number | string, current: any) {
    return toggleColumnNumeric(code, "Raileats", current);
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 style={{ margin: 0 }}>Restro Master</h1>
        <div>
          <button
            onClick={() => router.push("/admin/restros/new")}
            style={{
              background: "#10b981",
              color: "white",
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            + Add New Restro
          </button>
        </div>
      </div>

      <form
        onSubmit={onSearch}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr) auto",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          background: "#fff",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <input placeholder="Restro Code" value={restroCode} onChange={(e) => setRestroCode(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Owner Name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Station Code" value={stationCode} onChange={(e) => setStationCode(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Station Name" value={stationName} onChange={(e) => setStationName(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Restro Name" value={restroName} onChange={(e) => setRestroName(e.target.value)} style={{ padding: 8 }} />
        <input placeholder="Owner Phone" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} style={{ padding: 8 }} />

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: 8 }}>
          <option value="any">Status</option>
          <option value="yes">On</option>
          <option value="no">Off</option>
        </select>

        <div style={{ gridColumn: "span 5 / auto", display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
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

      <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: 12 }}>Restro Code</th>
              <th style={{ padding: 12 }}>Restro Name</th>
              <th style={{ padding: 12 }}>Station Code</th>
              <th style={{ padding: 12 }}>Station Name</th>
              <th style={{ padding: 12 }}>Owner Name</th>
              <th style={{ padding: 12 }}>IRCTC Status</th>
              <th style={{ padding: 12 }}>Raileats Status</th>
              <th style={{ padding: 12 }}>FSSAI Expiry Date</th>
              <th style={{ padding: 12 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: 20, textAlign: "center" }}>
                  Loading...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 20, textAlign: "center", color: "#666" }}>
                  No restros found
                </td>
              </tr>
            ) : (
              results.map((r) => {
                const code = r.RestroCode ?? r.RestroId ?? "";
                const isIrctc = truthy(r.IRCTC);
                const isRaileats = truthy(r.Raileats);
                return (
                  <tr key={String(code)} style={{ borderBottom: "1px solid #fafafa" }}>
                    <td style={{ padding: 12 }}>{code}</td>
                    <td style={{ padding: 12 }}>{r.RestroName}</td>
                    <td style={{ padding: 12 }}>{r.StationCode}</td>
                    <td style={{ padding: 12 }}>{r.StationName}</td>
                    <td style={{ padding: 12 }}>{r.OwnerName}</td>

                    {/* IRCTC toggle */}
                    <td style={{ padding: 12 }}>
                      <label style={{ display: "inline-block", position: "relative" }}>
                        <input
                          type="checkbox"
                          checked={isIrctc}
                          onChange={() => toggleIrctc(code, r.IRCTC)}
                          disabled={updatingCode === code}
                          style={{ width: 0, height: 0, opacity: 0 }}
                        />
                        <span
                          style={{
                            display: "inline-block",
                            width: 44,
                            height: 24,
                            background: isIrctc ? "#10b981" : "#ddd",
                            borderRadius: 999,
                            position: "relative",
                            transition: "background .15s",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              left: isIrctc ? 22 : 2,
                              width: 20,
                              height: 20,
                              background: "#fff",
                              borderRadius: 999,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              transition: "left .15s",
                            }}
                          />
                        </span>
                      </label>
                    </td>

                    {/* Raileats toggle */}
                    <td style={{ padding: 12 }}>
                      <label style={{ display: "inline-block", position: "relative" }}>
                        <input
                          type="checkbox"
                          checked={isRaileats}
                          onChange={() => toggleRaileats(code, r.Raileats)}
                          disabled={updatingCode === code}
                          style={{ width: 0, height: 0, opacity: 0 }}
                        />
                        <span
                          style={{
                            display: "inline-block",
                            width: 44,
                            height: 24,
                            background: isRaileats ? "#10b981" : "#ddd",
                            borderRadius: 999,
                            position: "relative",
                            transition: "background .15s",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: 2,
                              left: isRaileats ? 22 : 2,
                              width: 20,
                              height: 20,
                              background: "#fff",
                              borderRadius: 999,
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              transition: "left .15s",
                            }}
                          />
                        </span>
                      </label>
                    </td>

                    <td style={{ padding: 12 }}>{r.FSSAIExpiryDate ?? "-"}</td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => router.push(`/admin/restros/edit/${code}`)}
                        style={{ background: "#f59e0b", color: "#000", padding: "6px 10px", borderRadius: 6, border: "none", cursor: "pointer" }}
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
