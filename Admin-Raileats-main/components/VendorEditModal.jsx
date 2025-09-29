// components/VendorEditModal.jsx
"use client";

import React, { useEffect, useState } from "react";
import KeyValueGrid from "@/components/ui/KeyValueGrid";

export default function VendorEditModal({ vendor, onClose, onSave, saving: parentSaving }) {
  const tabs = ["Basic Information", "Contacts", "Bank", "Other"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [savingInternal, setSavingInternal] = useState(false);
  const [error, setError] = useState(null);

  const [local, setLocal] = useState({});

  useEffect(() => {
    setLocal({
      VendorCode: vendor?.VendorCode ?? "",
      VendorName: vendor?.VendorName ?? "",
      ContactName: vendor?.ContactName ?? "",
      ContactEmail: vendor?.ContactEmail ?? "",
      ContactPhone: vendor?.ContactPhone ?? "",
      BankAccount: vendor?.BankAccount ?? "",
      IFSC: vendor?.IFSC ?? "",
      VendorLogo: vendor?.VendorLogo ?? "",
      Active: vendor?.Active === 1 || vendor?.Active === "1" || vendor?.Active === true,
      ...vendor,
    });
  }, [vendor]);

  const saving = parentSaving ?? savingInternal;

  function updateField(key, value) {
    setLocal((s) => ({ ...s, [key]: value }));
  }

  async function defaultPatch(payload) {
    try {
      const code = vendor?.VendorCode ?? vendor?.id ?? vendor?.code;
      if (!code) throw new Error("Missing VendorCode for update");
      const res = await fetch(`/api/vendors/${encodeURIComponent(String(code))}`, {
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
    } catch (err) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }

  async function handleSave() {
    setError(null);
    const payload = {
      VendorName: local.VendorName ?? "",
      ContactName: local.ContactName ?? "",
      ContactEmail: local.ContactEmail ?? "",
      ContactPhone: local.ContactPhone ?? "",
      BankAccount: local.BankAccount ?? "",
      IFSC: local.IFSC ?? "",
      VendorLogo: local.VendorLogo ?? "",
      Active: local.Active ? 1 : 0,
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
    } catch (err) {
      console.error("Save error:", err);
      setError(err?.message ?? String(err));
    } finally {
      if (parentSaving === undefined) setSavingInternal(false);
    }
  }

  const imgSrc = (p) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return `${process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""}${p}`;
  };

  const rows = [
    { keyLabel: "Vendor Code", value: <div className="readonly-value">{local.VendorCode ?? "—"}</div> },
    { keyLabel: "Vendor Name", value: <input className="kv-input" value={local.VendorName ?? ""} onChange={(e) => updateField("VendorName", e.target.value)} /> },
    { keyLabel: "Contact Name", value: <input className="kv-input" value={local.ContactName ?? ""} onChange={(e) => updateField("ContactName", e.target.value)} /> },
    { keyLabel: "Contact Email", value: <input className="kv-input" value={local.ContactEmail ?? ""} onChange={(e) => updateField("ContactEmail", e.target.value)} /> },
    { keyLabel: "Contact Phone", value: <input className="kv-input" value={local.ContactPhone ?? ""} onChange={(e) => updateField("ContactPhone", e.target.value)} /> },
    { keyLabel: "Vendor Logo (path)", value: <input className="kv-input" value={local.VendorLogo ?? ""} onChange={(e) => updateField("VendorLogo", e.target.value)} /> },
    { keyLabel: "Logo Preview", value: local.VendorLogo ? <img className="preview-img" src={imgSrc(local.VendorLogo)} alt="logo" onError={(e) => ((e.target).style.display = "none")} /> : <div className="readonly-value">No image</div> },
    { keyLabel: "Bank Account", value: <input className="kv-input" value={local.BankAccount ?? ""} onChange={(e) => updateField("BankAccount", e.target.value)} /> },
    { keyLabel: "IFSC", value: <input className="kv-input" value={local.IFSC ?? ""} onChange={(e) => updateField("IFSC", e.target.value)} /> },
    { keyLabel: "Active", value: <label className="inline-label"><input type="checkbox" checked={!!local.Active} onChange={(e) => updateField("Active", e.target.checked)} /> <span>{local.Active ? "Yes" : "No"}</span></label> },
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
          maxWidth: "1200px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid #e9e9e9" }}>
          <div style={{ fontWeight: 600 }}>{String(local.VendorCode ?? "")} / {local.VendorName}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", padding: 6 }} aria-label="Close">✕</button>
          </div>
        </div>

        {/* tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #eee", background: "#fafafa" }}>
          {tabs.map((t) => (
            <div
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                borderBottom: activeTab === t ? "3px solid #0ea5e9" : "3px solid transparent",
                fontWeight: activeTab === t ? 600 : 500,
                color: activeTab === t ? "#0ea5e9" : "#333",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* toolbar */}
        <div style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {error && <div style={{ color: "red", marginRight: "auto" }}>{error}</div>}
          <button onClick={() => { onClose(); }} disabled={saving} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : "Save"}</button>
        </div>

        {/* content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {activeTab === "Basic Information" && (
            <div>
              <h3 style={{ marginTop: 0, textAlign: "center" }}>Vendor - Basic Information</h3>
              <KeyValueGrid rows={rows} labelWidth={200} maxWidth={900} />
            </div>
          )}

          {activeTab !== "Basic Information" && (
            <div>
              <h3 style={{ marginTop: 0 }}>{activeTab}</h3>
              <p style={{ color: "#555" }}>Content for <b>{activeTab}</b> — implement fields as needed.</p>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .kv-input {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          font-size: 13px;
          box-sizing: border-box;
          background: #fff;
        }
        .readonly-value {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
          background: #fafafa;
          color: #222;
          font-size: 13px;
        }
        .inline-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        .preview-img {
          height: 96px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }
      `}</style>
    </div>
  );
}
