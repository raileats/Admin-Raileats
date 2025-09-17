// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  restro: any;
  onClose: () => void;
  onSave?: (updatedFields: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
  saving?: boolean;
};

function getFieldCaseInsensitive(obj: any, candidates: string[]) {
  if (!obj) return undefined;
  const keys = Object.keys(obj);
  for (const cand of candidates) {
    if (obj[cand] !== undefined && obj[cand] !== null) return obj[cand];
    const normalized = cand.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    for (const k of keys) {
      if (k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === normalized) {
        return obj[k];
      }
    }
  }
  return undefined;
}

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
      RestroName: restro?.RestroName ?? restro?.restro_name ?? "",
      StationCode: restro?.StationCode ?? restro?.station_code ?? "",
      StationName: restro?.StationName ?? restro?.station_name ?? "",
      OwnerName: restro?.OwnerName ?? restro?.owner_name ?? "",
      OwnerPhone: restro?.OwnerPhone ?? restro?.owner_phone ?? "",
      FSSAINumber: restro?.FSSAINumber ?? restro?.fssai_number ?? "",
      FSSAIExpiryDate: restro?.FSSAIExpiryDate ?? restro?.fssai_expiry_date ?? "",
      IRCTC: restro?.IRCTC === 1 || restro?.IRCTC === "1" || restro?.IRCTC === true,
      Raileats: restro?.Raileats === 1 || restro?.Raileats === "1" || restro?.Raileats === true,
      IsIrctcApproved:
        restro?.IsIrctcApproved === 1 ||
        restro?.IsIrctcApproved === "1" ||
        restro?.IsIrctcApproved === true,
      State: getFieldCaseInsensitive(restro, ["State", "state", "state_name", "StationState", "StateName"]) ?? "",
      ...restro,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restro]);

  const saving = parentSaving ?? savingInternal;

  function updateField(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  async function defaultPatch(payload: any) {
    try {
      const code = restro?.RestroCode ?? restro?.restro_code ?? restro?.RestroId ?? restro?.restro_id ?? restro?.code;
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
      StationCode: local.StationCode ?? restro?.StationCode ?? restro?.station_code ?? "",
      StationName: local.StationName ?? restro?.StationName ?? restro?.station_name ?? "",
      OwnerName: local.OwnerName ?? "",
      OwnerPhone: local.OwnerPhone ?? "",
      FSSAINumber: local.FSSAINumber ?? "",
      FSSAIExpiryDate: local.FSSAIExpiryDate ?? "",
      IRCTC: local.IRCTC ? 1 : 0,
      Raileats: local.Raileats ? 1 : 0,
      IsIrctcApproved: local.IsIrctcApproved ? 1 : 0,
      State: local.State ?? restro?.State ?? restro?.state ?? restro?.StationState ?? null,
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

  // Compose Station display: "StationName (StationCode) - State"
  const getStationDisplay = () => {
    // if restro already has a full display string, prefer it
    const rawFull = getFieldCaseInsensitive(restro, [
      "StationDisplay",
      "StationFullName",
      "StationFull",
      "StationNameFull",
      "station_display",
      "station_full_name",
      "station_full",
    ]);
    if (rawFull && typeof rawFull === "string" && rawFull.trim()) {
      const s = rawFull.trim();
      if (s.includes("(") || s.includes("-")) return s;
      return s;
    }

    const stationName =
      (getFieldCaseInsensitive(restro, ["StationName", "station_name", "stationName"]) ??
        local.StationName ??
        ""
      )
        .toString()
        .trim();
    const stationCode =
      (getFieldCaseInsensitive(restro, ["StationCode", "station_code", "stationCode"]) ?? local.StationCode ?? "")
        .toString()
        .trim();
    const stateName =
      (getFieldCaseInsensitive(restro, ["State", "state", "state_name", "StationState", "StateName"]) ?? local.State ?? "")
        .toString()
        .trim();

    const leftParts: string[] = [];
    if (stationName) leftParts.push(stationName);
    if (stationCode) leftParts.push(`(${stationCode})`);

    const left = leftParts.join(" ");
    if (left && stateName) return `${left} - ${stateName}`;
    if (left) return left;
    if (stateName) return stateName;
    return "—";
  };

  const stationDisplay = getStationDisplay();

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
            {String(restro?.RestroCode ?? restro?.restro_code ?? restro?.RestroId ?? restro?.restro_id ?? "")} / {local.RestroName ?? restro?.RestroName} / {stationDisplay}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <a
              href={`/admin/restros/edit/${encodeURIComponent(String(restro?.RestroCode ?? restro?.restro_code ?? restro?.RestroId ?? restro?.restro_id ?? ""))}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0ea5e9", textDecoration: "underline", fontSize: 14 }}
            >
              Open Outlet Page
            </a>

            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 20, cursor: "pointer", padding: 6 }} aria-label="Close">✕</button>
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

              <div className="compact-grid">
                {/* Station - read-only */}
                <div className="field">
                  <label>Station</label>
                  <div className="readonly">{stationDisplay}</div>
                </div>

                <div className="field">
                  <label>Restro Code</label>
                  <div className="readonly">{restro?.RestroCode ?? restro?.restro_code ?? restro?.RestroId ?? restro?.restro_id ?? "—"}</div>
                </div>

                <div className="field">
                  <label>Restro Name</label>
                  <input value={local.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} />
                </div>

                <div className="field">
                  <label>Brand Name</label>
                  <input value={local.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} />
                </div>

                <div className="field">
                  <label>Raileats Status</label>
                  <select value={local.Raileats ? 1 : 0} onChange={(e) => updateField("Raileats", Number(e.target.value) === 1)}>
                    <option value={1}>On</option>
                    <option value={0}>Off</option>
                  </select>
                </div>

                <div className="field">
                  <label>Is IRCTC Approved</label>
                  <select value={local.IsIrctcApproved ? "1" : "0"} onChange={(e) => updateField("IsIrctcApproved", e.target.value === "1")}>
                    <option value="1">Yes</option>
                    <option value="0">No</option>
                  </select>
                </div>

                <div className="field">
                  <label>Restro Rating</label>
                  <input type="number" step="0.1" value={local.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} />
                </div>

                <div className="field">
                  <label>Restro Display Photo (path)</label>
                  <input value={local.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} />
                </div>

                <div className="field">
                  <label>Display Preview</label>
                  {local.RestroDisplayPhoto ? <img src={imgSrc(local.RestroDisplayPhoto)} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : <div className="readonly">No image</div>}
                </div>

                <div className="field">
                  <label>Owner Name</label>
                  <input value={local.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} />
                </div>

                <div className="field">
                  <label>Owner Email</label>
                  <input value={local.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} />
                </div>

                <div className="field">
                  <label>Owner Phone</label>
                  <input value={local.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} />
                </div>

                <div className="field">
                  <label>Restro Email</label>
                  <input value={local.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} />
                </div>

                <div className="field">
                  <label>Restro Phone</label>
                  <input value={local.RestroPhone ?? ""} onChange={(e) => updateField("RestroPhone", e.target.value)} />
                </div>

                <div className="field">
                  <label>FSSAI Number</label>
                  <input value={local.FSSAINumber ?? ""} onChange={(e) => updateField("FSSAINumber", e.target.value)} />
                </div>

                <div className="field">
                  <label>FSSAI Expiry Date</label>
                  <input type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)} />
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

          {activeTab !== "Basic Information" && activeTab !== "Station Settings" && (
            <div>
              <h3 style={{ marginTop: 0 }}>{activeTab}</h3>
              <p>Placeholder area for <b>{activeTab}</b> content — implement forms/fields here as needed.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          max-width: 980px;
          margin: 8px auto;
        }
        .field label {
          display: block;
          font-size: 13px;
          color: #444;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .field input, .field select {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          font-size: 13px;
          background: #fff;
          box-sizing: border-box;
        }
        .readonly {
          padding: 8px 10px;
          border-radius: 6px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          font-size: 13px;
        }
        .preview {
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        @media (max-width: 1100px) {
          .compact-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 720px) {
          .compact-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
