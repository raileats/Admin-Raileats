// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
  /**
   * Optional: parent can provide onSave(updatedFields) and handle the PATCH.
   * If provided, modal will call it and rely on the parent's saving boolean (optional).
   */
  onSave?: (updatedFields: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
  /**
   * Optional: parent-provided saving indicator. If provided, modal uses this to disable UI.
   */
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

export default function RestroEditModal({ restro, onClose, onSave, saving: parentSaving }: Props) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [savingInternal, setSavingInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local editable state (initialize from restro)
  const [local, setLocal] = useState<any>({});
  useEffect(() => {
    setLocal({
      RestroName: restro?.RestroName ?? "",
      StationCode: restro?.StationCode ?? "",
      StationName: restro?.StationName ?? "",
      OwnerName: restro?.OwnerName ?? "",
      OwnerPhone: restro?.OwnerPhone ?? "",
      FSSAINumber: restro?.FSSAINumber ?? "",
      FSSAIExpiryDate: restro?.FSSAIExpiryDate ?? "",
      IRCTC: restro?.IRCTC === 1 || restro?.IRCTC === "1" || restro?.IRCTC === true,
      Raileats: restro?.Raileats === 1 || restro?.Raileats === "1" || restro?.Raileats === true,
      IsIrctcApproved:
        restro?.IsIrctcApproved === 1 ||
        restro?.IsIrctcApproved === "1" ||
        restro?.IsIrctcApproved === true,
      // copy any other fields you want editable by default:
      ...restro,
    });
  }, [restro]);

  const saving = parentSaving ?? savingInternal;

  function updateField(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  async function defaultPatch(payload: any) {
    // fallback: modal does PATCH itself if parent onSave not provided
    try {
      const code = restro?.RestroCode ?? restro?.RestroId ?? restro?.code;
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
      const updated = json?.row ?? json ?? null;
      return { ok: true, row: updated };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  async function handleSave() {
    setError(null);
    const payload: any = {
      RestroName: local.RestroName ?? "",
      StationCode: local.StationCode ?? "",
      StationName: local.StationName ?? "",
      OwnerName: local.OwnerName ?? "",
      OwnerPhone: local.OwnerPhone ?? "",
      FSSAINumber: local.FSSAINumber ?? "",
      FSSAIExpiryDate: local.FSSAIExpiryDate ?? "",
      // send 1/0 for boolean flags if your DB uses 1/0
      IRCTC: local.IRCTC ? 1 : 0,
      Raileats: local.Raileats ? 1 : 0,
      IsIrctcApproved: local.IsIrctcApproved ? 1 : 0,
    };

    try {
      if (onSave) {
        // parent will handle PATCH; show internal saving only if parent doesn't provide saving prop
        if (parentSaving === undefined) setSavingInternal(true);
        const result = await onSave(payload);
        if (!result || !result.ok) {
          throw new Error(result?.error ?? "Save failed");
        }
        // closing modal; parent should update list using returned row
        onClose();
      } else {
        // modal handles patch itself
        setSavingInternal(true);
        const result = await defaultPatch(payload);
        if (!result.ok) {
          throw new Error(result.error ?? "Save failed");
        }
        onClose();
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err?.message ?? String(err));
    } finally {
      if (parentSaving === undefined) setSavingInternal(false);
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
            {String(local.RestroCode ?? local.RestroId ?? "")} / {local.RestroName} / {local.StationCode} /{" "}
            {local.StationName}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a
              href={`/admin/restros/edit/${encodeURIComponent(String(local.RestroCode ?? local.RestroId ?? ""))}`}
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

        {/* Toolbar */}
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

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {activeTab === "Basic Information" && (
            <div>
              <h3 style={{ marginTop: 0 }}>Basic Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Restro Name</label>
                  <input value={local.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Owner Name</label>
                  <input value={local.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Station Code</label>
                  <input value={local.StationCode ?? ""} onChange={(e) => updateField("StationCode", e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Station Name</label>
                  <input value={local.StationName ?? ""} onChange={(e) => updateField("StationName", e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Owner Phone</label>
                  <input value={local.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>FSSAI Number</label>
                  <input value={local.FSSAINumber ?? ""} onChange={(e) => updateField("FSSAINumber", e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>FSSAI Expiry Date</label>
                  <input type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)} style={{ width: "100%", padding: 8 }} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "Station Settings" && (
            <div>
              <h3 style={{ marginTop: 0 }}>Station Settings</h3>
              <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={!!local.IRCTC} onChange={(e) => updateField("IRCTC", e.target.checked)} />
                  <span>IRCTC Status (On / Off)</span>
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={!!local.Raileats} onChange={(e) => updateField("Raileats", e.target.checked)} />
                  <span>Raileats Status (On / Off)</span>
                </label>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" checked={!!local.IsIrctcApproved} onChange={(e) => updateField("IsIrctcApproved", e.target.checked)} />
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
