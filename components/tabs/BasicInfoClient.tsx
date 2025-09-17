"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initialData: any;
  imagePrefix?: string; // optional base URL for images (eg: https://xyz.supabase.co/storage/v1/object/public/restro/)
};

export default function BasicInfoClient({ initialData, imagePrefix = "" }: Props) {
  const router = useRouter();

  // initialize local state mapping to the actual column names you have in DB
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
  });

  useEffect(() => {
    // when initialData changes (server -> client) keep state in sync
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
      // Build payload using DB column names (whitelisted by your API)
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
        // flags: your DB uses 1/0 and IRCTCStatus/RaileatsStatus are numbers
        IRCTCStatus: local.IRCTCStatus ? Number(local.IRCTCStatus) : 0,
        RaileatsStatus: local.RaileatsStatus ? Number(local.RaileatsStatus) : 0,
        IsIrctcApproved: String(local.IsIrctcApproved) ?? "0",
        RestroRating: local.RestroRating === "" ? null : Number(local.RestroRating),
        IsPureVeg: local.IsPureVeg ? 1 : 0,
        RestroDisplayPhoto: local.RestroDisplayPhoto,
        FSSAINumber: local.FSSAINumber,
        FSSAIExpiryDate: local.FSSAIExpiryDate,
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
      // refresh server-side content (optional)
      router.refresh();
    } catch (e: any) {
      console.error("Save error:", e);
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // helper for building image src
  const imgSrc = (p: string) => {
    if (!p) return "";
    // if stored value already starts with http(s), return as-is
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    // otherwise, join with imagePrefix (if provided)
    return (imagePrefix ?? "") + p;
  };

  /* Small helper to render a label + field pair */
  function KVRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <>
        <div className="kv-label">{label}</div>
        <div className="kv-field">{children}</div>
      </>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ textAlign: "center", marginBottom: 12, fontSize: 20 }}>Basic Information</h3>

      <div className="kv-grid">
        <KVRow label="Restro Code">
          <div className="readonly-value">{local.RestroCode ?? "—"}</div>
        </KVRow>

        <KVRow label="Station Code with Name">
          <div className="readonly-value">({local.StationCode}) {local.StationName}</div>
        </KVRow>

        <KVRow label="Restro Name">
          <input className="kv-input" value={local.RestroName ?? ""} onChange={(e) => update("RestroName", e.target.value)} />
        </KVRow>

        <KVRow label="Brand Name if Any">
          <input className="kv-input" value={local.BrandNameifAny ?? ""} onChange={(e) => update("BrandNameifAny", e.target.value)} />
        </KVRow>

        <KVRow label="Raileats Status">
          <select className="kv-input" value={String(local.RaileatsStatus ?? 0)} onChange={(e) => update("RaileatsStatus", Number(e.target.value))}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </KVRow>

        <KVRow label="Is Irctc Approved">
          <select className="kv-input" value={String(local.IsIrctcApproved ?? "0")} onChange={(e) => update("IsIrctcApproved", e.target.value)}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
        </KVRow>

        <KVRow label="Restro Rating">
          <input className="kv-input" type="number" step="0.1" value={local.RestroRating ?? ""} onChange={(e) => update("RestroRating", e.target.value)} />
        </KVRow>

        <KVRow label="Restro Display Photo (path)">
          <input className="kv-input" value={local.RestroDisplayPhoto ?? ""} onChange={(e) => update("RestroDisplayPhoto", e.target.value)} />
        </KVRow>

        <KVRow label="Display Preview">
          {local.RestroDisplayPhoto ? (
            <img src={imgSrc(local.RestroDisplayPhoto)} alt="display" className="preview-img" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div className="readonly-value">No image</div>
          )}
        </KVRow>

        <KVRow label="Owner Name">
          <input className="kv-input" value={local.OwnerName ?? ""} onChange={(e) => update("OwnerName", e.target.value)} />
        </KVRow>

        <KVRow label="Owner Email">
          <input className="kv-input" value={local.OwnerEmail ?? ""} onChange={(e) => update("OwnerEmail", e.target.value)} />
        </KVRow>

        <KVRow label="Owner Phone">
          <input className="kv-input" value={local.OwnerPhone ?? ""} onChange={(e) => update("OwnerPhone", e.target.value)} />
        </KVRow>

        <KVRow label="Restro Email">
          <input className="kv-input" value={local.RestroEmail ?? ""} onChange={(e) => update("RestroEmail", e.target.value)} />
        </KVRow>

        <KVRow label="Restro Phone">
          <input className="kv-input" value={local.RestroPhone ?? ""} onChange={(e) => update("RestroPhone", e.target.value)} />
        </KVRow>

        <KVRow label="IRCTC Status">
          <select className="kv-input" value={String(local.IRCTCStatus ?? 0)} onChange={(e) => update("IRCTCStatus", Number(e.target.value))}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>
        </KVRow>

        <KVRow label="Is Pure Veg">
          <select className="kv-input" value={String(local.IsPureVeg ?? 0)} onChange={(e) => update("IsPureVeg", Number(e.target.value))}>
            <option value={1}>Yes</option>
            <option value={0}>No</option>
          </select>
        </KVRow>

        <KVRow label="FSSAI Number">
          <input className="kv-input" value={local.FSSAINumber ?? ""} onChange={(e) => update("FSSAINumber", e.target.value)} />
        </KVRow>

        <KVRow label="FSSAI Expiry Date">
          <input className="kv-input" type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => update("FSSAIExpiryDate", e.target.value)} />
        </KVRow>
      </div>

      {/* buttons */}
      <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => router.push("/admin/restros")} style={{ padding: "8px 12px" }}>
          Cancel
        </button>
        <button onClick={save} disabled={saving} style={{ padding: "8px 12px", background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", border: "none" }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {msg && <div style={{ color: "green", marginTop: 10 }}>{msg}</div>}
      {err && <div style={{ color: "red", marginTop: 10 }}>{err}</div>}

      <style jsx>{`
        .kv-grid {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 12px 18px;
          align-items: start;
          max-width: 980px;
          margin: 6px auto 40px;
        }

        .kv-label {
          text-align: right;
          padding-top: 8px;
          color: #333;
          font-weight: 600;
          font-size: 13px;
        }

        .kv-field {
          display: block;
        }

        .kv-input {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          font-size: 13px;
          box-sizing: border-box;
          background: #fff;
        }

        .readonly-value {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
          background: #fafafa;
          color: #222;
          font-size: 13px;
        }

        .preview-img {
          height: 96px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }

        @media (max-width: 820px) {
          .kv-grid {
            grid-template-columns: 1fr;
            gap: 10px 0;
          }
          .kv-label {
            text-align: left;
            padding-top: 6px;
          }
        }
      `}</style>
    </div>
  );
}
