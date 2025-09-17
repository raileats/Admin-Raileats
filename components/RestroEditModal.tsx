"use client";

import React, { useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
  onSave?: (updated: any) => void; // optional callback parent can provide
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

export default function RestroEditModal({ restro, onClose, onSave }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local editable state (initialize from restro)
  const [RestroName, setRestroName] = useState(restro?.RestroName ?? "");
  const [StationCode, setStationCode] = useState(restro?.StationCode ?? "");
  const [StationName, setStationName] = useState(restro?.StationName ?? "");
  const [OwnerName, setOwnerName] = useState(restro?.OwnerName ?? "");
  const [OwnerPhone, setOwnerPhone] = useState(restro?.OwnerPhone ?? "");
  const [FSSAINumber, setFSSAINumber] = useState(restro?.FSSAINumber ?? "");
  const [FSSAIExpiryDate, setFSSAIExpiryDate] = useState(restro?.FSSAIExpiryDate ?? "");
  // boolean-like fields stored as 1/0 in db
  const toBool = (v: any) => v === 1 || v === "1" || v === true || v === "true";
  const [IRCTC, setIRCTC] = useState<boolean>(toBool(restro?.IRCTC));
  const [Raileats, setRaileats] = useState<boolean>(toBool(restro?.Raileats));
  const [IsIrctcApproved, setIsIrctcApproved] = useState<boolean>(toBool(restro?.IsIrctcApproved));

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload: any = {
        RestroName,
        StationCode,
        StationName,
        OwnerName,
        OwnerPhone,
        FSSAINumber,
        FSSAIExpiryDate,
        // send 1/0 for boolean flags
        IRCTC: IRCTC ? 1 : 0,
        Raileats: Raileats ? 1 : 0,
        IsIrctcApproved: IsIrctcApproved ? 1 : 0,
      };

      // call server PATCH endpoint which expects 'code' param (RestroCode)
      const code = restro?.RestroCode ?? restro?.code ?? restro?.RestroId;
      if (!code) throw new Error("Missing RestroCode for update");

      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Update failed (${res.status})`);
      }

      const json = await res.json().catch(() => null);
      // server may return updated row as json or wrapper — try to extract
      const updatedRow = (json && (json.row || json.data || json)) ?? null;

      // Call parent's onSave if present so parent can update UI
      if (onSave) onSave(updatedRow ?? { ...restro, ...payload });

      // close modal
      onClose();
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  }

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
        zIndex: 1100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          width: "92%",
          height: "92%",
          maxWidth: "1700px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px",
            borderBottom: "1px solid #e9e9e9",
          }}
        >
          <div style={{ fontWeight: 600 }}>
            {restro?.RestroCode} / {restro?.RestroName} / {restro?.StationCode} / {restro?.StationName}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a
              href={`/admin/restros/edit/${encodeURIComponent(String(restro?.RestroCode ?? ""))}`}
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
                padding: 6,
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #eee", background: "#fafafa" }}>
          {tabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: activeTab === tab ? "3px solid #0ea5e9" : "3px solid transparent",
                fontWeight: activeTab === tab ? 600 : 500,
                color: activeTab === tab ? "#0ea5e9" : "#333",
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Toolbar (Save) */}
        <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {error && <div style={{ color: "red", marginRight: "auto" }}>{error}</div>}
          <button
            onClick={onClose}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "#7fcfe9" : "#0ea5e9",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {activeTab === "Basic Information" && (
            <div>
              <h3 style={{ marginTop: 0 }}>Basic Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Restro Name</label>
                  <input value={RestroName} onChange={(e) => setRestroName(e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Owner Name</label>
                  <input value={OwnerName} onChange={(e) => setOwnerName(e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Station Code</label>
                  <input value={StationCode} onChange={(e) => setStationCode(e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Station Name</label>
                  <input value={StationName} onChange={(e) => setStationName(e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Owner Phone</label>
                  <input value={OwnerPhone} onChange={(e) => setOwnerPhone(e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>FSSAI Number</label>
                  <input value={FSSAINumber} onChange={(e) => setFSSAINumber(e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>FSSAI Expiry Date</label>
                  <input type="date" value={FSSAIExpiryDate ?? ""} onChange={(e) => setFSSAIExpiryDate(e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "Station Settings" && (
            <div>
              <h3 style={{ marginTop: 0 }}>Station Settings</h3>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={IRCTC} onChange={(e) => setIRCTC(e.target.checked)} />
                  <span>IRCTC Status (On / Off)</span>
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={Raileats} onChange={(e) => setRaileats(e.target.checked)} />
                  <span>Raileats Status (On / Off)</span>
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={IsIrctcApproved} onChange={(e) => setIsIrctcApproved(e.target.checked)} />
                  <span>Is IRCTC Approved</span>
                </label>
              </div>
            </div>
          )}

          {/* Placeholder content for other tabs */}
          {activeTab !== "Basic Information" && activeTab !== "Station Settings" && (
            <div>
              <h3 style={{ marginTop: 0 }}>{activeTab}</h3>
              <p>Placeholder area for <b>{activeTab}</b> content — implement forms/fields here as needed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
