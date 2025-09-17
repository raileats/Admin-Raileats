// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import KeyValueGrid, { KVRow } from "@/components/ui/KeyValueGrid";

type Props = {
  restro: any;
  onClose: () => void;
  onSave?: (updatedFields: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
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
      ...restro,
    });
  }, [restro]);

  const saving = parentSaving ?? savingInternal;

  function updateField(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  async function defaultPatch(payload: any) {
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
      IRCTC: local.IRCTC ? 1 : 0,
      Raileats: local.Raileats ? 1 : 0,
      IsIrctcApproved: local.IsIrctcApproved ? 1 : 0,
    };

    try {
      if (onSave) {
        if (parentSaving === undefined) setSavingInternal(true);
        const result = await onSave(payload);
        if (!result || !result.ok) {
          throw new Error(result?.error ?? "Save failed");
        }
        onClose();
      } else {
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

  const imgSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}${p}`;
  };

  // build rows
  const rows: KVRow[] = [
    { keyLabel: "Restro Code", value: <div className="readonly-value">{local.RestroCode ?? local.RestroId ?? "—"}</div> },
    { keyLabel: "Station Code with Name", value: <div className="readonly-value">{local.StationCode ? `(${local.StationCode}) ${local.StationName ?? ""}` : "—"}</div> },
    { keyLabel: "Restro Name", value: <input className="kv-input" value={local.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} /> },
    { keyLabel: "Brand Name if Any", value: <input className="kv-input" value={local.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} /> },
    { keyLabel: "Raileats Status", value: <label className="inline-label"><input type="checkbox" checked={!!local.Raileats} onChange={(e) => updateField("Raileats", e.target.checked)} /> <span>{local.Raileats ? "On" : "Off"}</span></label> },
    { keyLabel: "Is Irctc Approved", value: <label className="inline-label"><input type="checkbox" checked={!!local.IsIrctcApproved} onChange={(e) => updateField("IsIrctcApproved", e.target.checked)} /> <span>{local.IsIrctcApproved ? "Yes" : "No"}</span></label> },
    { keyLabel: "Restro Rating", value: <div className="readonly-value">{local.RestroRating ?? "—"}</div> },
    { keyLabel: "Restro Display Photo (path)", value: <input className="kv-input" value={local.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} /> },
    { keyLabel: "Display Preview", value: local.RestroDisplayPhoto ? <img className="preview-img" src={imgSrc(local.RestroDisplayPhoto)} alt="display" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : <div className="readonly-value">No image</div> },
    { keyLabel: "Owner Name", value: <input className="kv-input" value={local.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} /> },
    { keyLabel: "Owner Email", value: <input className="kv-input" value={local.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} /> },
    { keyLabel: "Owner Phone", value: <input className="kv-input" value={local.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} /> },
    { keyLabel: "Restro Email", value: <input className="kv-input" value={local.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} /> },
    { keyLabel: "Restro Phone", value: <input className="kv-input" value={local.RestroPhone ?? ""} onChange={(e) => updateField("RestroPhone", e.target.value)} /> },
    { keyLabel: "FSSAI Number", value: <input className="kv-input" value={local.FSSAINumber ?? ""} onChange={(e) => updateField("FSSAINumber", e.target.value)} /> },
    { keyLabel: "FSSAI Expiry Date", value: <input className="kv-input" type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)} /> },
  ];

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #e9e9e9" }}>
          <div style={{ fontWeight: 600 }}>
            {String(local.RestroCode ?? local.RestroId ?? "")} / {local.RestroName} / {local.StationCode} / {local.StationName}
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

            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", padding: 6 }} aria-label="Close">
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
          <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }} disabled={saving}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {activeTab === "Basic Information" && (
            <div>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Basic Information</h3>
              <KeyValueGrid rows={rows} labelWidth={220} maxWidth={980} />
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
