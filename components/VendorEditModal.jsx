// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import KeyValueGrid from "@/components/ui/KeyValueGrid";

// Tabs (adjust paths if your files live elsewhere)
import AddressDocsClient from "@/components/restro-edit/AddressDocsClient";
import ContactsTab from "@/components/restro-edit/ContactsTab";
import BankTab from "@/components/restro-edit/BankTab";
import FutureClosedTab from "@/components/restro-edit/FutureClosedTab";
import MenuTab from "@/components/restro-edit/MenuTab";

// If any of the above imports are missing in your repo, update the import path accordingly.

type Props = {
  restro?: any; // server-provided restro object
  vendor?: any; // alternate data source (some flows use 'vendor')
  onClose?: () => void;
  onSave?: (payload: any) => Promise<any> | any;
  show?: boolean;
};

export default function RestroEditModal({ restro, vendor, onClose, onSave, show = true }: Props) {
  const tabs = [
    "Basic Information",
    "Address & Documents",
    "Contacts",
    "Bank",
    "Future Closed",
    "Menu",
  ];
  const [activeTab, setActiveTab] = useState<string>(tabs[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // local editable copy (used by KeyValueGrid and other tabs)
  const [local, setLocal] = useState<any>({});

  useEffect(() => {
    // seed local from server-provided restro or vendor prop
    const base = restro ?? vendor ?? {};
    setLocal((prev: any) => ({
      ...prev,
      RestroCode: base?.RestroCode ?? base?.VendorCode ?? base?.code ?? base?.id ?? prev?.RestroCode,
      RestroName: base?.RestroName ?? base?.VendorName ?? base?.name ?? prev?.RestroName,
      StationName: base?.StationName ?? prev?.StationName,
      StationCode: base?.StationCode ?? prev?.StationCode,
      State: base?.State ?? prev?.State,
      ...base,
    }));
  }, [restro, vendor]);

  // Determine a robust restroCode (string) to send to ContactsTab and API calls
  const restroCode: string = useMemo(() => {
    const candidates = [
      restro?.RestroCode,
      restro?.code,
      restro?.id,
      vendor?.VendorCode,
      vendor?.id,
      local?.RestroCode,
      local?.VendorCode,
      local?.id,
    ];
    const pick = candidates.find((v) => typeof v !== "undefined" && v !== null && String(v) !== "");
    return String(pick ?? "");
  }, [restro, vendor, local]);

  useEffect(() => {
    console.log("DEBUG: RestroEditModal mounted", { restroCode, restro, vendor, local });
  }, [restroCode]);

  function updateField(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  async function handleSaveBasic() {
    setError(null);
    setSaving(true);
    try {
      if (onSave) {
        const result = await onSave(local);
        if (!result || !result.ok) {
          throw new Error(result?.error ?? "Save failed");
        }
      } else {
        // default: try PATCH to API endpoint if exists
        try {
          const code = restroCode;
          if (!code) throw new Error("Missing restro code");
          const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(local),
          });
          if (!res.ok) throw new Error(`Save failed (${res.status})`);
        } catch (err: any) {
          throw err;
        }
      }
      // close modal on success
      if (onClose) onClose();
    } catch (err: any) {
      console.error("Save basic error:", err);
      setError(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  }

  // common props passed to tab components
  const common = {
    local,
    updateField,
  };

  // Render the selected tab
  function renderTab() {
    switch (activeTab) {
      case "Basic Information":
        return (
          <div>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Basic Information</h3>
            <KeyValueGrid
              rows={[
                { keyLabel: "Restro Code", value: <div className="readonly-value">{local?.RestroCode ?? "—"}</div> },
                { keyLabel: "Restro Name", value: <input className="kv-input" value={local?.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} /> },
                { keyLabel: "Station", value: <input className="kv-input" value={local?.StationName ?? ""} onChange={(e) => updateField("StationName", e.target.value)} /> },
                { keyLabel: "State", value: <input className="kv-input" value={local?.State ?? ""} onChange={(e) => updateField("State", e.target.value)} /> },
                // add more fields as required
              ]}
              labelWidth={200}
              maxWidth={900}
            />
          </div>
        );
      case "Address & Documents":
        // AddressDocsClient expected to handle initialData or local
        return <AddressDocsClient initialData={restro ?? local} />;
      case "Contacts":
        // IMPORTANT: pass restroCode (string). ContactsTab file we created expects props { restroCode }
        return <ContactsTab restroCode={restroCode} {...common} />;
      case "Bank":
        return <BankTab {...common} />;
      case "Future Closed":
        return <FutureClosedTab {...common} />;
      case "Menu":
        return <MenuTab {...common} />;
      default:
        return <div>Unknown tab</div>;
    }
  }

  if (!show) return null;

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
          <div style={{ fontWeight: 600 }}>{local?.RestroCode ?? local?.VendorCode ?? "—"} / {local?.RestroName ?? "—"}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => onClose && onClose()} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", padding: 6 }} aria-label="Close">✕</button>
          </div>
        </div>

        {/* tabs bar */}
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
          <button onClick={() => onClose && onClose()} disabled={saving} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSaveBasic} disabled={saving} style={{ background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : "Save"}</button>
        </div>

        {/* content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {renderTab()}
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
      `}</style>
    </div>
  );
}
