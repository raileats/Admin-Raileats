// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string }; children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  // friendly header strings (safe)
  const headerCode = restro?.RestroCode ?? params.code;
  const headerName = restro?.RestroName ?? "Restro";
  const stationText =
    restro?.StationCode ? `(${restro.StationCode}) ${restro?.StationName ?? ""}` : "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 20,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "95%",
          maxWidth: 1400,
          height: "95%",
          background: "#fff",
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {headerCode} / {headerName}
            <div style={{ fontSize: 13, color: "#666" }}>{stationText}</div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin/restros">
              <button style={{ padding: "8px 12px" }}>Close</button>
            </Link>

            {/* Open Outlet Page - keeps same behaviour */}
            <a
              href={`/admin/restros/${params.code}/edit/basic`}
              style={{ textDecoration: "none" }}
              target="_blank"
              rel="noreferrer"
            >
              <button style={{ padding: "8px 12px" }}>Open Outlet Page</button>
            </a>
          </div>
        </div>

        {/* Tabs nav */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: 12,
            borderBottom: "1px solid #f1f1f1",
            background: "#fafafa",
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
          {/* Show server error if any */}
          {error && (
            <div style={{ color: "red", marginBottom: 12 }}>
              <strong>Error:</strong> {error}
              <div style={{ marginTop: 8, color: "#666" }}>
                (Tip: check supabase table "RestroMaster" for RestroCode {params.code})
              </div>
            </div>
          )}

          {/* If restro missing (not found) show message but keep header/nav visible */}
          {!error && !restro && (
            <div style={{ color: "#333", padding: 12 }}>
              <div style={{ color: "red", marginBottom: 8 }}>Error: Not found</div>
              <div>Restro not found</div>
            </div>
          )}

          {/* Render children (tab pages). Child pages can still fetch again if needed */}
          {children}
        </div>
      </div>
    </div>
  );
}
