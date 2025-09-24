// app/admin/restros/[code]/edit/AddressDocsForm.tsx
"use client";

import React, { useState } from "react";

type Props = {
  initialData: any; // row from RestroMaster
  restroCode: number;
};

export default function AddressDocsForm({ initialData, restroCode }: Props) {
  // fields
  const [restroAddress, setRestroAddress] = useState(initialData?.RestroAddress ?? "");
  const [city, setCity] = useState(initialData?.City ?? "");
  const [stateVal, setStateVal] = useState(initialData?.State ?? "");
  const [district, setDistrict] = useState(initialData?.District ?? "");
  const [pinCode, setPinCode] = useState(initialData?.PinCode ?? "");
  const [latitude, setLatitude] = useState(initialData?.Latitude ?? "");
  const [longitude, setLongitude] = useState(initialData?.Longitude ?? "");
  // documents
  const [fssaiNumber, setFssaiNumber] = useState(initialData?.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(initialData?.FSSAIExpiry ?? "");
  // saving state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      // build payload - keep keys same as your backend expects
      const payload = {
        RestroCode: restroCode,
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

      // call your API route (adjust path if needed)
      const res = await fetch(`/api/restros/${restroCode}/update-address-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.message || "Save failed");
      } else {
        setMessage("Saved successfully");
      }
    } catch (err) {
      setMessage("Saving failed");
    } finally {
      setSaving(false);
    }
  };

  // UI uses same grid & style patterns as BasicInfoClient so look matches
  return (
    <div className="restro-edit">
      <div className="actions" style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 700 }}>Address</div>
      </div>

      <div className="section" style={{ background: "#eaf6ff", padding: 14, borderRadius: 6, marginBottom: 18 }}>
        <div className="section-heading">Address</div>
        <div className="form-grid">
          <div className="full">
            <label>Restro Address</label>
            <textarea value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} />
          </div>

          <div className="compact-grid">
            <div>
              <label>City / Village</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div>
              <label>State</label>
              <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
            </div>
            <div>
              <label>District</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
          </div>

          <div className="compact-grid">
            <div>
              <label>Pin Code</label>
              <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
            </div>
            <div>
              <label>Latitude</label>
              <input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>
            <div>
              <label>Longitude</label>
              <input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="section" style={{ background: "#eef7ff", padding: 14, borderRadius: 6 }}>
        <div className="section-heading">Documents</div>
        <div className="form-grid">
          <div>
            <label>FSSAI Number</label>
            <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} />
          </div>
          <div>
            <label>FSSAI Expiry</label>
            <input type="date" value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 12 }}>
        {message && <div style={{ color: message.includes("failed") ? "crimson" : "green", alignSelf: "center" }}>{message}</div>}
        <button onClick={handleSave} disabled={saving} className="save-btn">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <style jsx>{`
        .restro-edit { padding: 8px 0; }
        .section-heading { font-size: 18px; font-weight: 700; color: #0b5f8a; margin-bottom: 10px; }
        .form-grid { display: grid; gap: 12px; grid-template-columns: 1fr; }
        .compact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; align-items: end; }
        .full textarea { width: 100%; min-height: 82px; padding: 10px; border-radius: 6px; border: 1px solid #e6eef7; box-sizing: border-box; }
        label { display:block; font-size: 13px; color:#333; margin-bottom:6px; }
        input { width: 100%; padding: 8px 10px; border-radius: 6px; border: 1px solid #e6eef7; box-sizing: border-box; }
        .save-btn { background: #06a6e3; color: #fff; padding: 8px 14px; border-radius: 6px; border: none; cursor: pointer; }
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
