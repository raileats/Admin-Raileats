// components/RestroEditModal.tsx
"use client";

import React, { useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
  onSave: (updatedFields: any) => Promise<any>;
  saving?: boolean;
};

const tabs = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

export default function RestroEditModal({ restro, onClose, onSave, saving = false }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [local, setLocal] = useState<any>({ ...restro });
  const [msg, setMsg] = useState<string | null>(null);

  function updateField(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  async function handleSaveClick() {
    setMsg(null);
    // build payload of changed fields - simple approach: send subset of fields you allow
    const allowed = [
      "RestroName",
      "StationCode",
      "StationName",
      "OwnerName",
      "OwnerPhone",
      "FSSAINumber",
      "FSSAIExpiryDate",
      "IRCTC",
      "Raileats",
      // add other fields if needed
    ];
    const payload: any = {};
    for (const k of allowed) {
      if (local[k] !== undefined) payload[k] = local[k];
    }

    const res = await onSave(payload);
    if (!res.ok) {
      setMsg("Save failed: " + (res.error ?? "unknown"));
    } else {
      setMsg("Saved successfully");
    }
  }

  // small presentational inputs for Basic Information tab (you can expand)
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          width: "92%",
          maxWidth: "1700px",
          height: "92%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "1px solid #ddd",
            fontWeight: "bold",
          }}
        >
          <div>
            {local.RestroCode} / {local.RestroName} / {local.StationCode} /{" "}
            {local.StationName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a
              href={`/admin/restros/edit/${encodeURIComponent(String(local.RestroCode ?? local.RestroId))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0ea5e9", textDecoration: "underline", fontSize: 14 }}
            >
              Open Outlet Page
            </a>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 20,
                cursor: "pointer",
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #ddd", background: "#f9f9f9" }}>
          {tabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: activeTab === tab ? "3px solid #0ea5e9" : "3px solid transparent",
                fontWeight: activeTab === tab ? "bold" : "normal",
                color: activeTab === tab ? "#0ea5e9" : "#333",
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Content + Save bar */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>{activeTab}</h2>

            {activeTab === "Basic Information" && (
              <div style={{ maxWidth: 900 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label>Restro Name</label>
                    <input
                      value={local.RestroName ?? ""}
                      onChange={(e) => updateField("RestroName", e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </div>
                  <div>
                    <label>Owner Name</label>
                    <input
                      value={local.OwnerName ?? ""}
                      onChange={(e) => updateField("OwnerName", e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </div>

                  <div>
                    <label>Station Code</label>
                    <input
                      value={local.StationCode ?? ""}
                      onChange={(e) => updateField("StationCode", e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </div>

                  <div>
                    <label>Station Name</label>
                    <input
                      value={local.StationName ?? ""}
                      onChange={(e) => updateField("StationName", e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </div>

                  <div>
                    <label>Owner Phone</label>
                    <input
                      value={local.OwnerPhone ?? ""}
                      onChange={(e) => updateField("OwnerPhone", e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </div>

                  <div>
                    <label>FSSAI Number</label>
                    <input
                      value={local.FSSAINumber ?? ""}
                      onChange={(e) => updateField("FSSAINumber", e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* You can implement other tabs with forms similarly */}
            {activeTab !== "Basic Information" && (
              <p style={{ color: "#666" }}>Content for <b>{activeTab}</b> will go here.</p>
            )}
          </div>

          {/* Save bar */}
          <div style={{ borderTop: "1px solid #eee", padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              {msg && <span style={{ marginRight: 12 }}>{msg}</span>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onClose}
                style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}
              >
                Close
              </button>
              <button
                onClick={handleSaveClick}
                disabled={saving}
                style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
