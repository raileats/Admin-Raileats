// app/admin/restros/[code]/edit/AddressDocsForm.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  params?: { code?: string };
};

export default function AddressDocsForm({ params }: Props) {
  const code = params?.code ?? "";
  const [loading, setLoading] = useState(false);

  // Address fields
  const [restroAddress, setRestroAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [district, setDistrict] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  useEffect(() => {
    // Optional: load existing address via client API if needed
    // fetch(`/api/restros/${code}`).then(...)
  }, [code]);

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ textAlign: "center", marginBottom: 12 }}>Address & Documents</h3>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Address grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Restro Address</label>
            <textarea value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} style={{ width: "100%", minHeight: 80, padding: 8 }} />
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
            <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Latitude</label>
              <input value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Longitude</label>
              <input value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>
          </div>
        </div>

        {/* Documents area */}
        <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 18 }}>
          <h4>Documents</h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
            <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>FSSAI Number</div>
              <input placeholder="14-digit FSSAI" style={{ width: "100%", padding: 8 }} />
              <div style={{ marginTop: 8 }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" /></div>
            </div>

            <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>GST Number</div>
              <input placeholder="GST Number" style={{ width: "100%", padding: 8 }} />
              <div style={{ marginTop: 8 }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" /></div>
            </div>

            <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 6 }}>
              <div style={{ marginBottom: 8 }}>PAN Number</div>
              <input placeholder="PAN Number" style={{ width: "100%", padding: 8 }} />
              <div style={{ marginTop: 8 }}><input type="file" accept=".pdf,.jpg,.jpeg,.png" /></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          <button type="button" onClick={() => { /* cancel action */ }} style={{ padding: "8px 14px", borderRadius: 6 }}>Cancel</button>
          <button
            type="button"
            onClick={() => alert("Save not implemented yet. Implement /api/restros/[code]/address-docs route to persist.")}
            style={{ padding: "8px 14px", borderRadius: 6, background: "#06a3d9", color: "#fff", border: "none" }}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
