// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string }; children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  const headerCode = restro?.RestroCode ?? params.code;
  const headerName = restro?.RestroName ?? restro?.name ?? "";
  const stationText = restro?.StationName
    ? `${restro.StationName} (${restro.StationCode ?? ""})${restro.State ? ` - ${restro.State}` : ""}`
    : "";

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
            <div style={{ fontSize: 13, color: "#0b7285", marginTop: 4, fontWeight: 500 }}>
              {stationText}
            </div>
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

        {/* NORMALIZER: wrapper that enforces consistent padding and widths
            It also removes conflicting top-level padding from child tab components
            by applying a direct-child rule (.raileats-tab-container > *). */}
        <div className="raileats-tab-container" style={{ padding: 18 }}>
          {/* children (tab pages) */}
          {children}
        </div>

        {/* Layout-level styles to normalize children (inline to keep one-file patch) */}
        <style jsx>{`
          .raileats-tab-container {
            box-sizing: border-box;
          }

          /* If child components already have outer padding, remove duplicates
             by forcing the first direct child to have zero outer padding so
             grid centering is consistent. This normalizes BasicInfoClient,
             StationSettingsClient, AddressDocsClient etc. */
          .raileats-tab-container > * {
            /* If a tab component uses an inline wrapper with padding, this
               removes that padding so the layout's padding is the single source */
            padding: 0 !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }

          /* Ensure form grid inside children centers to same max-width used by BasicInfo */
          .raileats-tab-container .compact-grid {
            max-width: 1100px;
            margin: 0 auto;
            box-sizing: border-box;
          }

          /* Ensure headings inside tabs render same size and centered */
          .raileats-tab-container h3,
          .raileats-tab-container h4 {
            text-align: center;
            margin-bottom: 18px;
            font-size: 20px;
            font-weight: 600;
            color: #222;
          }

          /* Ensure actions area centers in same width */
          .raileats-tab-container .actions {
            max-width: 1100px;
            margin: 18px auto 0;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
        `}</style>
      </div>
    </div>
  );
}
