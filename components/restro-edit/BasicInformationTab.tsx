// components/restro-edit/BasicInformationTab.tsx
"use client";

import React, { useCallback } from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({ local = {}, updateField, stationDisplay }: Props) {
  const sanitizePhone = useCallback((raw: any) => {
    if (raw === undefined || raw === null) return "";
    return String(raw).replace(/\D/g, "").slice(0, 10);
  }, []);

  return (
    <TabContainer title="Basic Information">
      <div className="restro-grid">
        <div>
          <label className="restro-label">Station</label>
          <div className="readonly" style={{ padding: 10 }}>{stationDisplay || "—"}</div>
        </div>

        <div>
          <label className="restro-label">Restro Code</label>
          <div className="readonly" style={{ padding: 10 }}>{local?.RestroCode ?? "—"}</div>
        </div>

        <div>
          <label className="restro-label">Restro Name</label>
          <input className="restro-input" value={local?.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Brand Name</label>
          <input className="restro-input" value={local?.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Raileats Status</label>
          <select className="restro-input" value={local?.Raileats ? "1" : "0"} onChange={(e) => updateField("Raileats", e.target.value === "1")}>
            <option value="1">On</option>
            <option value="0">Off</option>
          </select>
        </div>

        <div>
          <label className="restro-label">Is IRCTC Approved</label>
          <select className="restro-input" value={local?.IsIrctcApproved ? "1" : "0"} onChange={(e) => updateField("IsIrctcApproved", e.target.value === "1")}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <div>
          <label className="restro-label">Restro Rating</label>
          <input className="restro-input" type="number" step="0.1" value={local?.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Restro Display Photo (path)</label>
          <input className="restro-input" value={local?.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Display Preview</label>
          {local?.RestroDisplayPhoto ? (
            // image prefix from env if present
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto}
              alt="display"
              className="preview"
              style={{ height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="readonly">No image</div>
          )}
        </div>

        <div>
          <label className="restro-label">Owner Name</label>
          <input className="restro-input" value={local?.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Owner Email</label>
          <input className="restro-input" value={local?.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Owner Phone</label>
          <input
            className="restro-input"
            value={local?.OwnerPhone ?? ""}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) => updateField("OwnerPhone", sanitizePhone(e.target.value))}
          />
        </div>

        <div>
          <label className="restro-label">Restro Email</label>
          <input className="restro-input" value={local?.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Restro Phone</label>
          <input
            className="restro-input"
            value={local?.RestroPhone ?? ""}
            inputMode="numeric"
            maxLength={10}
            onChange={(e) => updateField("RestroPhone", sanitizePhone(e.target.value))}
          />
        </div>

        <div>
          <label className="restro-label">FSSAI Number</label>
          <input className="restro-input" value={local?.FSSAINumber ?? ""} onChange={(e) => updateField("FSSAINumber", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">FSSAI Expiry Date</label>
          <input className="restro-input" type="date" value={local?.FSSAIExpiryDate ?? ""} onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)} />
        </div>

        {/* full width note row */}
        <div className="restro-row-full">
          <div className="restro-note">Fields: Owner/Restro phones are sanitized to digits and truncated to 10 characters automatically.</div>
        </div>
      </div>

      <style jsx>{`
        /* keep preview styling consistent if needed */
        .preview { display: inline-block; }
        @media (max-width:1100px) { .restro-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width:720px) { .restro-grid { grid-template-columns: 1fr; } }
      `}</style>
    </TabContainer>
  );
}
