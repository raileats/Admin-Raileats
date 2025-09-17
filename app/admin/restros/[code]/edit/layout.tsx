// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";

type Props = { params: { code: string }; children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

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
            {restro?.RestroCode ?? params.code} / {restro?.RestroName ?? "Restro"}
            <div style={{ fontSize: 13, color: "#666" }}>
              {restro?.StationCode ? `(${restro.StationCode}) ${restro.StationName ?? ""}` : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin/restros">
              <button style={{ padding: "8px 12px" }}>Close</button>
            </Link>
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

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {error && <div style={{ color: "red" }}>Error: {error}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}
