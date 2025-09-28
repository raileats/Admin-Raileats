// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type StateItem = { id: string; name: string };
type DistrictItem = { id: string; name: string; state_id?: string };

type Props = {
  initialData?: any;
  imagePrefix?: string;
  states?: StateItem[];
  initialDistricts?: DistrictItem[];
};

export default function AddressDocsClient({
  initialData = {},
  imagePrefix = "",
  states = [],
  initialDistricts = [],
}: Props) {
  // Local editable fields (most are still editable)
  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    // we keep StateCode/DistrictCode for saving logic if needed elsewhere,
    // but State and District will be displayed read-only from initialData
    StateCode: initialData?.StateCode ?? initialData?.State ?? initialData?.StateName ?? "",
    DistrictCode:
      initialData?.DistrictCode ??
      initialData?.District ??
      initialData?.DistrictName ??
      initialData?.Districts ??
      "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? "",
  });

  useEffect(() => {
    // Sync when initialData changes (safe merge)
    setLocal((p: any) => ({
      ...p,
      RestroAddress: initialData?.RestroAddress ?? p.RestroAddress,
      City: initialData?.City ?? p.City,
      StateCode: initialData?.StateCode ?? initialData?.State ?? initialData?.StateName ?? p.StateCode,
      DistrictCode:
        initialData?.DistrictCode ??
        initialData?.District ??
        initialData?.DistrictName ??
        initialData?.Districts ??
        p.DistrictCode,
      PinCode: initialData?.PinCode ?? p.PinCode,
      Latitude: initialData?.Latitude ?? p.Latitude,
      Longitude: initialData?.Longitude ?? p.Longitude,
      FSSAINumber: initialData?.FSSAINumber ?? p.FSSAINumber,
      FSSAIExpiry: initialData?.FSSAIExpiry ?? p.FSSAIExpiry,
      GSTNumber: initialData?.GSTNumber ?? p.GSTNumber,
      GSTType: initialData?.GSTType ?? p.GSTType,
      RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? p.RestroDisplayPhoto ?? "",
    }));
  }, [initialData]);

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  // Helper: tolerant extractor for state & district display names
  function extractStateName(src: any): string {
    // try many possible keys (including typo 'Sate')
    const candidates = [
      "State",
      "StateName",
      "state",
      "stateName",
      "state_name",
      "State Name",
      "Sate", // the typo you mentioned
      "SateName",
    ];
    for (const k of candidates) {
      if (typeof src?.[k] === "string" && src[k].trim()) return src[k].trim();
    }
    // sometimes StateCode contains readable name
    if (src?.StateCode && typeof src.StateCode === "string" && src.StateCode.trim()) return src.StateCode.trim();
    return "";
  }

  function extractDistrictName(src: any): string {
    const candidates = [
      "Districts",
      "District",
      "DistrictName",
      "districts",
      "district",
      "districtName",
      "district_name",
      "Districts Name",
      "DistrictsName",
    ];
    for (const k of candidates) {
      if (typeof src?.[k] === "string" && src[k].trim()) return src[k].trim();
    }
    // fallback to DistrictCode if it's human-readable
    if (src?.DistrictCode && typeof src.DistrictCode === "string" && src.DistrictCode.trim()) return src.DistrictCode.trim();
    return "";
  }

  const displayedState = extractStateName(initialData) || extractStateName(local) || "";
  const displayedDistrict = extractDistrictName(initialData) || extractDistrictName(local) || "";

  const imgSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return (imagePrefix ?? "") + p;
  };

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

        {/* ---------- READ-ONLY State (from RestroMaster) ---------- */}
        <div className="field">
          <label>State</label>
          <div>
            <input
              readOnly
              value={displayedState || ""}
              placeholder="(State from RestroMaster)"
              onChange={() => {}}
            />
          </div>
        </div>

        {/* ---------- READ-ONLY District (from RestroMaster) ---------- */}
        <div className="field">
          <label>District</label>
          <div>
            <input
              readOnly
              value={displayedDistrict || ""}
              placeholder="(District from RestroMaster)"
              onChange={() => {}}
            />
          </div>
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

        <div className="field">
          <label>Display Preview</label>
          {local.RestroDisplayPhoto ? (
            <img src={imgSrc(local.RestroDisplayPhoto)} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div className="readonly">No image</div>
          )}
        </div>
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
        .preview {
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        .readonly {
          padding: 8px 10px;
          border-radius: 6px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          font-size: 13px;
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
