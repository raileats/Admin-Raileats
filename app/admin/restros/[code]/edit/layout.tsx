// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";
import { createClient } from "@supabase/supabase-js";

type Props = { params: { code: string }; children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  // --- fetch states (server-side) ---
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  let states: Array<{ id: string; name: string }> = [];
  let initialDistricts: Array<{ id: string; name: string; state_id?: string }> = [];

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

      const { data: stateData, error: stateErr } = await sb.from("StateMaster").select("StateCode,StateName").order("StateName", { ascending: true });
      if (!stateErr && Array.isArray(stateData)) {
        states = stateData.map((r: any) => ({ id: String(r.StateCode), name: r.StateName }));
      } else {
        console.error("Error fetching StateMaster:", stateErr);
      }

      // if restro has a StateCode, fetch districts for that state (so initialDistricts available immediately)
      const restroStateCode = restro?.StateCode ?? restro?.State ?? "";
      if (restroStateCode) {
        const { data: distData, error: distErr } = await sb
          .from("DistrictMaster")
          .select("DistrictCode,DistrictName,StateCode")
          .eq("StateCode", restroStateCode)
          .order("DistrictName", { ascending: true });

        if (!distErr && Array.isArray(distData)) {
          initialDistricts = distData.map((d: any) => ({ id: String(d.DistrictCode), name: d.DistrictName, state_id: String(d.StateCode) }));
        } else {
          console.error("Error fetching DistrictMaster for state", restroStateCode, distErr);
        }
      }
    } catch (e) {
      console.error("Supabase fetch error in layout:", e);
    }
  } else {
    console.warn("Supabase env not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }

  // Header text
  const headerCode = restro?.RestroCode ?? params.code;
  const headerName = restro?.RestroName ?? restro?.name ?? "";
  const stationText = restro?.StationName
    ? `${restro.StationName} (${restro.StationCode ?? ""})${restro.State ? ` - ${restro.State}` : ""}`
    : "";

  // If children is a single React element, clone it and inject props:
  const childrenWithProps = React.isValidElement(children)
    ? React.cloneElement(children, {
        // pass restro and lists so client can use them immediately
        initialData: restro ?? null,
        states,
        initialDistricts,
      })
    : children;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Top sticky header */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 60,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {headerCode}
            {headerName ? ` / ${headerName}` : ""}
          </div>
          {stationText && (
            <div style={{ fontSize: 13, color: "#0b7285", marginTop: 4, fontWeight: 500 }}>{stationText}</div>
          )}
        </div>

        <Link href="/admin/restros" style={{ textDecoration: "none" }}>
          <button
            aria-label="Close"
            title="Close"
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: 6,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </Link>
      </div>

      {/* Tabs nav (sticky under header) */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: "10px 16px",
          borderBottom: "1px solid #f1f1f1",
          background: "#fafafa",
          position: "sticky",
          top: 76,
          zIndex: 50,
        }}
      >
        <nav className="tabs-nav" style={{ borderBottom: "1px solid #eee", marginBottom: 10 }}>
          <Link href="./basic">Basic Information</Link>
          <Link href="./station-settings">Station Settings</Link>
          <Link href="./address-docs">Address & Documents</Link>
          <Link href="./contacts">Contacts</Link>
          <Link href="./bank">Bank</Link>
          <Link href="./future-closed">Future Closed</Link>
          <Link href="./menu">Menu</Link>
        </nav>
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, overflow: "auto", padding: 0 }}>
        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: 8, color: "#666" }}>
              (Tip: check supabase table "RestroMaster" for RestroCode {params.code})
            </div>
          </div>
        )}

        {!error && !restro && (
          <div style={{ color: "#333", padding: 12 }}>
            <div style={{ color: "red", marginBottom: 8 }}>Error: Not found</div>
            <div>Restro not found</div>
          </div>
        )}

        {/* NORMALIZER: wrapper that enforces consistent padding and widths */}
        <div className="raileats-tab-container" style={{ padding: 18 }}>
          {childrenWithProps}
        </div>
      </div>
    </div>
  );
}
