// components/tabs/BasicInfoClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initialData: any };

export default function BasicInfoClient({ initialData }: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({
    restro_code: initialData?.restro_code ?? initialData?.RestroCode ?? "",
    restro_name: initialData?.restro_name ?? initialData?.RestroName ?? "",
    brand_name: initialData?.brand_name ?? initialData?.BrandName ?? "",
    station_code: initialData?.station_code ?? initialData?.StationCode ?? "",
    station_name: initialData?.station_name ?? initialData?.StationName ?? "",
    owner_name: initialData?.owner_name ?? initialData?.OwnerName ?? "",
    owner_email: initialData?.owner_email ?? initialData?.OwnerEmail ?? "",
    owner_phone: initialData?.owner_phone ?? initialData?.OwnerPhone ?? "",
    restro_email: initialData?.restro_email ?? initialData?.RestroEmail ?? "",
    restro_phone: initialData?.restro_phone ?? initialData?.RestroPhone ?? "",
    raileats: initialData?.raileats ?? (initialData?.Raileats ? 1 : 0) ?? 0,
    irctc: initialData?.irctc ?? (initialData?.IRCTC ? 1 : 0) ?? 0,
    is_irctc_approved: initialData?.is_irctc_approved ?? (initialData?.IsIrctcApproved ? 1 : 0) ?? 0,
    rating: initialData?.rating ?? initialData?.Rating ?? "",
    is_pure_veg: initialData?.is_pure_veg ?? (initialData?.IsPureVeg ? 1 : 0) ?? 0,
    restro_display_photo: initialData?.restro_display_photo ?? initialData?.RestroDisplayPhoto ?? "",
    fssai_number: initialData?.fssai_number ?? initialData?.FSSAINumber ?? "",
    fssai_expiry_date: initialData?.fssai_expiry_date ?? initialData?.FSSAIExpiryDate ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    // if initialData changes, refresh local
    setLocal((p: any) => ({ ...p, restro_code: initialData?.restro_code ?? initialData?.RestroCode ?? p.restro_code }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.restro_code]);

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
      const id = encodeURIComponent(String(local.restro_code));
      const payload: any = {
        restro_name: local.restro_name,
        brand_name: local.brand_name,
        station_code: local.station_code,
        station_name: local.station_name,
        owner_name: local.owner_name,
        owner_email: local.owner_email,
        owner_phone: local.owner_phone,
        restro_email: local.restro_email,
        restro_phone: local.restro_phone,
        raileats: local.raileats ? 1 : 0,
        irctc: local.irctc ? 1 : 0,
        is_irctc_approved: local.is_irctc_approved ? 1 : 0,
        rating: local.rating !== "" ? Number(local.rating) : null,
        is_pure_veg: local.is_pure_veg ? 1 : 0,
        restro_display_photo: local.restro_display_photo,
        fssai_number: local.fssai_number,
        fssai_expiry_date: local.fssai_expiry_date,
      };

      const res = await fetch(`/api/restros/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Save failed (${res.status})`);
      }

      const json = await res.json().catch(() => null);
      setMsg("Saved successfully");
      // optional: refresh page data (client-side)
      // router.refresh(); // uncomment if you want to re-fetch server data
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h3 style={{ textAlign: "center", marginBottom: 12, fontSize: 20 }}>Basic Information</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontWeight: 600 }}>Restro Code</label>
          <div style={{ padding: 8 }}>{local.restro_code}</div>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Owner Name</label>
          <input value={local.owner_name} onChange={(e) => update("owner_name", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Station Code with Name</label>
          <div style={{ padding: 8 }}>({local.station_code}) {local.station_name}</div>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Owner Email</label>
          <input value={local.owner_email} onChange={(e) => update("owner_email", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Name</label>
          <input value={local.restro_name} onChange={(e) => update("restro_name", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Owner Phone</label>
          <input value={local.owner_phone} onChange={(e) => update("owner_phone", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Brand Name if Any</label>
          <input value={local.brand_name} onChange={(e) => update("brand_name", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Email</label>
          <input value={local.restro_email} onChange={(e) => update("restro_email", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Raileats Status</label>
          <select value={local.raileats ? "on" : "off"} onChange={(e) => update("raileats", e.target.value === "on")} style={{ width: "100%", padding: 8 }}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Phone</label>
          <input value={local.restro_phone} onChange={(e) => update("restro_phone", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Is Irctc Approved</label>
          <select value={local.is_irctc_approved ? "yes" : "no"} onChange={(e) => update("is_irctc_approved", e.target.value === "yes")} style={{ width: "100%", padding: 8 }}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>IRCTC Status</label>
          <select value={local.irctc ? "on" : "off"} onChange={(e) => update("irctc", e.target.value === "on")} style={{ width: "100%", padding: 8 }}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Restro Rating</label>
          <input type="number" step="0.1" value={local.rating ?? ""} onChange={(e) => update("rating", e.target.value)} style={{ width: "100%", padding: 8 }} />
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Is Pure Veg</label>
          <select value={local.is_pure_veg ? "yes" : "no"} onChange={(e) => update("is_pure_veg", e.target.value === "yes")} style={{ width: "100%", padding: 8 }}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontWeight: 600 }}>Restro Display Photo (path or URL)</label>
          <input value={local.restro_display_photo} onChange={(e) => update("restro_display_photo", e.target.value)} style={{ width: "100%", padding: 8 }} />
          {local.restro_display_photo ? <div style={{ marginTop: 8 }}><img src={local.restro_display_photo} alt="restro" style={{ height: 90, objectFit: "cover" }} /></div> : null}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => router.push("/admin/restros")} style={{ padding: "8px 12px" }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ padding: "8px 12px", background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", border: "none" }}>{saving ? "Saving..." : "Save"}</button>
      </div>

      {msg && <div style={{ color: "green", marginTop: 8 }}>{msg}</div>}
      {err && <div style={{ color: "red", marginTop: 8 }}>{err}</div>}
    </div>
  );
}
