// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string }; children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  // Friendly header text
  const headerCode = restro?.RestroCode ?? params.code;
  const headerName = restro?.RestroName ?? restro?.name ?? "";
  const stationText = restro?.StationName
    ? `${restro.StationName} (${restro.StationCode ?? ""})${
        restro.State ? ` - ${restro.State}` : ""
      }`
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
        {/* Left: Restro info */}
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

        {/* Right: single red X close button */}
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
          top: 76, // leaves space for header height
          zIndex: 50,
        }}
      >
        {/* tabs nav */}
        <nav
          className="tabs-nav"
          style={{ borderBottom: "1px solid #eee", marginBottom: 10 }}
        >
          <Link href="./basic">Basic Information</Link>{" | "}
          <Link href="./station-settings">Station Settings</Link>{" | "}
          <Link href="./address-docs">Address & Documents</Link>{" | "}
          <Link href="./contacts">Contacts</Link>{" | "}
          <Link href="./bank">Bank</Link>{" | "}
          <Link href="./future-closed">Future Closed</Link>{" | "}
          <Link href="./menu">Menu</Link>
        </nav>
      </div> {/* ✅ अब ये div properly बंद है */}

      {/* Main content area */}
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {/* Show server error if any */}
        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: 8, color: "#666" }}>
              (Tip: check supabase table "RestroMaster" for RestroCode {params.code})
            </div>
          </div>
        )}

        {/* Not found */}
        {!error && !restro && (
          <div style={{ color: "#333", padding: 12 }}>
            <div style={{ color: "red", marginBottom: 8 }}>Error: Not found</div>
            <div>Restro not found</div>
          </div>
        )}

        {/* Children (tab pages) */}
        {children}
      </div>
    </div>
  );
}
