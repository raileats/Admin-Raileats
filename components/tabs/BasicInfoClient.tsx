// components/tabs/BasicInfoClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initialData: any; imagePrefix?: string };

export default function BasicInfoClient({ initialData, imagePrefix = "" }: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({
    RestroCode: initialData?.RestroCode ?? "",
    RestroName: initialData?.RestroName ?? "",
    BrandName: initialData?.BrandName ?? "",
    StationCode: initialData?.StationCode ?? "",
    StationName: initialData?.StationName ?? "",
    OwnerName: initialData?.OwnerName ?? "",
    OwnerEmail: initialData?.OwnerEmail ?? "",
    OwnerPhone: initialData?.OwnerPhone ?? "",
    RestroEmail: initialData?.RestroEmail ?? "",
    RestroPhone: initialData?.RestroPhone ?? "",
    Raileats: !!(initialData?.Raileats ?? false),
    IRCTC: !!(initialData?.IRCTC ?? false),
    IsIrctcApproved: !!(initialData?.IsIrctcApproved ?? false),
    Rating: initialData?.Rating ?? "",
    IsPureVeg: !!(initialData?.IsPureVeg ?? false),
    RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiryDate: initialData?.FSSAIExpiryDate ?? "",
  });

  useEffect(() => {
    setLocal((p: any) => ({
      ...p,
      RestroCode: initialData?.RestroCode ?? p.RestroCode,
      RestroName: initialData?.RestroName ?? p.RestroName,
      BrandName: initialData?.BrandName ?? p.BrandName,
      StationCode: initialData?.StationCode ?? p.StationCode,
      StationName: initialData?.StationName ?? p.StationName,
      OwnerName: initialData?.OwnerName ?? p.OwnerName,
      OwnerEmail: initialData?.OwnerEmail ?? p.OwnerEmail,
      OwnerPhone: initialData?.OwnerPhone ?? p.OwnerPhone,
      RestroEmail: initialData?.RestroEmail ?? p.RestroEmail,
      RestroPhone: initialData?.RestroPhone ?? p.RestroPhone,
      Raileats: !!(initialData?.Raileats ?? p.Raileats),
      IRCTC: !!(initialData?.IRCTC ?? p.IRCTC),
      IsIrctcApproved: !!(initialData?.IsIrctcApproved ?? p.IsIrctcApproved),
      Rating: initialData?.Rating ?? p.Rating,
      IsPureVeg: !!(initialData?.IsPureVeg ?? p.IsPureVeg),
      RestroDisplayPhoto: initialData?.RestroDisplayPhoto ?? p.RestroDisplayPhoto,
      FSSAINumber: initialData?.FSSAINumber ?? p.FSSAINumber,
      FSSAIExpiryDate: initialData?.FSSAIExpiryDate ?? p.FSSAIExpiryDate,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function update(k: string, v: any) {
    setLocal((p: any) => ({ ...p, [k]: v }));
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
        BrandName: local.BrandName,
        StationCode: local.StationCode,
        StationName: local.StationName,
        OwnerName: local.OwnerName,
        OwnerEmail: local.OwnerEmail,
        OwnerPhone: local.OwnerPhone,
        RestroEmail: local.RestroEmail,
        RestroPhone: local.RestroPhone,
        Raileats: local.Raileats ? 1 : 0,
        IRCTC: local.IRCTC ? 1 : 0,
        IsIrctcApproved: local.IsIrctcApproved ? 1 : 0,
        Rating: local.Rating === "" ? null : Number(local.Rating),
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
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? `Save failed (${res?.status})`);

      setMsg("Saved successfully");
      // optional: refresh server data
      router.refresh();
    } catch (e: any) {
      console.error("Save error:", e);
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ textAlign: "center", marginBottom: 12, fontSize: 20 }}>Basic Information</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Restro Code</label>
          <div style={{ padding: 8 }}>{local.RestroCode}</div>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Owner Name</label>
          <input value={local.OwnerName} onChange={(e) => update("OwnerName", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Station Code with Name</label>
          <div style={{ padding: 8 }}>({local.StationCode}) {local.StationName}</div>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Owner Email</label>
          <input value={local.OwnerEmail} onChange={(e) => update("OwnerEmail", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Name</label>
          <input value={local.RestroName} onChange={(e) => update("RestroName", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Owner Phone</label>
          <input value={local.OwnerPhone} onChange={(e) => update("OwnerPhone", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Brand Name if Any</label>
          <input value={local.BrandName} onChange={(e) => update("BrandName", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Email</label>
          <input value={local.RestroEmail} onChange={(e) => update("RestroEmail", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Raileats Status</label>
          <select value={local.Raileats ? "on" : "off"} onChange={(e) => update("Raileats", e.target.value === "on")} style={{ width: "100%", padding: 8 }}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Phone</label>
          <input value={local.RestroPhone} onChange={(e) => update("RestroPhone", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Is Irctc Approved</label>
          <select value={local.IsIrctcApproved ? "yes" : "no"} onChange={(e) => update("IsIrctcApproved", e.target.value === "yes")} style={{ width: "100%", padding: 8 }}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>IRCTC Status</label>
          <select value={local.IRCTC ? "on" : "off"} onChange={(e) => update("IRCTC", e.target.value === "on")} style={{ width: "100%", padding: 8 }}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Rating</label>
          <input type="number" step="0.1" value={local.Rating ?? ""} onChange={(e) => update("Rating", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Is Pure Veg</label>
          <select value={local.IsPureVeg ? "yes" : "no"} onChange={(e) => update("IsPureVeg", e.target.value === "yes")} style={{ width: "100%", padding: 8 }}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontWeight: 600 }}>Restro Display Photo (path or URL)</label>
          <input value={local.RestroDisplayPhoto} onChange={(e) => update("RestroDisplayPhoto", e.target.value)} style={{ width: "100%", padding: 8 }} />
          {local.RestroDisplayPhoto ? (
            <div style={{ marginTop: 8 }}>
              <img src={(imagePrefix ?? "") + local.RestroDisplayPhoto} alt="restro" style={{ height: 90, objectFit: "cover" }} />
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => router.push("/admin/restros")} style={{ padding: "8px 12px" }}>Cancel</button>
        <button disabled={saving} onClick={save} style={{ padding: "8px 12px", background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", border: "none" }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {msg && <div style={{ color: "green", marginTop: 8 }}>{msg}</div>}
      {err && <div style={{ color: "red", marginTop: 8 }}>{err}</div>}
    </div>
  );
}
