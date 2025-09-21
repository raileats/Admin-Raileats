"use client";

import React, { useEffect, useState } from "react";

type Props = {
  initialData?: any; // restro row from server (RestroMaster)
  restroCode: number;
  onSaved?: (row: any) => void;
};

export default function AddressDocsForm({ initialData = {}, restroCode, onSaved }: Props) {
  // Address fields
  const [restroAddress, setRestroAddress] = useState<string>(initialData.RestroAddress ?? "");
  const [city, setCity] = useState<string>(initialData.City ?? "");
  const [stateVal, setStateVal] = useState<string>(initialData.State ?? "");
  const [district, setDistrict] = useState<string>(initialData.District ?? "");
  const [pinCode, setPinCode] = useState<string | number>(initialData.PinCode ?? "");
  const [latitude, setLatitude] = useState<string | number>(initialData.RestroLatitude ?? "");
  const [longitude, setLongitude] = useState<string | number>(initialData.RestroLongitude ?? "");

  // Documents fields
  const [fssaiNumber, setFssaiNumber] = useState<string>(initialData.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState<string>(initialData.FSSAIExpiryDate ?? "");
  const [fssaiFileName, setFssaiFileName] = useState<string>(initialData.FSSAICopyPath ?? "");
  const [fssaiStatus, setFssaiStatus] = useState<boolean>(!!initialData.FSSAIStatus);

  const [gstNumber, setGstNumber] = useState<string>(initialData.GSTNumber ?? "");
  const [gstType, setGstType] = useState<string>(initialData.GSTType ?? "");
  const [gstFileName, setGstFileName] = useState<string>(initialData.GSTCopyPath ?? "");
  const [gstStatus, setGstStatus] = useState<boolean>(!!initialData.GSTStatus);

  const [panNumber, setPanNumber] = useState<string>(initialData.PANNumber ?? "");
  const [panType, setPanType] = useState<string>(initialData.PANType ?? "");
  const [panFileName, setPanFileName] = useState<string>(initialData.PANCopyPath ?? "");
  const [panStatus, setPanStatus] = useState<boolean>(!!initialData.PANStatus);

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If initialData changes, update states (useful when server re-renders)
  useEffect(() => {
    setRestroAddress(initialData.RestroAddress ?? "");
    setCity(initialData.City ?? "");
    setStateVal(initialData.State ?? "");
    setDistrict(initialData.District ?? "");
    setPinCode(initialData.PinCode ?? "");
    setLatitude(initialData.RestroLatitude ?? "");
    setLongitude(initialData.RestroLongitude ?? "");

    setFssaiNumber(initialData.FSSAINumber ?? "");
    setFssaiExpiry(initialData.FSSAIExpiryDate ?? "");
    setFssaiFileName(initialData.FSSAICopyPath ?? "");
    setFssaiStatus(!!initialData.FSSAIStatus);

    setGstNumber(initialData.GSTNumber ?? "");
    setGstType(initialData.GSTType ?? "");
    setGstFileName(initialData.GSTCopyPath ?? "");
    setGstStatus(!!initialData.GSTStatus);

    setPanNumber(initialData.PANNumber ?? "");
    setPanType(initialData.PANType ?? "");
    setPanFileName(initialData.PANCopyPath ?? "");
    setPanStatus(!!initialData.PANStatus);
  }, [initialData]);

  // simple client-side validation example
  function validate(): string | null {
    if (fssaiNumber && !/^\d{14}$/.test(String(fssaiNumber))) {
      return "FSSAI number should be 14 digits.";
    }
    if (panNumber && !/^[A-Z0-9]{10}$/i.test(String(panNumber))) {
      // allow alphanumeric 10 chars (basic)
      return "PAN number should be 10 characters.";
    }
    return null;
  }

  // file inputs (we only store filename here — actual upload not implemented)
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, which: "fssai" | "gst" | "pan") {
    const f = e.target.files?.[0];
    if (!f) return;
    if (which === "fssai") setFssaiFileName(f.name);
    if (which === "gst") setGstFileName(f.name);
    if (which === "pan") setPanFileName(f.name);
    // Note: if you want server upload -> upload to supabase/storage first then send path.
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setMessage(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    const payload: Record<string, any> = {
      // address
      RestroAddress: restroAddress || null,
      City: city || null,
      State: stateVal || null,
      District: district || null,
      PinCode: pinCode || null,
      RestroLatitude: latitude || null,
      RestroLongitude: longitude || null,
      // docs
      FSSAINumber: fssaiNumber || null,
      FSSAIExpiryDate: fssaiExpiry || null,
      FSSAICopyPath: fssaiFileName || null,
      FSSAIStatus: fssaiStatus ? 1 : 0,
      GSTNumber: gstNumber || null,
      GSTType: gstType || null,
      GSTCopyPath: gstFileName || null,
      GSTStatus: gstStatus ? 1 : 0,
      PANNumber: panNumber || null,
      PANType: panType || null,
      PANCopyPath: panFileName || null,
      PANStatus: panStatus ? 1 : 0,
    };

    setSaving(true);
    try {
      const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}/address-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Server error");
      }

      setMessage("Saved successfully.");
      if (onSaved) onSaved(data?.row ?? data);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  }

  // Small reusable styles (inline to match other pages)
  const cardStyle: React.CSSProperties = {
    background: "#eaf6ff", // light blue similar to Basic Info style
    borderRadius: 8,
    padding: 18,
    marginBottom: 18,
    border: "1px solid #dbeeff",
  };

  const labelStyle: React.CSSProperties = { display: "block", fontWeight: 600, marginBottom: 8, color: "#0b4870" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d0dbe6" };

  return (
    <form onSubmit={handleSave}>
      {/* Address card */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: "#0b4870" }}>Address</h3>

        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Restro Address</label>
          <textarea
            rows={3}
            value={restroAddress}
            onChange={(e) => setRestroAddress(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Full address"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "center" }}>
          <div>
            <label style={labelStyle}>City / Village</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>State</label>
            <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} style={inputStyle} placeholder="State" />
          </div>

          <div>
            <label style={labelStyle}>District</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} style={inputStyle} placeholder="District" />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Pin Code</label>
            <input value={String(pinCode ?? "")} onChange={(e) => setPinCode(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Latitude</label>
            <input value={String(latitude ?? "")} onChange={(e) => setLatitude(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Longitude</label>
            <input value={String(longitude ?? "")} onChange={(e) => setLongitude(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Documents card */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0, color: "#0b4870" }}>Documents</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 260px 220px 120px", gap: 12, alignItems: "center" }}>
          <div>
            <label style={labelStyle}>FSSAI Number</label>
            <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} style={inputStyle} placeholder="14-digit FSSAI number" />
          </div>

          <div>
            <label style={labelStyle}>FSSAI Expiry</label>
            <input type="date" value={fssaiExpiry ?? ""} onChange={(e) => setFssaiExpiry(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Upload Copy</label>
            <input type="file" onChange={(e) => handleFileChange(e, "fssai")} />
            <div style={{ fontSize: 13, marginTop: 6 }}>{fssaiFileName ? `Selected: ${fssaiFileName}` : "No file chosen"}</div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={fssaiStatus} onChange={(e) => setFssaiStatus(e.target.checked)} />
                <span style={{ fontSize: 14 }}>{fssaiStatus ? "On" : "Off"}</span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 120px", gap: 12, alignItems: "center" }}>
          <div>
            <label style={labelStyle}>GST Number</label>
            <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} style={inputStyle} placeholder="GST" />
          </div>

          <div>
            <label style={labelStyle}>GST Type</label>
            <select value={gstType} onChange={(e) => setGstType(e.target.value)} style={inputStyle}>
              <option value="">Select</option>
              <option value="Regular">Regular</option>
              <option value="Composition">Composition</option>
              <option value="Not Applicable">Not Applicable</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Upload Copy</label>
            <input type="file" onChange={(e) => handleFileChange(e, "gst")} />
            <div style={{ fontSize: 13, marginTop: 6 }}>{gstFileName ? `Selected: ${gstFileName}` : "No file chosen"}</div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={gstStatus} onChange={(e) => setGstStatus(e.target.checked)} />
              <span style={{ fontSize: 14 }}>{gstStatus ? "On" : "Off"}</span>
            </label>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 120px", gap: 12, alignItems: "center" }}>
          <div>
            <label style={labelStyle}>PAN Number</label>
            <input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} style={inputStyle} placeholder="PAN" />
          </div>

          <div>
            <label style={labelStyle}>PAN Type</label>
            <select value={panType} onChange={(e) => setPanType(e.target.value)} style={inputStyle}>
              <option value="">Select</option>
              <option value="Individual">Individual</option>
              <option value="Company">Company</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Upload Copy</label>
            <input type="file" onChange={(e) => handleFileChange(e, "pan")} />
            <div style={{ fontSize: 13, marginTop: 6 }}>{panFileName ? `Selected: ${panFileName}` : "No file chosen"}</div>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={panStatus} onChange={(e) => setPanStatus(e.target.checked)} />
              <span style={{ fontSize: 14 }}>{panStatus ? "On" : "Off"}</span>
            </label>
          </div>
        </div>
      </div>

      {/* messages */}
      {message && <div style={{ color: "green", marginBottom: 8 }}>{message}</div>}
      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}

      {/* Buttons row (if parent already has Cancel/Save, duplicate is safe) */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 8 }}>
        <button
          type="button"
          onClick={() => {
            // reset to initial
            setRestroAddress(initialData.RestroAddress ?? "");
            setCity(initialData.City ?? "");
            setStateVal(initialData.State ?? "");
            setDistrict(initialData.District ?? "");
            setPinCode(initialData.PinCode ?? "");
            setLatitude(initialData.RestroLatitude ?? "");
            setLongitude(initialData.RestroLongitude ?? "");

            setFssaiNumber(initialData.FSSAINumber ?? "");
            setFssaiExpiry(initialData.FSSAIExpiryDate ?? "");
            setFssaiFileName(initialData.FSSAICopyPath ?? "");
            setFssaiStatus(!!initialData.FSSAIStatus);

            setGstNumber(initialData.GSTNumber ?? "");
            setGstType(initialData.GSTType ?? "");
            setGstFileName(initialData.GSTCopyPath ?? "");
            setGstStatus(!!initialData.GSTStatus);

            setPanNumber(initialData.PANNumber ?? "");
            setPanType(initialData.PANType ?? "");
            setPanFileName(initialData.PANCopyPath ?? "");
            setPanStatus(!!initialData.PANStatus);

            setMessage(null);
            setError(null);
          }}
          style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={saving}
          style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff" }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
