// components/AddressDocsForm.tsx
"use client";

import React, { useState } from "react";

type RestroRow = { [k: string]: any };

type Props = {
  initialData: RestroRow;
};

export default function AddressDocsForm({ initialData }: Props) {
  // map fields from RestroMaster table (use same keys as your DB)
  const [address, setAddress] = useState(initialData?.RestroAddress ?? initialData?.Address ?? "");
  const [city, setCity] = useState(initialData?.City ?? "");
  const [stateVal, setStateVal] = useState(initialData?.State ?? initialData?.StateName ?? "");
  const [district, setDistrict] = useState(initialData?.District ?? "");
  const [pincode, setPincode] = useState(initialData?.PinCode ?? initialData?.Pincode ?? "");
  const [latitude, setLatitude] = useState(initialData?.RestroLatitude ?? initialData?.Latitude ?? "");
  const [longitude, setLongitude] = useState(initialData?.RestroLongitude ?? initialData?.Longitude ?? "");

  // Documents (single latest entries; if you have arrays, adapt accordingly)
  const [fssaiNumber, setFssaiNumber] = useState(initialData?.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(initialData?.FSSAIExpiryDate ?? "");
  const [fssaiStatus, setFssaiStatus] = useState(initialData?.FSSAIStatus === 1 || initialData?.FSSAIStatus === "1" ? true : false);
  const [gstNumber, setGstNumber] = useState(initialData?.GSTNumber ?? "");
  const [gstType, setGstType] = useState(initialData?.GSTType ?? "");
  const [gstStatus, setGstStatus] = useState(initialData?.GSTStatus === 1 || initialData?.GSTStatus === "1" ? true : false);
  const [panNumber, setPanNumber] = useState(initialData?.PANNumber ?? "");
  const [panType, setPanType] = useState(initialData?.PANType ?? "");
  const [panStatus, setPanStatus] = useState(initialData?.PANStatus === 1 || initialData?.PANStatus === "1" ? true : false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const restroCode = initialData?.RestroCode ?? initialData?.RestroId ?? initialData?.code;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const payload: any = {
      RestroAddress: address,
      City: city,
      State: stateVal,
      District: district,
      PinCode: pincode,
      RestroLatitude: latitude,
      RestroLongitude: longitude,

      // documents fields - adapt to your DB column names
      FSSAINumber: fssaiNumber,
      FSSAIExpiryDate: fssaiExpiry,
      FSSAIStatus: fssaiStatus ? 1 : 0,

      GSTNumber: gstNumber,
      GSTType: gstType,
      GSTStatus: gstStatus ? 1 : 0,

      PANNumber: panNumber,
      PANType: panType,
      PANStatus: panStatus ? 1 : 0,
    };

    try {
      if (!restroCode) throw new Error("Missing restro code");

      const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Save failed (${res.status})`);
      }

      setSuccess("Saved successfully.");
    } catch (err: any) {
      console.error("save error", err);
      setError(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  }

  function renderToggle(label: string, value: boolean, onChange: (v: boolean) => void) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label style={{ fontSize: 13, color: "#333" }}>{label}</label>
        <button
          type="button"
          onClick={() => onChange(!value)}
          style={{
            width: 46,
            height: 26,
            borderRadius: 14,
            border: "1px solid #ccc",
            background: value ? "#22c55e" : "#e6e6e6",
            position: "relative",
            padding: 2,
            cursor: "pointer",
          }}
          aria-pressed={value}
        >
          <span
            style={{
              display: "block",
              width: 20,
              height: 20,
              background: "#fff",
              borderRadius: "50%",
              transform: value ? "translateX(20px)" : "translateX(0)",
              transition: "transform 0.18s ease",
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave}>
      {/* Address block */}
      <div style={{ background: "#f7fafc", padding: 14, borderRadius: 8, marginBottom: 18 }}>
        <h4 style={{ marginTop: 0 }}>Address</h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Restro Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>City / Village</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>State</label>
            <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>District</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Pin Code</label>
            <input value={pincode} onChange={(e) => setPincode(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Latitude / Longitude</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input placeholder="lat" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ flex: 1, padding: 8 }} />
              <input placeholder="lng" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ flex: 1, padding: 8 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Documents block */}
      <div style={{ background: "#fff7ed", padding: 14, borderRadius: 8, marginBottom: 18 }}>
        <h4 style={{ marginTop: 0 }}>Documents</h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* FSSAI */}
          <div style={{ border: "1px solid #eee", padding: 10, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>FSSAI</div>
            <label style={{ display: "block", marginBottom: 6 }}>FSSAI Number</label>
            <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} style={{ width: "100%", padding: 8 }} />
            <label style={{ display: "block", marginTop: 8 }}>FSSAI Expiry Date</label>
            <input type="date" value={fssaiExpiry?.slice(0, 10) ?? ""} onChange={(e) => setFssaiExpiry(e.target.value)} style={{ width: "100%", padding: 8 }} />
            <label style={{ display: "block", marginTop: 8 }}>FSSAI Copy Upload</label>
            <input type="file" accept=".pdf,image/*" />
            <div style={{ marginTop: 10 }}>{renderToggle("Status", fssaiStatus, setFssaiStatus)}</div>
          </div>

          {/* GST */}
          <div style={{ border: "1px solid #eee", padding: 10, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>GST</div>
            <label style={{ display: "block", marginBottom: 6 }}>GST Number</label>
            <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} style={{ width: "100%", padding: 8 }} />
            <label style={{ display: "block", marginTop: 8 }}>GST Type</label>
            <select value={gstType} onChange={(e) => setGstType(e.target.value)} style={{ width: "100%", padding: 8 }}>
              <option value="">Select</option>
              <option value="REGULAR">Regular</option>
              <option value="COMPOSITION">Composition</option>
              <option value="NA">Not Applicable</option>
            </select>
            <label style={{ display: "block", marginTop: 8 }}>GST Copy Upload</label>
            <input type="file" accept=".pdf,image/*" />
            <div style={{ marginTop: 10 }}>{renderToggle("Status", gstStatus, setGstStatus)}</div>
          </div>

          {/* PAN */}
          <div style={{ border: "1px solid #eee", padding: 10, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>PAN</div>
            <label style={{ display: "block", marginBottom: 6 }}>PAN Number</label>
            <input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} style={{ width: "100%", padding: 8 }} />
            <label style={{ display: "block", marginTop: 8 }}>PAN Type</label>
            <select value={panType} onChange={(e) => setPanType(e.target.value)} style={{ width: "100%", padding: 8 }}>
              <option value="">Select</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="COMPANY">Company</option>
            </select>
            <label style={{ display: "block", marginTop: 8 }}>PAN Copy Upload</label>
            <input type="file" accept=".pdf,image/*" />
            <div style={{ marginTop: 10 }}>{renderToggle("Status", panStatus, setPanStatus)}</div>
          </div>
        </div>

        <div style={{ marginTop: 12, color: "#d9534f", fontSize: 13 }}>
          Note: FSSAI / GST / PAN entries are non-editable once added. If you add a new entry, the old one should be marked inactive (implement backend logic accordingly).
        </div>
      </div>

      {/* actions */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => window.history.back()} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}>
          Cancel
        </button>

        <div style={{ marginLeft: "auto" }}>
          {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
          {success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}
          <button type="submit" disabled={saving} style={{ background: "#0ea5e9", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
