// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData?: any;
  imagePrefix?: string;
};

export default function AddressDocsClient({ initialData = {}, imagePrefix = "" }: Props) {
  const router = useRouter();

  // fields same as Basic
  const [restroAddress, setRestroAddress] = useState(initialData.RestroAddress ?? "");
  const [city, setCity] = useState(initialData.City ?? "");
  const [stateVal, setStateVal] = useState(initialData.State ?? "");
  const [district, setDistrict] = useState(initialData.District ?? "");
  const [pinCode, setPinCode] = useState(initialData.PinCode ?? "");
  const [latitude, setLatitude] = useState(initialData.Latitude ?? "");
  const [longitude, setLongitude] = useState(initialData.Longitude ?? "");
  const [fssaiNumber, setFssaiNumber] = useState(initialData.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(initialData.FSSAIExpiry ?? "");
  const [gstNumber, setGstNumber] = useState(initialData.GSTNumber ?? "");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const restroCode = initialData.RestroCode ?? initialData.RestroId ?? "";

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
        GSTNumber: gstNumber,
      };

      const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Save failed (${res.status})`);
      }

      setMsg("Saved successfully");
    } catch (e: any) {
      console.error("save error:", e);
      setMsg(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="basic-like-wrap">
      <div className="basic-card">
        <div className="basic-heading">Address</div>

        <div className="field full">
          <label>Restro Address</label>
          <textarea value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} />
        </div>

        <div className="grid-3">
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

        <div className="grid-3">
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

      <div className="basic-card" style={{ marginTop: 18 }}>
        <div className="basic-heading">Documents</div>

        <div className="grid-3">
          <div>
            <label>FSSAI Number</label>
            <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} />
          </div>
          <div>
            <label>FSSAI Expiry</label>
            <input type="date" value={fssaiExpiry ?? ""} onChange={(e) => setFssaiExpiry(e.target.value)} />
          </div>
          <div>
            <label>GST Number</label>
            <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="actions-row">
        {msg && <div className={`msg ${msg.includes("failed") ? "err" : "ok"}`}>{msg}</div>}
        <div style={{ flex: 1 }} />
        <button className="btn cancel" onClick={() => router.back()} disabled={saving}>
          Cancel
        </button>
        <button className="btn save" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <style jsx>{`
        .basic-like-wrap { padding: 6px 0 18px 0; }
        .basic-card {
          background: #fff;
          border-radius: 6px;
          border: 1px solid #eef6fb;
          padding: 18px;
        }
        .basic-heading { font-weight:700; color:#0b5f8a; font-size:18px; margin-bottom:12px; }
        label { display:block; font-size:13px; color:#333; margin-bottom:6px; }
        .field.full textarea {
          width:100%; min-height:86px; padding:10px 12px; border-radius:6px; border:1px solid #e6eef7; box-sizing:border-box;
        }
        input { width:100%; padding:10px 12px; border-radius:6px; border:1px solid #e6eef7; box-sizing:border-box; }
        .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; align-items:end; margin-bottom:12px; }
        .actions-row { display:flex; align-items:center; gap:12px; margin-top:14px; padding-top:6px; border-top:1px solid #f1f5f8; }
        .btn { padding:8px 14px; border-radius:6px; border:none; cursor:pointer; }
        .btn.save { background:#06a6e3; color:white; }
        .btn.cancel { background:white; color:#333; border:1px solid #ddd; }
        .msg.ok { color:green; font-size:13px; margin-right:8px; }
        .msg.err { color:crimson; font-size:13px; margin-right:8px; }
        @media (max-width:1100px) { .grid-3 { grid-template-columns:repeat(2,1fr); } }
        @media (max-width:720px) { .grid-3 { grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}
