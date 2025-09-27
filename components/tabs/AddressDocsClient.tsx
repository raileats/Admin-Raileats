// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  initialData?: any;
  imagePrefix?: string;
};

export default function AddressDocsClient({ initialData = {}, imagePrefix = "" }: Props) {
  // tolerant getters for state/district fields from RestroMaster row
  const getStateValue = (row: any) => {
    // try common variants (Sate typo, State, StateName, "State Name")
    return (
      row?.State ??
      row?.StateName ??
      row?.State_Code ??
      row?.StateCode ??
      row?.Sate ?? // accidental typo you mentioned
      row?.["State Name"] ??
      row?.["State"] ??
      ""
    );
  };

  const getDistrictValue = (row: any) => {
    // try many variants: Districts, District, DistrictName, "Districts", "District Name"
    const d =
      row?.Districts ??
      row?.District ??
      row?.DistrictName ??
      row?.DistrictsName ??
      row?.["Districts"] ??
      row?.["District Name"] ??
      row?.["District"] ??
      "";
    // if Districts is an array stored as JSON string, try parse
    if (typeof d === "string") {
      try {
        const parsed = JSON.parse(d);
        if (Array.isArray(parsed)) {
          // map to comma separated names if needed
          return parsed.map((x) => (typeof x === "object" ? x.name ?? x : x)).join(", ");
        }
      } catch (e) {
        // not JSON -> keep string
      }
    }
    if (Array.isArray(d)) {
      return d.map((x) => (typeof x === "object" ? x.name ?? x : x)).join(", ");
    }
    return d ?? "";
  };

  const [local, setLocal] = useState({
    RestroAddress: initialData?.RestroAddress ?? initialData?.Address ?? "",
    City: initialData?.City ?? initialData?.CityName ?? "",
    PinCode: initialData?.PinCode ?? initialData?.Pincode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? initialData?.FSSAI ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? initialData?.GSTno ?? "",
    GSTType: initialData?.GSTType ?? "",
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? "",
    StateValue: getStateValue(initialData),
    DistrictValue: getDistrictValue(initialData),
  });

  // keep local in sync if initialData changes (server-side)
  useEffect(() => {
    setLocal((prev) => ({
      ...prev,
      RestroAddress: initialData?.RestroAddress ?? initialData?.Address ?? prev.RestroAddress,
      City: initialData?.City ?? initialData?.CityName ?? prev.City,
      PinCode: initialData?.PinCode ?? initialData?.Pincode ?? prev.PinCode,
      Latitude: initialData?.Latitude ?? prev.Latitude,
      Longitude: initialData?.Longitude ?? prev.Longitude,
      FSSAINumber: initialData?.FSSAINumber ?? initialData?.FSSAI ?? prev.FSSAINumber,
      FSSAIExpiry: initialData?.FSSAIExpiry ?? prev.FSSAIExpiry,
      GSTNumber: initialData?.GSTNumber ?? initialData?.GSTno ?? prev.GSTNumber,
      GSTType: initialData?.GSTType ?? prev.GSTType,
      RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? prev.RestroDisplayPhoto,
      StateValue: getStateValue(initialData),
      DistrictValue: getDistrictValue(initialData),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

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
          <textarea value={local.RestroAddress ?? ""} readOnly />
        </div>

        <div className="field">
          <label>City / Village</label>
          <input value={local.City ?? ""} readOnly />
        </div>

        <div className="field">
          <label>State</label>
          <div>
            {/* Non-editable display */}
            <input value={local.StateValue ?? ""} readOnly />
          </div>
        </div>

        <div className="field">
          <label>District</label>
          <div>
            {/* Non-editable display */}
            <input value={local.DistrictValue ?? ""} readOnly />
          </div>
        </div>

        <div className="field">
          <label>Pin Code</label>
          <input value={local.PinCode ?? ""} readOnly />
        </div>

        <div className="field">
          <label>Latitude</label>
          <input value={local.Latitude ?? ""} readOnly />
        </div>

        <div className="field">
          <label>Longitude</label>
          <input value={local.Longitude ?? ""} readOnly />
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="compact-grid">
        <div className="field">
          <label>FSSAI Number</label>
          <input value={local.FSSAINumber ?? ""} readOnly />
        </div>

        <div className="field">
          <label>FSSAI Expiry</label>
          <input type="date" value={local.FSSAIExpiry ?? ""} readOnly />
        </div>

        <div className="field">
          <label>GST Number</label>
          <input value={local.GSTNumber ?? ""} readOnly />
        </div>

        <div className="field">
          <label>GST Type</label>
          <input value={local.GSTType ?? ""} readOnly />
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
          background: #f9f9f9;
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
