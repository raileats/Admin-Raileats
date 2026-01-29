// path: app/admin/restros/[code]/edit/layout.tsx
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
    ? `${restro.StationName} (${restro.StationCode ?? ""})${
        restro.State ? ` - ${restro.State}` : ""
      }`
    : "";

  return (
    <div
      className="restro-edit-wrapper"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* ================= TOP HEADER ================= */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          background: "#ffffff",
          zIndex: 60,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {headerCode}
            {headerName ? ` / ${headerName}` : ""}
          </div>

          {stationText && (
            <div
              style={{
                fontSize: 13,
                color: "#0b7285",
                marginTop: 4,
                fontWeight: 500,
              }}
            >
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
              padding: "6px 12px",
              borderRadius: 8,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </Link>
      </div>

      {/* ================= TABS ================= */}
      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc",
          position: "sticky",
          top: 64,
          zIndex: 50,
        }}
      >
        <nav className="tabs-nav">
          <Link href="./basic">Basic Information</Link>
          <Link href="./station-settings">Station Settings</Link>
          <Link href="./address-docs">Address & Documents</Link>
          <Link href="./contacts">Contacts</Link>
          <Link href="./bank">Bank</Link>
          <Link href="./future-closed">Future Closed</Link>
          <Link href="./menu">Menu</Link>
        </nav>
      </div>

      {/* ================= CONTENT ================= */}
      <div
        className="restro-edit-content"
        style={{
          flex: 1,
          overflow: "auto",
          padding: "24px 16px",
        }}
      >
        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: 8, color: "#666" }}>
              (Tip: check supabase table "RestroMaster" for RestroCode{" "}
              {params.code})
            </div>
          </div>
        )}

        {!error && !restro && (
          <div style={{ color: "#333", padding: 12 }}>
            <div style={{ color: "red", marginBottom: 8 }}>
              Error: Not found
            </div>
            <div>Restro not found</div>
          </div>
        )}

        {/* 🔥 UNIVERSAL CARD WRAPPER (MAGIC) */}
        <div className="restro-edit-card">{children}</div>
      </div>
    </div>
  );
}
