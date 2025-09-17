// components/tabs/BasicInfoClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KeyValueGrid, { KVRow } from "@/components/ui/KeyValueGrid";

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

  // build rows for KeyValueGrid
  const rows: KVRow[] = [
    { keyLabel: "Restro Code", value: <div className="readonly-value">{local.RestroCode ?? "—"}</div> },
    {
      keyLabel: "Station Code with Name",
      value: <div className="readonly-value">({local.StationCode ?? ""}) {local.StationName ?? ""}</div>,
    },
    { keyLabel: "Restro Name", value: <input className="kv-input" value={local.RestroName ?? ""} onChange={(e) => update("RestroName", e.target.value)} /> },
    { keyLabel: "Brand Name if Any", value: <input className="kv-input" value={local.BrandNameifAny ?? ""} onChange={(e) => update("BrandNameifAny", e.target.value)} /> },
    {
      keyLabel: "Raileats Status",
      value: (
        <select className="kv-input" value={String(local.RaileatsStatus ?? 0)} onChange={(e) => update("RaileatsStatus", Number(e.target.value))}>
          <option value={1}>On</option>
          <option value={0}>Off</option>
        </select>
      ),
    },
    {
      keyLabel: "Is Irctc Approved",
      value: (
        <select className="kv-input" value={String(local.IsIrctcApproved ?? "0")} onChange={(e) => update("IsIrctcApproved", e.target.value)}>
          <option value="1">Yes</option>
          <option value="0">No</option>
        </select>
      ),
    },
    { keyLabel: "Restro Rating", value: <input className="kv-input" type="number" step="0.1" value={local.RestroRating ?? ""} onChange={(e) => update("RestroRating", e.target.value)} /> },
    { keyLabel: "Restro Display Photo (path)", value: <input className="kv-input" value={local.RestroDisplayPhoto ?? ""} onChange={(e) => update("RestroDisplayPhoto", e.target.value)} /> },
    {
      keyLabel: "Display Preview",
      value: local.RestroDisplayPhoto ? <img className="preview-img" src={imgSrc(local.RestroDisplayPhoto)} alt="display" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} /> : <div className="readonly-value">No image</div>,
    },
    { keyLabel: "Owner Name", value: <input className="kv-input" value={local.OwnerName ?? ""} onChange={(e) => update("OwnerName", e.target.value)} /> },
    { keyLabel: "Owner Email", value: <input className="kv-input" value={local.OwnerEmail ?? ""} onChange={(e) => update("OwnerEmail", e.target.value)} /> },
    { keyLabel: "Owner Phone", value: <input className="kv-input" value={local.OwnerPhone ?? ""} onChange={(e) => update("OwnerPhone", e.target.value)} /> },
    { keyLabel: "Restro Email", value: <input className="kv-input" value={local.RestroEmail ?? ""} onChange={(e) => update("RestroEmail", e.target.value)} /> },
    { keyLabel: "Restro Phone", value: <input className="kv-input" value={local.RestroPhone ?? ""} onChange={(e) => update("RestroPhone", e.target.value)} /> },
    {
      keyLabel: "IRCTC Status",
      value: (
        <select className="kv-input" value={String(local.IRCTCStatus ?? 0)} onChange={(e) => update("IRCTCStatus", Number(e.target.value))}>
          <option value={1}>On</option>
          <option value={0}>Off</option>
        </select>
      ),
    },
    {
      keyLabel: "Is Pure Veg",
      value: (
        <select className="kv-input" value={String(local.IsPureVeg ?? 0)} onChange={(e) => update("IsPureVeg", Number(e.target.value))}>
          <option value={1}>Yes</option>
          <option value={0}>No</option>
        </select>
      ),
    },
    { keyLabel: "FSSAI Number", value: <input className="kv-input" value={local.FSSAINumber ?? ""} onChange={(e) => update("FSSAINumber", e.target.value)} /> },
    { keyLabel: "FSSAI Expiry Date", value: <input className="kv-input" type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => update("FSSAIExpiryDate", e.target.value)} /> },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ textAlign: "center", marginBottom: 12, fontSize: 20 }}>Basic Information</h3>

      <KeyValueGrid rows={rows} labelWidth={220} maxWidth={980} />

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
    </div>
  );
}
