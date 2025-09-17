// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import { getRestroById, Restro } from "@/lib/restroService";

type Props = { params: { code: string }, children: React.ReactNode };

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);

  // सही type दें: Restro | null
  let restro: Restro | null = null;

  try {
    restro = await getRestroById(codeNum);
  } catch (err) {
    console.error("layout getRestroById error:", err);
  }

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
            {restro?.restro_code ?? params.code} /{" "}
            {restro?.restro_name ?? "Restro"}
            <div style={{ fontSize: 13, color: "#666" }}>
              {restro?.station_code
                ? `(${restro.station_code}) ${restro.station_name ?? ""}`
                : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/admin/restros">
              <button style={{ padding: "8px 12px" }}>Close</button>
            </Link>
            <a
              href={`/admin/restros/${params.code}/edit/basic`}
              style={{ textDecoration: "none" }}
            >
              <button style={{ padding: "8px 12px" }}>
                Open Outlet Page
              </button>
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
