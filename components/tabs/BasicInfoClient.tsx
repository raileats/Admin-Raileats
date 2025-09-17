// components/tabs/BasicInfoClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData: any;
  imagePrefix?: string;
};

function getFieldCaseInsensitive(obj: any, candidates: string[]) {
  if (!obj) return undefined;
  const keys = Object.keys(obj);
  for (const cand of candidates) {
    // exact match first
    if (obj[cand] !== undefined && obj[cand] !== null) return obj[cand];
    // case-insensitive / underscore variants
    const normalized = cand.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    for (const k of keys) {
      if (k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === normalized) {
        return obj[k];
      }
    }
  }
  return undefined;
}

export default function BasicInfoClient({ initialData, imagePrefix = "" }: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({
    RestroCode: initialData?.RestroCode ?? initialData?.restro_code ?? "",
    OwnerName: initialData?.OwnerName ?? initialData?.owner_name ?? "",
    StationCode: initialData?.StationCode ?? initialData?.station_code ?? "",
    StationName: initialData?.StationName ?? initialData?.station_name ?? "",
    OwnerEmail: initialData?.OwnerEmail ?? initialData?.owner_email ?? "",
    RestroName: initialData?.RestroName ?? initialData?.restro_name ?? "",
    OwnerPhone: initialData?.OwnerPhone ?? initialData?.owner_phone ?? "",
    BrandNameifAny: initialData?.BrandNameifAny ?? initialData?.brand_name ?? "",
    RestroEmail: initialData?.RestroEmail ?? initialData?.restro_email ?? "",
    RestroPhone: initialData?.RestroPhone ?? initialData?.restro_phone ?? "",
    IRCTCStatus: initialData?.IRCTCStatus ?? initialData?.irctc ?? 0,
    RaileatsStatus: initialData?.RaileatsStatus ?? initialData?.raileats ?? 0,
    IsIrctcApproved: initialData?.IsIrctcApproved ?? initialData?.is_irctc_approved ?? "0",
    RestroRating: initialData?.RestroRating ?? initialData?.restro_rating ?? "",
    IsPureVeg: initialData?.IsPureVeg ?? initialData?.is_pure_veg ?? 0,
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? initialData?.restro_display_photo ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? initialData?.fssai_number ?? "",
    FSSAIExpiryDate: initialData?.FSSAIExpiryDate ?? initialData?.fssai_expiry_date ?? "",
    State: getFieldCaseInsensitive(initialData, ["State", "state", "state_name", "StateName", "StationState"]) ?? "",
  });

  useEffect(() => {
    setLocal((p: any) => ({
      ...p,
      RestroCode: initialData?.RestroCode ?? initialData?.restro_code ?? p.RestroCode,
      OwnerName: initialData?.OwnerName ?? initialData?.owner_name ?? p.OwnerName,
      StationCode: initialData?.StationCode ?? initialData?.station_code ?? p.StationCode,
      StationName: initialData?.StationName ?? initialData?.station_name ?? p.StationName,
      OwnerEmail: initialData?.OwnerEmail ?? initialData?.owner_email ?? p.OwnerEmail,
      RestroName: initialData?.RestroName ?? initialData?.restro_name ?? p.RestroName,
      OwnerPhone: initialData?.OwnerPhone ?? initialData?.owner_phone ?? p.OwnerPhone,
      BrandNameifAny: initialData?.BrandNameifAny ?? initialData?.brand_name ?? p.BrandNameifAny,
      RestroEmail: initialData?.RestroEmail ?? initialData?.restro_email ?? p.RestroEmail,
      RestroPhone: initialData?.RestroPhone ?? initialData?.restro_phone ?? p.RestroPhone,
      IRCTCStatus: initialData?.IRCTCStatus ?? initialData?.irctc ?? p.IRCTCStatus,
      RaileatsStatus: initialData?.RaileatsStatus ?? initialData?.raileats ?? p.RaileatsStatus,
      IsIrctcApproved: initialData?.IsIrctcApproved ?? initialData?.is_irctc_approved ?? p.IsIrctcApproved,
      RestroRating: initialData?.RestroRating ?? initialData?.restro_rating ?? p.RestroRating,
      IsPureVeg: initialData?.IsPureVeg ?? initialData?.is_pure_veg ?? p.IsPureVeg,
      RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? initialData?.restro_display_photo ?? p.RestroDisplayPhoto,
      FSSAINumber: initialData?.FSSAINumber ?? initialData?.fssai_number ?? p.FSSAINumber,
      FSSAIExpiryDate: initialData?.FSSAIExpiryDate ?? initialData?.fssai_expiry_date ?? p.FSSAIExpiryDate,
      State: getFieldCaseInsensitive(initialData, ["State", "state", "state_name", "StateName", "StationState"]) ?? p.State ?? "",
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
        StationCode: local.StationCode,
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

  // Compose Station display: "StationName (StationCode) - State"
  const getStationDisplay = () => {
    // If API already returns a full-looking string, prefer that
    const rawFull = getFieldCaseInsensitive(initialData, [
      "StationDisplay",
      "StationFullName",
      "StationFull",
      "StationNameFull",
      "station_display",
      "station_full_name",
      "station_full",
      "stationName",
      "stationname",
    ]);
    if (rawFull && typeof rawFull === "string" && rawFull.trim()) {
      const s = rawFull.trim();
      // prefer strings that already contain "(" and ")" or " - " (looks like full)
      if (s.includes("(") || s.includes("-")) return s;
      // else still return trimmed s (safe)
      return s;
    }

    const stationName =
      (getFieldCaseInsensitive(initialData, ["StationName", "station_name", "stationName"]) ??
        local.StationName ??
        ""
      )
        .toString()
        .trim();
    const stationCode =
      (getFieldCaseInsensitive(initialData, ["StationCode", "station_code", "stationCode"]) ?? local.StationCode ?? "")
        .toString()
        .trim();
    const stateName =
      (getFieldCaseInsensitive(initialData, ["State", "state", "state_name", "station_state", "StateName"]) ?? local.State ?? "")
        .toString()
        .trim();

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
