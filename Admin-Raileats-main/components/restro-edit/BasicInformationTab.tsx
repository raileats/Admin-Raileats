// components/restro-edit/BasicInformationTab.tsx
import React from "react";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function BasicInformationTab({ local, updateField, stationDisplay }: Props) {
  return (
    <div>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Basic Information</h3>

      <div className="compact-grid" style={{ maxWidth: 1200, margin: "8px auto" }}>
        <div className="field">
          <label>Station</label>
          <div className="readonly">{stationDisplay}</div>
        </div>

        <div className="field">
          <label>Restro Code</label>
          <div className="readonly">{local?.RestroCode ?? "—"}</div>
        </div>

        <div className="field">
          <label>Restro Name</label>
          <input value={local?.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} />
        </div>

        <div className="field">
          <label>Brand Name</label>
          <input value={local?.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} />
        </div>

        <div className="field">
          <label>Raileats Status</label>
          <select value={local?.Raileats ? 1 : 0} onChange={(e) => updateField("Raileats", Number(e.target.value) === 1)}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </div>

        <div className="field">
          <label>Is IRCTC Approved</label>
          <select value={local?.IsIrctcApproved ? "1" : "0"} onChange={(e) => updateField("IsIrctcApproved", e.target.value === "1")}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <div className="field">
          <label>Restro Rating</label>
          <input type="number" step="0.1" value={local?.RestroRating ?? ""} onChange={(e) => updateField("RestroRating", e.target.value)} />
        </div>

        <div className="field">
          <label>Restro Display Photo (path)</label>
          <input value={local?.RestroDisplayPhoto ?? ""} onChange={(e) => updateField("RestroDisplayPhoto", e.target.value)} />
        </div>

        <div className="field">
          <label>Display Preview</label>
          {local?.RestroDisplayPhoto ? (
            <img src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div className="readonly">No image</div>
          )}
        </div>

        <div className="field">
          <label>Owner Name</label>
          <input value={local?.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} />
        </div>

        <div className="field">
          <label>Owner Email</label>
          <input value={local?.OwnerEmail ?? ""} onChange={(e) => updateField("OwnerEmail", e.target.value)} />
        </div>

        <div className="field">
          <label>Owner Phone</label>
          <input value={local?.OwnerPhone ?? ""} onChange={(e) => updateField("OwnerPhone", e.target.value)} />
        </div>

        <div className="field">
          <label>Restro Email</label>
          <input value={local?.RestroEmail ?? ""} onChange={(e) => updateField("RestroEmail", e.target.value)} />
        </div>

        <div className="field">
          <label>Restro Phone</label>
          <input value={local?.RestroPhone ?? ""} onChange={(e) => updateField("RestroPhone", e.target.value)} />
        </div>

        <div className="field">
          <label>FSSAI Number</label>
          <input value={local?.FSSAINumber ?? ""} onChange={(e) => updateField("FSSAINumber", e.target.value)} />
        </div>

        <div className="field">
          <label>FSSAI Expiry Date</label>
          <input type="date" value={local?.FSSAIExpiryDate ?? ""} onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)} />
        </div>
      </div>

      <style jsx>{`
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
        }
        .field label { display: block; font-weight: 600; margin-bottom: 6px; color: #444; }
        .field input, .field select { width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #e3e3e3; }
        .readonly { padding: 8px 10px; background: #fafafa; border-radius: 6px; border: 1px solid #f0f0f0; }
        .preview { height: 80px; object-fit: cover; border-radius: 6px; border: 1px solid #eee; }
        @media (max-width: 1100px) { .compact-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 720px) { .compact-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
