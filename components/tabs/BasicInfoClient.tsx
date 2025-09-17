"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { initialData: any; imagePrefix?: string };

export default function BasicInfoClient({ initialData, imagePrefix = "" }: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({
    restro_code: initialData?.restro_code ?? "",
    restro_name: initialData?.restro_name ?? "",
    brand_name: initialData?.brand_name ?? "",
    station_code: initialData?.station_code ?? "",
    station_name: initialData?.station_name ?? "",
    owner_name: initialData?.owner_name ?? "",
    owner_email: initialData?.owner_email ?? "",
    owner_phone: initialData?.owner_phone ?? "",
    restro_email: initialData?.restro_email ?? "",
    restro_phone: initialData?.restro_phone ?? "",
    raileats: !!initialData?.raileats,
    irctc: !!initialData?.irctc,
    is_irctc_approved: !!initialData?.is_irctc_approved,
    rating: initialData?.rating ?? "",
    is_pure_veg: !!initialData?.is_pure_veg,
    restro_display_photo: initialData?.restro_display_photo ?? "",
    fssai_number: initialData?.fssai_number ?? "",
    fssai_expiry_date: initialData?.fssai_expiry_date ?? "",
  });

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
    try {
      const id = encodeURIComponent(String(local.restro_code));
      const payload = {
        ...local,
        raileats: local.raileats ? 1 : 0,
        irctc: local.irctc ? 1 : 0,
        is_irctc_approved: local.is_irctc_approved ? 1 : 0,
        is_pure_veg: local.is_pure_veg ? 1 : 0,
      };

      const res = await fetch(`/api/restros/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Save failed");

      setMsg("Saved successfully");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ marginBottom: 20, fontSize: 20 }}>Basic Information</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          alignItems: "center",
        }}
      >
        {/* Row 1 */}
        <div>
          <label style={{ fontWeight: 600 }}>Restro Code</label>
          <div>{local.restro_code}</div>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Owner Name</label>
          <input
            value={local.owner_name}
            onChange={(e) => update("owner_name", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        {/* Row 2 */}
        <div>
          <label style={{ fontWeight: 600 }}>Station Code with Name</label>
          <div>
            ({local.station_code}) {local.station_name}
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Owner Email</label>
          <input
            value={local.owner_email}
            onChange={(e) => update("owner_email", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        {/* Row 3 */}
        <div>
          <label style={{ fontWeight: 600 }}>Restro Name</label>
          <input
            value={local.restro_name}
            onChange={(e) => update("restro_name", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Owner Phone</label>
          <input
            value={local.owner_phone}
            onChange={(e) => update("owner_phone", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        {/* Row 4 */}
        <div>
          <label style={{ fontWeight: 600 }}>Brand Name if Any</label>
          <input
            value={local.brand_name}
            onChange={(e) => update("brand_name", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Restro Email</label>
          <input
            value={local.restro_email}
            onChange={(e) => update("restro_email", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        {/* Row 5 */}
        <div>
          <label style={{ fontWeight: 600 }}>Raileats Status</label>
          <select
            value={local.raileats ? "on" : "off"}
            onChange={(e) => update("raileats", e.target.value === "on")}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Restro Phone</label>
          <input
            value={local.restro_phone}
            onChange={(e) => update("restro_phone", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>

        {/* Row 6 */}
        <div>
          <label style={{ fontWeight: 600 }}>Is Irctc Approved</label>
          <select
            value={local.is_irctc_approved ? "yes" : "no"}
            onChange={(e) => update("is_irctc_approved", e.target.value === "yes")}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>IRCTC Status</label>
          <select
            value={local.irctc ? "on" : "off"}
            onChange={(e) => update("irctc", e.target.value === "on")}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </div>

        {/* Row 7 */}
        <div>
          <label style={{ fontWeight: 600 }}>Restro Rating</label>
          <input
            type="number"
            value={local.rating}
            onChange={(e) => update("rating", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
        </div>
        <div>
          <label style={{ fontWeight: 600 }}>Is Pure Veg</label>
          <select
            value={local.is_pure_veg ? "yes" : "no"}
            onChange={(e) => update("is_pure_veg", e.target.value === "yes")}
            style={{ width: "100%", padding: 6 }}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Row 8 */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={{ fontWeight: 600 }}>Restro Display Photo</label>
          <input
            value={local.restro_display_photo}
            onChange={(e) => update("restro_display_photo", e.target.value)}
            style={{ width: "100%", padding: 6 }}
          />
          {local.restro_display_photo && (
            <div style={{ marginTop: 8 }}>
              <img
                src={imagePrefix + local.restro_display_photo}
                alt="restro"
                style={{ height: 100 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={() => router.push("/admin/restros")}
          style={{ padding: "8px 12px" }}
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: "8px 12px",
            background: saving ? "#7fcfe9" : "#0ea5e9",
            color: "#fff",
            border: "none",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {msg && <div style={{ marginTop: 10, color: "green" }}>{msg}</div>}
      {err && <div style={{ marginTop: 10, color: "red" }}>{err}</div>}
    </div>
  );
}
