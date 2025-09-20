// components/restro-edit/AddressDocumentsTab.tsx
import React from "react";

type Props = { code?: string; addressPreview?: string };

export default function AddressDocumentsTab({ code, addressPreview }: Props) {
  return (
    <div style={{ padding: 14 }}>
      <h3 style={{ marginTop: 0 }}>Address & Documents (tab)</h3>
      <div style={{ color: "#666", marginBottom: 12 }}>
        Placeholder tab component. Restro code: <strong>{code ?? "-"}</strong>
      </div>

      <div style={{ background: "#fff", padding: 12, borderRadius: 6, border: "1px solid #eee" }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Address preview</strong>
        </div>
        <div style={{ color: "#333" }}>{addressPreview ?? "No address stored"}</div>
      </div>
    </div>
  );
}
