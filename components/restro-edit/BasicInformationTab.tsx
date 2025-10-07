// components/restro-edit/BasicInformationTab.tsx
"use client";
import React from "react";
import TabContainer from "@/components/TabContainer";

type CommonProps = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  InputWithIcon?: any;
};

export default function BasicInformationTab({ local = {}, updateField, stationDisplay = "", InputWithIcon }: CommonProps) {
  const Input = InputWithIcon ?? (({ label, value, onChange, type = "text" }: any) => (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</div>}
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #e6eef6",
          background: "#fbfdff",
          outline: "none",
          fontSize: 14,
        }}
      />
    </div>
  ));

  return (
    <TabContainer title="Basic Information" subtitle="">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Station</label>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fcfdfe", border: "1px solid #f1f5f9" }}>{stationDisplay}</div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Restro Code</label>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fcfdfe", border: "1px solid #f1f5f9" }}>{local?.RestroCode ?? "—"}</div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Restro Name</label>
          <Input label="" value={local?.RestroName ?? ""} onChange={(v: any) => updateField("RestroName", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Brand Name</label>
          <Input label="" value={local?.BrandName ?? ""} onChange={(v: any) => updateField("BrandName", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Raileats Status</label>
          <select
            value={local?.Raileats ? 1 : 0}
            onChange={(e) => updateField("Raileats", Number(e.target.value) === 1)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}
          >
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Is IRCTC Approved</label>
          <select
            value={local?.IsIrctcApproved ? "1" : "0"}
            onChange={(e) => updateField("IsIrctcApproved", e.target.value === "1")}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}
          >
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Restro Rating</label>
          <Input label="" value={local?.RestroRating ?? ""} onChange={(v: any) => updateField("RestroRating", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Restro Display Photo (path)</label>
          <Input label="" value={local?.RestroDisplayPhoto ?? ""} onChange={(v: any) => updateField("RestroDisplayPhoto", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Display Preview</label>
          {local?.RestroDisplayPhoto ? (
            <img
              src={(process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? "") + local.RestroDisplayPhoto}
              alt="display"
              style={{ height: 84, objectFit: "cover", borderRadius: 8, border: "1px solid #eef2f6" }}
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div style={{ padding: 12, borderRadius: 8, background: "#fbfdff", border: "1px solid #f1f5f9", color: "#9aa4b2" }}>No image</div>
          )}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Owner Name</label>
          <Input label="" value={local?.OwnerName ?? ""} onChange={(v: any) => updateField("OwnerName", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Owner Email</label>
          <Input label="" value={local?.OwnerEmail ?? ""} onChange={(v: any) => updateField("OwnerEmail", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Owner Phone</label>
          <Input label="" value={local?.OwnerPhone ?? ""} onChange={(v: any) => updateField("OwnerPhone", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Restro Email</label>
          <Input label="" value={local?.RestroEmail ?? ""} onChange={(v: any) => updateField("RestroEmail", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Restro Phone</label>
          <Input label="" value={local?.RestroPhone ?? ""} onChange={(v: any) => updateField("RestroPhone", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>FSSAI Number</label>
          <Input label="" value={local?.FSSAINumber ?? ""} onChange={(v: any) => updateField("FSSAINumber", v)} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>FSSAI Expiry Date</label>
          <input
            type="date"
            value={local?.FSSAIExpiryDate ?? ""}
            onChange={(e) => updateField("FSSAIExpiryDate", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}
          />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) {
          div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 720px) {
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </TabContainer>
  );
}
