// components/restro-edit/BasicInformationTab.tsx
"use client";
import React from "react";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({ local = {}, updateField, stationDisplay = "", stations = [], loadingStations = false }: Props) {
  return (
    <div className="tab-container" style={{ padding: 24 }}>
      {/* Centered small heading */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#0b1220" }}>Basic Information</div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        <div className="field">
          <div className="label">Station</div>
          <input className="input" value={local.StationName ?? ""} readOnly />
        </div>

        <div className="field">
          <div className="label">Restro Code</div>
          <input className="input" value={local.RestroCode ?? ""} readOnly />
        </div>

        <div className="field">
          <div className="label">Restro Name</div>
          <input className="input" value={local.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Brand Name</div>
          <input className="input" value={local.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Raileats Status</div>
          <select className="input" value={local.RaileatsStatus ?? local.RaileatsStatus ?? "Off"} onChange={(e) => updateField("RaileatsStatus", e.target.value)}>
            <option>Off</option>
            <option>On</option>
          </select>
        </div>

        <div className="field">
          <div className="label">Is IRCTC Approved</div>
          <select className="input" value={local.IsIRCTCApproved ?? "Yes"} onChange={(e) => updateField("IsIRCTCApproved", e.target.value)}>
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>

        <div className="field">
          <div className="label">Restro Rating</div>
          <input className="input" value={local.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Restro Display Photo (path)</div>
          <input className="input" value={local.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Display Preview</div>
          <div className="readonly" style={{ minHeight: 54 }}>{/* preview placeholder */}</div>
        </div>

        <div className="field">
          <div className="label">Owner Name</div>
          <input className="input" value={local.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Owner Email</div>
          <input className="input" value={local.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Owner Phone</div>
          <input className="input" value={local.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} />
        </div>

        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <div className="label">Restro Email</div>
          <input className="input" value={local.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} />
        </div>

        {/* Add other basic fields as needed but DO NOT include FSSAI or GST here */}
      </div>
    </div>
  );
}
