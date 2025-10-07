// components/restro-edit/BasicInformationTab.tsx
"use client";
import React from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k:string, v:any) => void;
  stationDisplay: string;
  InputWithIcon?: any;
};

export default function BasicInformationTab({ local, updateField, stationDisplay, InputWithIcon }: Props) {
  const Input = InputWithIcon ?? (({ value, onChange, ...rest }: any) => (
    <input className="restro-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
  ));

  return (
    <TabContainer title="Basic Information">
      <div className="restro-grid">
        <div className="field">
          <label className="restro-label">Station</label>
          <div className="restro-readonly">{stationDisplay}</div>
        </div>

        <div className="field">
          <label className="restro-label">Restro Code</label>
          <div className="restro-readonly">{local?.RestroCode ?? "—"}</div>
        </div>

        <div className="field">
          <label className="restro-label">Restro Name</label>
          <Input value={local?.RestroName ?? ""} onChange={(v:any) => updateField("RestroName", v)} />
        </div>

        <div className="field">
          <label className="restro-label">Brand Name</label>
          <Input value={local?.BrandName ?? ""} onChange={(v:any) => updateField("BrandName", v)} />
        </div>

        <div className="field">
          <label className="restro-label">Raileats Status</label>
          <select className="restro-input" value={local?.Raileats ? "1" : "0"} onChange={(e)=>updateField("Raileats", e.target.value==="1")}>
            <option value="1">On</option><option value="0">Off</option>
          </select>
        </div>

        <div className="field">
          <label className="restro-label">Is IRCTC Approved</label>
          <select className="restro-input" value={local?.IsIrctcApproved ? "1":"0"} onChange={(e)=>updateField("IsIrctcApproved", e.target.value==="1")}>
            <option value="1">Yes</option><option value="0">No</option>
          </select>
        </div>

        <div className="field">
          <label className="restro-label">Restro Rating</label>
          <input className="restro-input" type="number" step="0.1" value={local?.RestroRating ?? ""} onChange={(e)=>updateField("RestroRating", e.target.value)} />
        </div>

        <div className="field">
          <label className="restro-label">Restro Display Photo (path)</label>
          <input className="restro-input" value={local?.RestroDisplayPhoto ?? ""} onChange={(e)=>updateField("RestroDisplayPhoto", e.target.value)} />
        </div>

        <div className="field">
          <label className="restro-label">Display Preview</label>
          {local?.RestroDisplayPhoto ? (
            <img src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto} alt="display" style={{height:80, objectFit:'cover', borderRadius:6}} onError={(e)=>((e.target as HTMLImageElement).style.display='none')} />
          ) : <div className="restro-readonly">No image</div>}
        </div>

        <div className="field"><label className="restro-label">Owner Name</label><input className="restro-input" value={local?.OwnerName ?? ""} onChange={(e)=>updateField("OwnerName", e.target.value)} /></div>
        <div className="field"><label className="restro-label">Owner Email</label><input className="restro-input" value={local?.OwnerEmail ?? ""} onChange={(e)=>updateField("OwnerEmail", e.target.value)} /></div>
        <div className="field"><label className="restro-label">Owner Phone</label><input className="restro-input" value={local?.OwnerPhone ?? ""} onChange={(e)=>updateField("OwnerPhone", e.target.value)} /></div>
        <div className="field"><label className="restro-label">Restro Email</label><input className="restro-input" value={local?.RestroEmail ?? ""} onChange={(e)=>updateField("RestroEmail", e.target.value)} /></div>
        <div className="field"><label className="restro-label">Restro Phone</label><input className="restro-input" value={local?.RestroPhone ?? ""} onChange={(e)=>updateField("RestroPhone", e.target.value)} /></div>
        <div className="field"><label className="restro-label">FSSAI Number</label><input className="restro-input" value={local?.FSSAINumber ?? ""} onChange={(e)=>updateField("FSSAINumber", e.target.value)} /></div>
        <div className="field"><label className="restro-label">FSSAI Expiry Date</label><input className="restro-input" type="date" value={local?.FSSAIExpiryDate ?? ""} onChange={(e)=>updateField("FSSAIExpiryDate", e.target.value)} /></div>
      </div>
    </TabContainer>
  );
}
