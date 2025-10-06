// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  initialData?: any;
  imagePrefix?: string;
  restroCode?: string; // <-- accept restroCode (optional)
};

export default function AddressDocsClient({ initialData = {}, imagePrefix = "", restroCode = "" }: Props) {
  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    State: initialData?.State ?? "",
    District: initialData?.District ?? "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
  });

  useEffect(() => {
    setLocal({
      RestroAddress: initialData?.RestroAddress ?? "",
      City: initialData?.City ?? "",
      State: initialData?.State ?? "",
      District: initialData?.District ?? "",
      PinCode: initialData?.PinCode ?? "",
      Latitude: initialData?.Latitude ?? "",
      Longitude: initialData?.Longitude ?? "",
      FSSAINumber: initialData?.FSSAINumber ?? "",
      FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
      GSTNumber: initialData?.GSTNumber ?? "",
      GSTType: initialData?.GSTType ?? "",
    });
  }, [initialData]);

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  // helper to persist address/docs to restro row if you need quick save from this component
  async function saveAddressDocs() {
    if (!restroCode) {
      alert("Missing restroCode - cannot save.");
      return;
    }
    try {
      const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Save failed (${res.status})`);
      }
      alert("Address & Documents saved");
    } catch (err: any) {
      console.error("Save address/docs failed", err);
      alert("Save failed: " + (err?.message ?? String(err)));
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ textAlign: "center", marginBottom: 18, fontSize: 20 }}>Address & Documents</h3>

      <div className="compact-grid">
        <div className="field full-col">
          <label>Restro Address</label>
          <textarea value={local.RestroAddress ?? ""} onChange={(e) => update("RestroAddress", e.target.value)} />
        </div>

        <div className="field">
          <label>City / Village</label>
          <input value={local.City ?? ""} onChange={(e) => update("City", e.target.value)} />
        </div>

        <div className="field">
          <label>State</label>
          <input value={local.State ?? ""} onChange={(e) => update("State", e.target.value)} />
        </div>

        <div className="field">
          <label>District</label>
          <input value={local.District ?? ""} onChange={(e) => update("District", e.target.value)} />
        </div>

        <div className="field">
          <label>Pin Code</label>
          <input value={local.PinCode ?? ""} onChange={(e) => update("PinCode", e.target.value)} />
        </div>

        <div className="field">
          <label>Latitude</label>
          <input value={local.Latitude ?? ""} onChange={(e) => update("Latitude", e.target.value)} />
        </div>

        <div className="field">
          <label>Longitude</label>
          <input value={local.Longitude ?? ""} onChange={(e) => update("Longitude", e.target.value)} />
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="compact-grid">
        <div className="field">
          <label>FSSAI Number</label>
          <input value={local.FSSAINumber ?? ""} onChange={(e) => update("FSSAINumber", e.target.value)} />
        </div>

        <div className="field">
          <label>FSSAI Expiry</label>
          <input type="date" value={local.FSSAIExpiry ?? ""} onChange={(e) => update("FSSAIExpiry", e.target.value)} />
        </div>

        <div className="field">
          <label>GST Number</label>
          <input value={local.GSTNumber ?? ""} onChange={(e) => update("GSTNumber", e.target.value)} />
        </div>

        <div className="field">
          <label>GST Type</label>
          <input value={local.GSTType ?? ""} onChange={(e) => update("GSTType", e.target.value)} />
        </div>
      </div>

      <div style={{ marginTop: 18, textAlign: "center" }}>
        <button onClick={saveAddressDocs} style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff", cursor: "pointer" }}>
          Save Address & Docs
        </button>
      </div>

      <style jsx>{`
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .field.full-col {
          grid-column: 1 / -1;
        }
        .field label {
          display: block;
          font-size: 13px;
          color: #444;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .field input,
        textarea {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          font-size: 13px;
          background: #fff;
          box-sizing: border-box;
        }
        textarea {
          min-height: 80px;
          resize: vertical;
        }
        @media (max-width: 1100px) {
          .compact-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 720px) {
          .compact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
