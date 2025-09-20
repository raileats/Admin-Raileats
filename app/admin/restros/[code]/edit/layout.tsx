// app/admin/restros/[code]/edit/basic/page.tsx
import React from "react";
import Link from "next/link";
import { safeGetRestro } from "@/lib/restroService";
import BasicInfoClient from "@/components/tabs/BasicInfoClient"; // adjust path if different

type Props = {
  params: { code: string };
};

// Server-side page that wraps BasicInfoClient in a modal-style card (centered)
export default async function BasicEditPage({ params }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  // If you want to show a server error instead of modal:
  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h3 style={{ color: "red" }}>Error loading outlet</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{String(error)}</pre>
        <div style={{ marginTop: 12 }}>
          <Link href="/admin/restros">Back to list</Link>
        </div>
      </div>
    );
  }

  // If not found, show message
  if (!restro) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Outlet not found</h3>
        <div>
          <Link href="/admin/restros">Back to list</Link>
        </div>
      </div>
    );
  }

  // Modal-like wrapper: replicate the same look that Station Settings popup has
  return (
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: 20,
        zIndex: 1100,
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
        {/* Header (fixed within card) */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {String(restro?.RestroCode ?? params.code)}
            {restro?.RestroName ? " / " : ""}
            {restro?.RestroName ?? ""}
            <div style={{ fontSize: 13, color: "#0b7285", marginTop: 4 }}>
              {restro?.StationName ? `${restro.StationName} (${restro.StationCode ?? ""})${restro.State ? ` - ${restro.State}` : ""}` : "—"}
            </div>
          </div>

          {/* Red ✕ close button (closes to list). Keep consistent with other modal. */}
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
                padding: 8,
                borderRadius: 6,
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </Link>
        </div>

        {/* Tabs row */}
        <div style={{ display: "flex", gap: 6, padding: "10px 16px", borderBottom: "1px solid #f1f1f1", background: "#fafafa" }}>
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

        {/* Content area where BasicInfoClient is rendered */}
        <div style={{ padding: 20, flex: 1, overflow: "auto" }}>
          {/* BasicInfoClient should be a client component that accepts initialData and optionally onSave */}
          {/* It will render the form fields; we pass restro as initialData */}
          {/* If your BasicInfoClient exports a different prop name, adjust accordingly */}
          <BasicInfoClient initialData={restro} />
        </div>

        {/* Footer with Cancel (left) and Save (right) */}
        <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 8, background: "#fff" }}>
          <div>
            <Link href="/admin/restros" style={{ textDecoration: "none" }}>
              <button style={{ background: "#fff", color: "#333", border: "1px solid #e3e3e3", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}>
                Cancel
              </button>
            </Link>
          </div>

          <div>
            {/* Save button: If BasicInfoClient exposes a programmatic save via ref or prop, you can wire it.
                Otherwise the BasicInfoClient should render its own Save. This Save is provided for consistency.
                If BasicInfoClient already renders Save, you can remove this button. */}
            <button
              onClick={() => {
                // optional: if BasicInfoClient exposes a window-level save handler, call it
                // Example: (window as any).basicInfoSave && (window as any).basicInfoSave()
                // Otherwise user can use the Save inside the BasicInfoClient form.
                console.log("Save clicked — BasicInfoClient should handle saving internally.");
              }}
              style={{
                background: "#0ea5e9",
                color: "#fff",
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
