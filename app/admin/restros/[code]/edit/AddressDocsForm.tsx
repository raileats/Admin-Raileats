"use client";

import React, { useState } from "react";

type Props = {
  initialData: any; // restro row from RestroMaster (passed from server page)
  restroCode: number;
};

export default function AddressDocsForm({ initialData, restroCode }: Props) {
  // initialise form state from initialData (safe fallback)
  const [restroAddress, setRestroAddress] = useState(initialData?.RestroAddress ?? "");
  const [city, setCity] = useState(initialData?.City ?? "");
  const [stateVal, setStateVal] = useState(initialData?.State ?? "");
  const [district, setDistrict] = useState(initialData?.District ?? "");
  const [pinCode, setPinCode] = useState(initialData?.PinCode ?? "");
  const [lat, setLat] = useState(initialData?.RestroLatitude ?? "");
  const [lng, setLng] = useState(initialData?.RestroLongitude ?? "");

  // Documents
  const [fssai, setFssai] = useState(initialData?.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(initialData?.FSSAIExpiryDate ?? "");
  const [fssaiCopyName, setFssaiCopyName] = useState(initialData?.FSSAICopyPath ?? "");
  const [fssaiStatus, setFssaiStatus] = useState(
    initialData?.FSSAIStatus === null || initialData?.FSSAIStatus === undefined
      ? true
      : Boolean(initialData?.FSSAIStatus)
  );

  const [gst, setGst] = useState(initialData?.GSTNumber ?? "");
  const [gstType, setGstType] = useState(initialData?.GSTType ?? "");
  const [gstCopyName, setGstCopyName] = useState(initialData?.GSTCopyPath ?? "");
  const [gstStatus, setGstStatus] = useState(
    initialData?.GSTStatus === null || initialData?.GSTStatus === undefined
      ? true
      : Boolean(initialData?.GSTStatus)
  );

  const [pan, setPan] = useState(initialData?.PANNumber ?? "");
  const [panType, setPanType] = useState(initialData?.PANType ?? "");
  const [panCopyName, setPanCopyName] = useState(initialData?.PANCopyPath ?? "");
  const [panStatus, setPanStatus] = useState(
    initialData?.PANStatus === null || initialData?.PANStatus === undefined
      ? true
      : Boolean(initialData?.PANStatus)
  );

  // UI state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // helper for toggles (simple)
  const toggle = (s: boolean, set: (v: boolean) => void) => set(!s);

  // file inputs: we won't upload to storage here (out of scope).
  // We'll just show chosen filename and user must implement actual upload flow later.
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setter(f.name);
      // TODO: implement upload to Supabase storage or to API; currently we just store filename
    }
  }

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      // build body with allowed fields only (must match server whitelist)
      const body: Record<string, any> = {
        RestroAddress: restroAddress,
        City: city,
        State: stateVal,
        District: district,
        PinCode: pinCode,
        RestroLatitude: lat,
        RestroLongitude: lng,

        FSSAINumber: fssai,
        FSSAIExpiryDate: fssaiExpiry,
        FSSAICopyPath: fssaiCopyName,
        FSSAIStatus: fssaiStatus ? 1 : 0,

        GSTNumber: gst,
        GSTType: gstType,
        GSTCopyPath: gstCopyName,
        GSTStatus: gstStatus ? 1 : 0,

        PANNumber: pan,
        PANType: panType,
        PANCopyPath: panCopyName,
        PANStatus: panStatus ? 1 : 0,
      };

      const res = await fetch(`/api/restros/${encodeURIComponent(String(restroCode))}/address-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        console.error("save error", json);
        setError(json?.error ?? "Save failed");
      } else {
        setMessage("Saved successfully");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} style={{ minWidth: 700 }}>
      {/* big header area similar to Basic Information layout */}
      <div style={{ marginBottom: 18 }}>
        {/* Address section (light blue panel like Basic/Station) */}
        <div
          style={{
            padding: 18,
            borderRadius: 8,
            background: "#eaf6ff",
            marginBottom: 16,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", color: "#0b4a6f" }}>Address</h3>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>Restro Address</label>
            <textarea
              value={restroAddress}
              onChange={(e) => setRestroAddress(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>City / Village</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>State</label>
              <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>District</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>Pin Code</label>
              <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>Latitude</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "#333", marginBottom: 6 }}>Longitude</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
            </div>
          </div>
        </div>

        {/* Documents section */}
        <div
          style={{
            padding: 18,
            borderRadius: 8,
            background: "#eaf6ff",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", color: "#0b4a6f" }}>Documents</h3>

          <div style={{ display: "grid", gap: 12 }}>
            {/* FSSAI row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 160px 80px", gap: 12, alignItems: "center" }}>
              <div>
                <label style={{ fontSize: 13, color: "#333" }}>FSSAI Number</label>
                <input value={fssai} onChange={(e) => setFssai(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>FSSAI Expiry</label>
                <input type="date" value={fssaiExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>Upload Copy</label>
                <input type="file" onChange={(e) => handleFileChange(e, setFssaiCopyName)} />
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{fssaiCopyName ? `File: ${fssaiCopyName}` : "No file chosen"}</div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>Status</label>
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => toggle(fssaiStatus, setFssaiStatus)}
                    style={{
                      background: fssaiStatus ? "#16a34a" : "#9ca3af",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {fssaiStatus ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>

            {/* GST row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px 80px", gap: 12, alignItems: "center" }}>
              <div>
                <label style={{ fontSize: 13, color: "#333" }}>GST Number</label>
                <input value={gst} onChange={(e) => setGst(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>GST Type</label>
                <input value={gstType} onChange={(e) => setGstType(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>Upload Copy</label>
                <input type="file" onChange={(e) => handleFileChange(e, setGstCopyName)} />
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{gstCopyName ? `File: ${gstCopyName}` : "No file chosen"}</div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>Status</label>
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => toggle(gstStatus, setGstStatus)}
                    style={{
                      background: gstStatus ? "#16a34a" : "#9ca3af",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {gstStatus ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>

            {/* PAN row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px 80px", gap: 12, alignItems: "center" }}>
              <div>
                <label style={{ fontSize: 13, color: "#333" }}>PAN Number</label>
                <input value={pan} onChange={(e) => setPan(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>PAN Type</label>
                <input value={panType} onChange={(e) => setPanType(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ddd" }} />
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>Upload Copy</label>
                <input type="file" onChange={(e) => handleFileChange(e, setPanCopyName)} />
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>{panCopyName ? `File: ${panCopyName}` : "No file chosen"}</div>
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#333" }}>Status</label>
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => toggle(panStatus, setPanStatus)}
                    style={{
                      background: panStatus ? "#16a34a" : "#9ca3af",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {panStatus ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
        <button
          type="button"
          onClick={() => {
            // emulate cancel — navigate back to main list (close modal)
            // since this is embedded in layout we can use window.history
            window.history.back();
          }}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fff" }}
        >
          Cancel
        </button>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {message && <div style={{ color: "#16a34a" }}>{message}</div>}
          {error && <div style={{ color: "red" }}>{error}</div>}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "none",
              background: "#0ea5e9",
              color: "#fff",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
