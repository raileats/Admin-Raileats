// app/admin/restros/[code]/edit/AddressDocsForm.tsx
"use client";

import React, { useState } from "react";

type Props = {
  initialData?: any;
  restroCode?: number | string;
};

export default function AddressDocsForm({ initialData = {}, restroCode }: Props) {
  const [restroAddress, setRestroAddress] = useState(initialData.RestroAddress ?? "");
  const [city, setCity] = useState(initialData.City ?? "");
  const [stateVal, setStateVal] = useState(initialData.State ?? "");
  const [district, setDistrict] = useState(initialData.District ?? "");
  const [pinCode, setPinCode] = useState(initialData.PinCode ?? "");
  const [latitude, setLatitude] = useState(initialData.Latitude ?? "");
  const [longitude, setLongitude] = useState(initialData.Longitude ?? "");
  const [fssaiNumber, setFssaiNumber] = useState(initialData.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(initialData.FSSAIExpiry ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        RestroAddress: restroAddress,
        City: city,
        State: stateVal,
        District: district,
        PinCode: pinCode,
        Latitude: latitude,
        Longitude: longitude,
        FSSAINumber: fssaiNumber,
        FSSAIExpiry: fssaiExpiry,
      };

      const code = restroCode ?? initialData?.RestroCode;
      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Saved successfully");
    } catch (e: any) {
      setMsg(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rd-wrap">
      {/* top section heading (same look as Basic) */}
      <div className="rd-card">
        <div className="rd-section-title">Address</div>

        <div className="rd-field full">
          <label className="rd-label">Restro Address</label>
          <textarea className="rd-textarea" value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} />
        </div>

        <div className="rd-grid-3">
          <div>
            <label className="rd-label">City / Village</label>
            <input className="rd-input" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div>
            <label className="rd-label">State</label>
            <input className="rd-input" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
          </div>

          <div>
            <label className="rd-label">District</label>
            <input className="rd-input" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
        </div>

        <div className="rd-grid-3">
          <div>
            <label className="rd-label">Pin Code</label>
            <input className="rd-input" value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
          </div>

          <div>
            <label className="rd-label">Latitude</label>
            <input className="rd-input" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </div>

          <div>
            <label className="rd-label">Longitude</label>
            <input className="rd-input" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </div>
        </div>
      </div>

      {/* documents card */}
      <div className="rd-card" style={{ marginTop: 18 }}>
        <div className="rd-section-title">Documents</div>

        <div className="rd-grid-2">
          <div>
            <label className="rd-label">FSSAI Number</label>
            <input className="rd-input" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} />
          </div>

          <div>
            <label className="rd-label">FSSAI Expiry</label>
            <input type="date" className="rd-input" value={fssaiExpiry ?? ""} onChange={(e) => setFssaiExpiry(e.target.value)} />
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="rd-actions">
        {msg && <div className={`rd-msg ${msg.includes("failed") ? "err" : "ok"}`}>{msg}</div>}
        <div style={{ flex: 1 }} />
        <button className="rd-btn cancel" onClick={() => window.history.back()} disabled={saving}>
          Cancel
        </button>
        <button className="rd-btn save" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* styles */}
      <style jsx>{`
        .rd-wrap { padding: 8px 0 20px 0; }
        .rd-card {
          background: #fff;
          border-radius: 6px;
          box-shadow: none;
          border: 1px solid #eef6fb;
          padding: 18px;
        }
        .rd-section-title {
          color: #0b5f8a;
          font-weight: 700;
          font-size: 18px;
          margin-bottom: 12px;
        }
        .rd-label { display:block; font-size:13px; color:#333; margin-bottom:6px; }
        .rd-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e6eef7;
          box-sizing: border-box;
        }
        .rd-textarea {
          width: 100%;
          min-height: 78px;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e6eef7;
          box-sizing: border-box;
          resize: vertical;
        }
        .rd-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; align-items:end; }
        .rd-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 6px; align-items:end; }

        .rd-field.full { margin-bottom: 12px; }

        .rd-actions {
          display:flex; align-items:center; gap:12px; margin-top:14px; padding: 8px 6px;
          border-top: 1px solid #f1f5f8; background: transparent;
        }
        .rd-btn { padding: 8px 14px; border-radius: 6px; border: none; cursor: pointer; }
        .rd-btn.save { background: #06a6e3; color: #fff; }
        .rd-btn.cancel { background: #fff; color: #333; border: 1px solid #ddd; }

        .rd-msg { font-size: 13px; margin-right: 8px; }
        .rd-msg.err { color: crimson; }
        .rd-msg.ok { color: green; }

        @media (max-width: 1100px) {
          .rd-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 720px) {
          .rd-grid-3, .rd-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
