import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string }; children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  // Header strings
  const headerCode = restro?.RestroCode ?? params.code;
  const headerName = restro?.RestroName ?? "";
  const stationText = restro?.StationName
    ? `${restro.StationName} (${restro.StationCode ?? ""})${
        restro.State ? ` - ${restro.State}` : ""
      }`
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
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
          zIndex: 50,
        }}
      >
        {/* LEFT: Outlet Info */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {headerCode}
            {headerName ? ` / ${headerName}` : ""}
          </div>
          {stationText && (
            <div
              style={{
                fontSize: 13,
                color: "#0b7285",
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              {stationText}
            </div>
          )}
        </div>

        {/* RIGHT: Only red ✕ button */}
        <Link href="/admin/restros" style={{ textDecoration: "none" }}>
          <button
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
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: 12,
          padding: 12,
          borderBottom: "1px solid #f1f1f1",
          background: "#fafafa",
          position: "sticky",
          top: 56, // header height ~56px
          zIndex: 40,
        }}
      >
        <Link href={`/admin/restros/${params.code}/edit/basic`} style={{ padding: 8 }}>
          Basic Information
        </Link>
        <Link href={`/admin/restros/${params.code}/edit/station-settings`} style={{ padding: 8 }}>
          Station Settings
        </Link>
        <Link href={`/admin/restros/${params.code}/edit/address-docs`} style={{ padding: 8 }}>
          Address & Documents
        </Link>
        <Link href={`/admin/restros/${params.code}/edit/contacts`} style={{ padding: 8 }}>
          Contacts
        </Link>
        <Link href={`/admin/restros/${params.code}/edit/bank`} style={{ padding: 8 }}>
          Bank
        </Link>
        <Link href={`/admin/restros/${params.code}/edit/future-closed`} style={{ padding: 8 }}>
          Future Closed
        </Link>
        <Link href={`/admin/restros/${params.code}/edit/menu`} style={{ padding: 8 }}>
          Menu
        </Link>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
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

        {children}
      </div>
    </div>
  );
}
