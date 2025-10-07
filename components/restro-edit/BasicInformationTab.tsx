// components/restro-edit/BasicInformationTab.tsx
"use client";

import React from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({ local, updateField, stationDisplay }: Props) {
  return (
    <TabContainer kicker="Basic Information" title="Basic Information">
      <div className="form-grid" style={{ maxWidth: 1200, margin: "8px auto" }}>
        <div className="field">
          <div className="label">Station</div>
          <div className="readonly">{stationDisplay}</div>
        </div>

        <div className="field">
          <div className="label">Restro Code</div>
          <div className="readonly">{local?.RestroCode ?? "—"}</div>
        </div>

        <div className="field">
          <div className="label">Restro Name</div>
          <div className="input-with-icon">
            <span className="icon">👤</span>
            <input className="input" value={local?.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} />
          </div>
        </div>

        <div className="field">
          <div className="label">Brand Name</div>
          <div className="input-with-icon">
            <span className="icon">👤</span>
            <input className="input input-sm" value={local?.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} />
          </div>
        </div>

        <div className="field">
          <div className="label">Raileats Status</div>
          <select className="input" value={local?.Raileats ? "on" : "off"} onChange={(e) => updateField("Raileats", e.target.value === "on")}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div className="field">
          <div className="label">Is IRCTC Approved</div>
          <select className="input" value={local?.IsIrctcApproved ? "1" : "0"} onChange={(e) => updateField("IsIrctcApproved", e.target.value === "1")}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <div className="field">
          <div className="label">Restro Rating</div>
          <input className="input" type="number" step="0.1" value={local?.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Restro Display Photo (path)</div>
          <input className="input" value={local?.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Display Preview</div>
          {local?.RestroDisplayPhoto ? (
            // keep preview small
            <img src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto} alt="display" style={{ height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div className="readonly">No image</div>
          )}
        </div>

        <div className="field">
          <div className="label">Owner Name</div>
          <input className="input input-sm" value={local?.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Owner Email</div>
          <input className="input" value={local?.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Owner Phone</div>
          <input className="input" value={local?.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Restro Email</div>
          <input className="input" value={local?.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Restro Phone</div>
          <input className="input" value={local?.RestroPhone ?? ""} onChange={(e) => updateField("RestroPhone", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">FSSAI Number</div>
          <input className="input" value={local?.FSSAINumber ?? ""} onChange={(e) => updateField("FSSAINumber", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">FSSAI Expiry Date</div>
          <input className="input" type="date" value={local?.FSSAIExpiryDate ?? ""} onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)} />
        </div>
      </div>
    </TabContainer>
  );
}
