// components/tabs/BasicInfoClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData: any;
  imagePrefix?: string;
};

export default function BasicInfoClient({ initialData, imagePrefix = "" }: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({
    RestroCode: initialData?.RestroCode ?? "",
    OwnerName: initialData?.OwnerName ?? "",
    StationCode: initialData?.StationCode ?? "",
    StationName: initialData?.StationName ?? "",
    OwnerEmail: initialData?.OwnerEmail ?? "",
    RestroName: initialData?.RestroName ?? "",
    OwnerPhone: initialData?.OwnerPhone ?? "",
    BrandNameifAny: initialData?.BrandNameifAny ?? "",
    RestroEmail: initialData?.RestroEmail ?? "",
    RestroPhone: initialData?.RestroPhone ?? "",
    IRCTCStatus: initialData?.IRCTCStatus ?? 0,
    RaileatsStatus: initialData?.RaileatsStatus ?? 0,
    IsIrctcApproved: initialData?.IsIrctcApproved ?? "0",
    RestroRating: initialData?.RestroRating ?? "",
    IsPureVeg: initialData?.IsPureVeg ?? 0,
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiryDate: initialData?.FSSAIExpiryDate ?? "",
    State: initialData?.State ?? initialData?.StationState ?? "",
  });

  useEffect(() => {
    setLocal((p: any) => ({
      ...p,
      RestroCode: initialData?.RestroCode ?? p.RestroCode,
      OwnerName: initialData?.OwnerName ?? p.OwnerName,
      StationCode: initialData?.StationCode ?? p.StationCode,
      StationName: initialData?.StationName ?? p.StationName,
      OwnerEmail: initialData?.OwnerEmail ?? p.OwnerEmail,
      RestroName: initialData?.RestroName ?? p.RestroName,
      OwnerPhone: initialData?.OwnerPhone ?? p.OwnerPhone,
      BrandNameifAny: initialData?.BrandNameifAny ?? p.BrandNameifAny,
      RestroEmail: initialData?.RestroEmail ?? p.RestroEmail,
      RestroPhone: initialData?.RestroPhone ?? p.RestroPhone,
      IRCTCStatus: initialData?.IRCTCStatus ?? p.IRCTCStatus,
      RaileatsStatus: initialData?.RaileatsStatus ?? p.RaileatsStatus,
      IsIrctcApproved: initialData?.IsIrctcApproved ?? p.IsIrctcApproved,
      RestroRating: initialData?.RestroRating ?? p.RestroRating,
      IsPureVeg: initialData?.IsPureVeg ?? p.IsPureVeg,
      RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? p.RestroDisplayPhoto,
      FSSAINumber: initialData?.FSSAINumber ?? p.FSSAINumber,
      FSSAIExpiryDate: initialData?.FSSAIExpiryDate ?? p.FSSAIExpiryDate,
      State: initialData?.State ?? initialData?.StationState ?? p.State ?? "",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
    setMsg(null);
    setErr(null);
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const id = encodeURIComponent(String(local.RestroCode));
      const payload: Record<string, any> = {
        RestroName: local.RestroName,
        OwnerName: local.OwnerName,
        StationCode: local.StationCode, // sending station code as part of payload
        StationName: local.StationName,
        OwnerPhone: local.OwnerPhone,
        OwnerEmail: local.OwnerEmail,
        BrandNameifAny: local.BrandNameifAny,
        RestroEmail: local.RestroEmail,
        RestroPhone: local.RestroPhone,
        IRCTCStatus: local.IRCTCStatus ? Number(local.IRCTCStatus) : 0,
        RaileatsStatus: local.RaileatsStatus ? Number(local.RaileatsStatus) : 0,
        IsIrctcApproved: String(local.IsIrctcApproved) ?? "0",
        RestroRating: local.RestroRating === "" ? null : Number(local.RestroRating),
        IsPureVeg: local.IsPureVeg ? 1 : 0,
        RestroDisplayPhoto: local.RestroDisplayPhoto,
        FSSAINumber: local.FSSAINumber,
        FSSAIExpiryDate: local.FSSAIExpiryDate,
        State: local.State ?? null,
      };

      const res = await fetch(`/api/restros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? `Save failed (${res.status})`);
      }

      setMsg("Saved successfully");
      router.refresh();
    } catch (e: any) {
      console.error("Save error:", e);
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const imgSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return (imagePrefix ?? "") + p;
  };

  // --- Compose Station display as "StationName (StationCode) - State"
  const getStationDisplay = () => {
    // If API already included a full display string, prefer it
    const fullCandidates = [
      initialData?.StationDisplay,
      initialData?.StationFullName,
      initialData?.StationFull,
      initialData?.StationNameFull,
      initialData?.StationName, // sometimes the API stores full
    ];
    for (const c of fullCandidates) {
      if (c && typeof c === "string" && c.trim()) {
        // if it already contains parentheses or a dash, assume it's full; still trim
        return c.trim();
      }
    }

    const stationName = (initialData?.StationName ?? local.StationName ?? "").toString().trim();
    const stationCode = (initialData?.StationCode ?? local.StationCode ?? "").toString().trim();
    // state may be under different keys - try a few
    const stateName =
      (initialData?.State ?? initialData?.StationState ?? initialData?.StateName ?? local.State ?? "").toString().trim();

    const leftParts: string[] = [];
    if (stationName) leftParts.push(stationName);
    if (stationCode) leftParts.push(`(${stationCode})`);

    const left = leftParts.join(" ");
    if (left && stateName) return `${left} - ${stateName}`;
    if (left) return left;
    if (stateName) return stateName;
    return "—";
  };

  const stationDisplay = getStationDisplay();

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ textAlign: "center", marginBottom: 18, fontSize: 20 }}>Basic Information</h3>

      {/* compact multi-column form */}
      <div className="compact-grid">
        <div className="field">
          <label>Station</label>
          <div className="readonly">{stationDisplay}</div>
        </div>

        <div className="field">
          <label>Restro Code</label>
          <div className="readonly">{local.RestroCode ?? "—"}</div>
        </div>

        <div className="field">
          <label>Restro Name</label>
          <input value={local.RestroName ?? ""} onChange={(e) => update("RestroName", e.target.value)} />
        </div>

        <div className="field">
          <label>Brand Name</label>
          <input value={local.BrandNameifAny ?? ""} onChange={(e) => update("BrandNameifAny", e.target.value)} />
        </div>

        <div className="field">
          <label>Raileats Status</label>
          <select value={String(local.RaileatsStatus ?? 0)} onChange={(e) => update("RaileatsStatus", Number(e.target.value))}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </div>

        <div className="field">
          <label>IRCTC Status</label>
          <select value={String(local.IRCTCStatus ?? 0)} onChange={(e) => update("IRCTCStatus", Number(e.target.value))}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </div>

        <div className="field">
          <label>Is IRCTC Approved</label>
          <select value={String(local.IsIrctcApproved ?? "0")} onChange={(e) => update("IsIrctcApproved", e.target.value)}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </div>

        <div className="field">
          <label>Restro Rating</label>
          <input type="number" step="0.1" value={local.RestroRating ?? ""} onChange={(e) => update("RestroRating", e.target.value)} />
        </div>

        <div className="field">
          <label>Restro Display Photo (path)</label>
          <input value={local.RestroDisplayPhoto ?? ""} onChange={(e) => update("RestroDisplayPhoto", e.target.value)} />
        </div>

        <div className="field">
          <label>Display Preview</label>
          {local.RestroDisplayPhoto ? <img src={imgSrc(local.RestroDisplayPhoto)} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : <div className="readonly">No image</div>}
        </div>

        <div className="field">
          <label>Owner Name</label>
          <input value={local.OwnerName ?? ""} onChange={(e) => update("OwnerName", e.target.value)} />
        </div>

        <div className="field">
          <label>Owner Email</label>
          <input value={local.OwnerEmail ?? ""} onChange={(e) => update("OwnerEmail", e.target.value)} />
        </div>

        <div className="field">
          <label>Owner Phone</label>
          <input value={local.OwnerPhone ?? ""} onChange={(e) => update("OwnerPhone", e.target.value)} />
        </div>

        <div className="field">
          <label>Restro Email</label>
          <input value={local.RestroEmail ?? ""} onChange={(e) => update("RestroEmail", e.target.value)} />
        </div>

        <div className="field">
          <label>Restro Phone</label>
          <input value={local.RestroPhone ?? ""} onChange={(e) => update("RestroPhone", e.target.value)} />
        </div>

        <div className="field">
          <label>Is Pure Veg</label>
          <select value={String(local.IsPureVeg ?? 0)} onChange={(e) => update("IsPureVeg", Number(e.target.value))}>
            <option value={1}>Yes</option>
            <option value={0}>No</option>
          </select>
        </div>

        <div className="field">
          <label>FSSAI Number</label>
          <input value={local.FSSAINumber ?? ""} onChange={(e) => update("FSSAINumber", e.target.value)} />
        </div>

        <div className="field">
          <label>FSSAI Expiry Date</label>
          <input type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => update("FSSAIExpiryDate", e.target.value)} />
        </div>
      </div>

      <div className="actions">
        <button className="btn-cancel" onClick={() => router.push("/admin/restros")} disabled={saving}>Cancel</button>
        <button className="btn-save" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      </div>

      {msg && <div className="msg ok">{msg}</div>}
      {err && <div className="msg err">{err}</div>}

      <style jsx>{`
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .field label {
          display: block;
          font-size: 13px;
          color: #444;
          margin-bottom: 6px;
          font-weight: 600;
        }
        .field input, .field select {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          font-size: 13px;
          background: #fff;
          box-sizing: border-box;
        }
        .readonly {
          padding: 8px 10px;
          border-radius: 6px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          font-size: 13px;
        }
        .preview {
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        .actions {
          max-width: 1100px;
          margin: 18px auto 0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn-cancel {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #ddd;
          background: #fff;
          cursor: pointer;
        }
        .btn-save {
          padding: 8px 12px;
          border-radius: 6px;
          border: none;
          background: #0ea5e9;
          color: #fff;
          cursor: pointer;
        }
        .msg { max-width: 1100px; margin: 10px auto; font-size: 13px; }
        .msg.ok { color: green; }
        .msg.err { color: red; }

        @media (max-width: 1100px) {
          .compact-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 720px) {
          .compact-grid { grid-template-columns: 1fr; }
          .actions { padding: 0 12px; }
        }
      `}</style>
    </div>
  );
}
