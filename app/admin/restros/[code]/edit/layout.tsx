// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";
import { createClient } from "@supabase/supabase-js";

type Props = { params: { code: string }; children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  // --- fetch states (server-side) and initialDistricts for restro state ---
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
      } else if (stateErr) {
        console.error("Error fetching StateMaster:", stateErr);
      }

      // determine restro state code (prefer StateCode, else try State text)
      const restroState = restro?.StateCode ?? restro?.State ?? "";

      if (restroState) {
        // try by StateCode first
        const { data: distData, error: distErr } = await sb
          .from("DistrictMaster")
          .select("DistrictCode,DistrictName,StateCode")
          .eq("StateCode", restroState)
          .order("DistrictName", { ascending: true });

        if (!distErr && Array.isArray(distData) && distData.length > 0) {
          initialDistricts = distData.map((d: any) => ({ id: String(d.DistrictCode), name: d.DistrictName, state_id: String(d.StateCode) }));
        } else {
          // fallback: maybe restro.State contains name -> lookup state by name then get districts
          const name = String(restro?.State ?? "").trim();
          if (name) {
            const { data: possibleStates } = await sb.from("StateMaster").select("StateCode").ilike("StateName", `%${name}%`);
            if (Array.isArray(possibleStates) && possibleStates.length > 0) {
              const codes = possibleStates.map((s: any) => s.StateCode);
              const { data: dist2 } = await sb
                .from("DistrictMaster")
                .select("DistrictCode,DistrictName,StateCode")
                .in("StateCode", codes)
                .order("DistrictName", { ascending: true });
              if (Array.isArray(dist2)) initialDistricts = dist2.map((d: any) => ({ id: String(d.DistrictCode), name: d.DistrictName, state_id: String(d.StateCode) }));
            }
          }
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

  // inject props into child component (Address & Documents page expects initialData, states, initialDistricts)
  let childrenWithProps: React.ReactNode = children;
  if (React.isValidElement(children)) {
    childrenWithProps = React.cloneElement(children as React.ReactElement<any>, {
      initialData: restro ?? null,
      states,
      initialDistricts,
    } as any);
  }

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

        <div className="raileats-tab-container" style={{ padding: 18 }}>
          {childrenWithProps}
        </div>
      </div>
    </div>
  );
}
