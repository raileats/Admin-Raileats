// app/admin/restros/[code]/edit/AddressDocsForm.tsx
"use client";

import React, { useState } from "react";

type Props = {
  initialData: any; // row from RestroMaster
  restroCode: number;
};

const BOX_BG = "#eaf6ff"; // light-blue section bg to match Basic layout

export default function AddressDocsForm({ initialData, restroCode }: Props) {
  // address fields
  const [restroAddress, setRestroAddress] = useState(initialData?.RestroAddress ?? "");
  const [city, setCity] = useState(initialData?.City ?? "");
  const [stateName, setStateName] = useState(initialData?.State ?? "");
  const [district, setDistrict] = useState(initialData?.District ?? "");
  const [pinCode, setPinCode] = useState(initialData?.PinCode ?? "");
  const [latitude, setLatitude] = useState(initialData?.RestroLatitude ?? "");
  const [longitude, setLongitude] = useState(initialData?.RestroLongitude ?? "");

  // documents fields
  const [fssaiNumber, setFssaiNumber] = useState(initialData?.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(initialData?.FSSAIExpiryDate ?? "");
  const [fssaiStatus, setFssaiStatus] = useState(initialData?.FSSAIStatus ?? 1);
  const [gstNumber, setGstNumber] = useState(initialData?.GSTNumber ?? "");
  const [gstType, setGstType] = useState(initialData?.GSTType ?? "");
  const [gstStatus, setGstStatus] = useState(initialData?.GSTStatus ?? 1);
  const [panNumber, setPanNumber] = useState(initialData?.PANNumber ?? "");
  const [panType, setPanType] = useState(initialData?.PANType ?? "");
  const [panStatus, setPanStatus] = useState(initialData?.PANStatus ?? 1);

  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    // prepare body - only allowed keys
    const body: Record<string, any> = {
      RestroAddress: restroAddress,
      City: city,
      State: stateName,
      District: district,
      PinCode: pinCode,
      RestroLatitude: latitude,
      RestroLongitude: longitude,

      // documents
      FSSAINumber: fssaiNumber,
      FSSAIExpiryDate: fssaiExpiry,
      FSSAIStatus: fssaiStatus,
      GSTNumber: gstNumber,
      GSTType: gstType,
      GSTStatus: gstStatus,
      PANNumber: panNumber,
      PANType: panType,
      PANStatus: panStatus,
    };

    try {
      const res = await fetch(`/api/restros/${restroCode}/address-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Save error", data);
        setMessage(`Save failed: ${data?.error ?? "unknown"}`);
      } else {
        setMessage("Saved successfully.");
        // optionally you may trigger a page refresh or inform parent; here we keep it simple
      }
    } catch (err: any) {
      console.error(err);
      setMessage("Save failed (network).");
    } finally {
      setSaving(false);
    }
  }

  // Basic shared style helpers to match other tabs
  const containerStyle: React.CSSProperties = { padding: 18 };
  const sectionStyle: React.CSSProperties = { background: BOX_BG, padding: 18, borderRadius: 6, marginBottom: 18 };
  const sectionTitle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#0b5f8a" };
  const labelStyle: React.CSSProperties = { fontSize: 13, color: "#333", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #e6eef7", boxSizing: "border-box" };

  return (
    <div style={containerStyle}>
      {/* top small heading showing Station (non-editable) */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700 }}>{initialData?.RestroCode ?? restroCode} / {initialData?.RestroName}</div>
        <div style={{ fontSize: 13, color: "#1a8fb5" }}>
          {initialData?.StationName ? `(${initialData?.StationCode}) ${initialData?.StationName}` : ""}
        </div>
      </div>

      {/* ADDRESS SECTION */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Address</div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Restro Address</div>
          <textarea value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} style={{ ...inputStyle, minHeight: 90 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>City / Village</div>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>State</div>
            <input value={stateName} onChange={(e) => setStateName(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>District</div>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>Pin Code</div>
            <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Latitude</div>
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Longitude</div>
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* DOCUMENTS SECTION */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Documents</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 220px 120px", gap: 12 }}>
          <div>
            <div style={labelStyle}>FSSAI Number</div>
            <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>FSSAI Expiry</div>
            <input value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} placeholder="dd-mm-yyyy" style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Upload Copy</div>
            <input type="file" disabled style={{ ...inputStyle, padding: 6 }} />
            <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>Upload UI disabled in this example</div>
          </div>

          <div>
            <div style={labelStyle}>Status</div>
            <div style={{ marginTop: 6 }}>
              <button
                onClick={() => setFssaiStatus(1)}
                style={{ marginRight: 6, background: fssaiStatus ? "#16a34a" : "#e6eef7", color: fssaiStatus ? "#fff" : "#333", padding: "6px 10px", borderRadius: 6, border: "none" }}
              >
                On
              </button>
              <button
                onClick={() => setFssaiStatus(0)}
                style={{ background: !fssaiStatus ? "#6b7280" : "#e6eef7", color: !fssaiStatus ? "#fff" : "#333", padding: "6px 10px", borderRadius: 6, border: "none" }}
              >
                Off
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* GST row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 220px 120px", gap: 12 }}>
          <div>
            <div style={labelStyle}>GST Number</div>
            <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>GST Type</div>
            <input value={gstType} onChange={(e) => setGstType(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Upload Copy</div>
            <input type="file" disabled style={{ ...inputStyle, padding: 6 }} />
          </div>

          <div>
            <div style={labelStyle}>Status</div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => setGstStatus(1)} style={{ marginRight: 6, background: gstStatus ? "#16a34a" : "#e6eef7", color: gstStatus ? "#fff" : "#333", padding: "6px 10px", borderRadius: 6, border: "none" }}>
                On
              </button>
              <button onClick={() => setGstStatus(0)} style={{ background: !gstStatus ? "#6b7280" : "#e6eef7", color: !gstStatus ? "#fff" : "#333", padding: "6px 10px", borderRadius: 6, border: "none" }}>
                Off
              </button>
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* PAN row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 220px 120px", gap: 12 }}>
          <div>
            <div style={labelStyle}>PAN Number</div>
            <input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>PAN Type</div>
            <input value={panType} onChange={(e) => setPanType(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Upload Copy</div>
            <input type="file" disabled style={{ ...inputStyle, padding: 6 }} />
          </div>

          <div>
            <div style={labelStyle}>Status</div>
            <div style={{ marginTop: 6 }}>
              <button onClick={() => setPanStatus(1)} style={{ marginRight: 6, background: panStatus ? "#16a34a" : "#e6eef7", color: panStatus ? "#fff" : "#333", padding: "6px 10px", borderRadius: 6, border: "none" }}>
                On
              </button>
              <button onClick={() => setPanStatus(0)} style={{ background: !panStatus ? "#6b7280" : "#e6eef7", color: !panStatus ? "#fff" : "#333", padding: "6px 10px", borderRadius: 6, border: "none" }}>
                Off
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
          Note: FSSAI/GST/PAN entry UI for file upload is placeholder here. Server save will update DB fields.
        </div>
      </div>

      {/* bottom actions (Cancel left, Save right) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => { /* close handled by parent route/modal - keep simple */ window.history.back(); }}
          style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}
        >
          Cancel
        </button>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {message && <div style={{ color: message.includes("failed") ? "crimson" : "green" }}>{message}</div>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: "#06a6e3", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
