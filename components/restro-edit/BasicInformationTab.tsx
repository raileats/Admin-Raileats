// components/restro-edit/BasicInformationTab.tsx
import React from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local?: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
};

export default function BasicInformationTab({ local = {}, updateField, stationDisplay = "" }: Props) {
  return (
    <TabContainer title="Basic Information" kicker="Basic Information">
      <div className="form-grid">
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
          <input className="input" value={local?.RestroName ?? ""} onChange={(e) => updateField("RestroName", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Brand Name</div>
          <input className="input" value={local?.BrandName ?? ""} onChange={(e) => updateField("BrandName", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Raileats Status</div>
          <select className="input" value={local?.Raileats ? 1 : 0} onChange={(e) => updateField("Raileats", Number(e.target.value) === 1)}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
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
            <img src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div className="readonly">No image</div>
          )}
        </div>

        <div className="field">
          <div className="label">Owner Name</div>
          <input className="input" value={local?.OwnerName ?? ""} onChange={(e) => updateField("OwnerName", e.target.value)} />
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

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 1100px) { .form-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } }

        .field { display:flex; flex-direction:column; }
        .label { font-size: 0.875rem; font-weight: 700; color: var(--muted, #6b7280); margin-bottom: 8px; }
        .input { padding:10px 12px; height:44px; border-radius:8px; border:1px solid var(--border, #e6e6e6); font-size:1rem; }
        .readonly { padding:10px 12px; border-radius:8px; background:var(--soft-bg,#fbfdff); border:1px solid #f3f3f3; }
        .preview { height:80px; object-fit:cover; border-radius:6px; border:1px solid #eee; }
      `}</style>
    </TabContainer>
  );
}
