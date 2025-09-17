// components/tabs/BasicInfoClient.tsx
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

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ textAlign: "center", marginBottom: 12, fontSize: 20 }}>Basic Information</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* left col */}
        <div>
          <label style={{ fontWeight: 600 }}>Restro Code</label>
          <div style={{ padding: 8 }}>{local.RestroCode}</div>

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Station Code with Name</label>
          <div style={{ padding: 8 }}>
            ({local.StationCode}) {local.StationName}
          </div>

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Restro Name</label>
          <input value={local.RestroName} onChange={(e) => update("RestroName", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Brand Name if Any</label>
          <input value={local.BrandNameifAny} onChange={(e) => update("BrandNameifAny", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Raileats Status</label>
          <select value={String(local.RaileatsStatus ?? 0)} onChange={(e) => update("RaileatsStatus", Number(e.target.value))} style={{ width: "100%", padding: 8 }}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Is Irctc Approved</label>
          <select value={String(local.IsIrctcApproved ?? "0")} onChange={(e) => update("IsIrctcApproved", e.target.value)} style={{ width: "100%", padding: 8 }}>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Restro Rating</label>
          <input type="number" step="0.1" value={local.RestroRating ?? ""} onChange={(e) => update("RestroRating", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Restro Display Photo (path)</label>
          <input value={local.RestroDisplayPhoto} onChange={(e) => update("RestroDisplayPhoto", e.target.value)} style={{ width: "100%", padding: 8 }} />
          {local.RestroDisplayPhoto ? (
            <div style={{ marginTop: 8 }}>
              <img src={imgSrc(local.RestroDisplayPhoto)} alt="display" style={{ height: 100, objectFit: "cover" }} />
            </div>
          ) : null}
        </div>

        {/* right col */}
        <div>
          <label style={{ fontWeight: 600 }}>Owner Name</label>
          <input value={local.OwnerName} onChange={(e) => update("OwnerName", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Owner Email</label>
          <input value={local.OwnerEmail} onChange={(e) => update("OwnerEmail", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Owner Phone</label>
          <input value={local.OwnerPhone} onChange={(e) => update("OwnerPhone", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Restro Email</label>
          <input value={local.RestroEmail} onChange={(e) => update("RestroEmail", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Restro Phone</label>
          <input value={local.RestroPhone} onChange={(e) => update("RestroPhone", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>IRCTC Status</label>
          <select value={String(local.IRCTCStatus ?? 0)} onChange={(e) => update("IRCTCStatus", Number(e.target.value))} style={{ width: "100%", padding: 8 }}>
            <option value={1}>On</option>
            <option value={0}>Off</option>
          </select>

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Is Pure Veg</label>
          <select value={String(local.IsPureVeg ?? 0)} onChange={(e) => update("IsPureVeg", Number(e.target.value))} style={{ width: "100%", padding: 8 }}>
            <option value={1}>Yes</option>
            <option value={0}>No</option>
          </select>

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>FSSAI Number</label>
          <input value={local.FSSAINumber ?? ""} onChange={(e) => update("FSSAINumber", e.target.value)} style={{ width: "100%", padding: 8 }} />

          <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>FSSAI Expiry Date</label>
          <input type="date" value={local.FSSAIExpiryDate ?? ""} onChange={(e) => update("FSSAIExpiryDate", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>
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
    </div>
  );
}
