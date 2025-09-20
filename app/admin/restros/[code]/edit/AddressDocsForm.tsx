// app/admin/restros/[code]/edit/AddressDocsForm.tsx
"use client";

import React, { useState } from "react";

type Props = { params?: { code?: string } };

export default function AddressDocsForm(props: Props) {
  // placeholder local state (replace later with real data + save)
  const [address, setAddress] = useState("");
  const code = (props as any)?.params?.code ?? "";

  return (
    <div style={{ padding: 8 }}>
      <h3 style={{ textAlign: "center", marginBottom: 12 }}>Address & Documents</h3>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Restro code</label>
          <input value={code} readOnly style={{ width: "100%", padding: 8, borderRadius: 6 }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Restro address (will be saved to RestroMaster.Address... )"
            style={{ width: "100%", minHeight: 120, padding: 8, borderRadius: 6 }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <button
            type="button"
            onClick={() => { setAddress(""); }}
            style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => alert("Save not implemented yet - implement API route and call it here.")}
            style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#06a3d9", color: "#fff" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
