"use client";
import React, { useState } from "react";

type Restro = { [k: string]: any };

export default function AddressDocsForm({
  initialData,
  restroCode,
}: {
  initialData: Restro;
  restroCode: number;
}) {
  // map existing fields (use same keys as your RestroMaster CSV)
  const [address, setAddress] = useState(String(initialData?.RestroAddress ?? ""));
  const [city, setCity] = useState(String(initialData?.City ?? ""));
  const [stateName, setStateName] = useState(String(initialData?.State ?? ""));
  const [district, setDistrict] = useState(String(initialData?.District ?? ""));
  const [pin, setPin] = useState(String(initialData?.PinCode ?? ""));
  const [lat, setLat] = useState(String(initialData?.RestroLatitude ?? ""));
  const [lng, setLng] = useState(String(initialData?.RestroLongitude ?? ""));

  // docs (FSSAI/GST/PAN) - simple placeholders showing stored values if any
  const [fssai, setFssai] = useState(String(initialData?.FSSAINumber ?? ""));
  const [fssaiExpiry, setFssaiExpiry] = useState(String(initialData?.FSSAIExpiryDate ?? ""));
  const [gst, setGst] = useState(String(initialData?.GSTNumber ?? ""));
  const [pan, setPan] = useState(String(initialData?.PANNumber ?? ""));

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSave() {
    setSaving(true);
    setMessage(null);
    try {
      // simple client-side save approach: call your API route (implement separately)
      // we'll call /api/restros/[code]/address-docs (you can implement server action to update supabase)
      const res = await fetch(`/api/restros/${restroCode}/address-docs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          RestroAddress: address,
          City: city,
          State: stateName,
          District: district,
          PinCode: pin,
          RestroLatitude: lat,
          RestroLongitude: lng,
          FSSAINumber: fssai,
          FSSAIExpiryDate: fssaiExpiry,
          GSTNumber: gst,
          PANNumber: pan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setMessage("Saved successfully");
    } catch (err: any) {
      console.error("save error", err);
      setMessage("Save failed: " + (err?.message ?? JSON.stringify(err)));
    } finally {
      setSaving(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div style={{ padding: 20 }}>
      {message && (
        <div style={{ marginBottom: 12, color: message.startsWith("Saved") ? "green" : "red" }}>{message}</div>
      )}

      <div style={{ background: "#fff", padding: 18, borderRadius: 6, boxShadow: "0 0 0 1px #eee inset" }}>
        <h3 style={{ marginTop: 0 }}>Address</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6 }}>Restro Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6 }}>City / Village</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6 }}>State</label>
            <input value={stateName} onChange={(e) => setStateName(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6 }}>District</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6 }}>Pin Code</label>
            <input value={pin} onChange={(e) => setPin(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6 }}>Latitude</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} style={{ width: "100%", padding: 8 }} />
            <label style={{ display: "block", fontSize: 13, color: "#444", marginTop: 8 }}>Longitude</label>
            <input value={lng} onChange={(e) => setLng(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div style={{ background: "#fff", padding: 18, borderRadius: 6 }}>
        <h3 style={{ marginTop: 0 }}>Documents</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: 8 }}>Type</th>
              <th style={{ padding: 8 }}>Number</th>
              <th style={{ padding: 8 }}>Expiry / Type</th>
              <th style={{ padding: 8 }}>Upload</th>
              <th style={{ padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 8 }}>FSSAI</td>
              <td style={{ padding: 8 }}><input value={fssai} onChange={(e) => setFssai(e.target.value)} style={{ padding: 6, width: "100%" }} /></td>
              <td style={{ padding: 8 }}><input value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} style={{ padding: 6, width: "100%" }} /></td>
              <td style={{ padding: 8 }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" /></td>
              <td style={{ padding: 8 }}> {/* status placeholder */ } Active</td>
            </tr>

            <tr>
              <td style={{ padding: 8 }}>GST</td>
              <td style={{ padding: 8 }}><input value={gst} onChange={(e) => setGst(e.target.value)} style={{ padding: 6, width: "100%" }} /></td>
              <td style={{ padding: 8 }}>Type (eg. Regular)</td>
              <td style={{ padding: 8 }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" /></td>
              <td style={{ padding: 8 }}>Active</td>
            </tr>

            <tr>
              <td style={{ padding: 8 }}>PAN</td>
              <td style={{ padding: 8 }}><input value={pan} onChange={(e) => setPan(e.target.value)} style={{ padding: 6, width: "100%" }} /></td>
              <td style={{ padding: 8 }}>Type (Individual/Company)</td>
              <td style={{ padding: 8 }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" /></td>
              <td style={{ padding: 8 }}>Active</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ height: 28 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => { window.history.back(); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}>
          Cancel
        </button>

        <button onClick={onSave} disabled={saving} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: "#06b6d4", color: "#fff" }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
