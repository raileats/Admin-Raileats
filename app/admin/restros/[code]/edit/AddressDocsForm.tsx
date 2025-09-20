// app/admin/restros/[code]/edit/AddressDocsForm.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  params?: { code?: string };
};

export default function AddressDocsForm({ params }: Props) {
  const code = params?.code ?? "";
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pin, setPin] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // placeholder: if you want to fetch restro details client-side, do it here.
  useEffect(() => {
    // optional: fetch existing address from an API if available
    // example: fetch(`/api/restros/${code}`)
    // .then(...)
  }, [code]);

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ textAlign: "center", marginBottom: 12 }}>Address & Documents</h3>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Address block */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Restro Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: "100%", minHeight: 80, padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>City / Village</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Pin Code</label>
            <input value={pin} onChange={(e) => setPin(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Restro Latitude</label>
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Restro Longitude</label>
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>
        </div>

        {/* Documents placeholder */}
        <div style={{ marginTop: 18, borderTop: "1px solid #eee", paddingTop: 18 }}>
          <h4>Documents</h4>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 12 }}>
            <div style={{ padding: 12, background: "#fff", borderRadius: 6, border: "1px solid #eee" }}>
              <div style={{ marginBottom: 8 }}>FSSAI Number</div>
              <input placeholder="14-digit FSSAI" style={{ width: "100%", padding: 8 }} />
              <div style={{ marginTop: 8 }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
              </div>
            </div>

            <div style={{ padding: 12, background: "#fff", borderRadius: 6, border: "1px solid #eee" }}>
              <div style={{ marginBottom: 8 }}>GST Number</div>
              <input placeholder="GST Number" style={{ width: "100%", padding: 8 }} />
              <div style={{ marginTop: 8 }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
              </div>
            </div>

            <div style={{ padding: 12, background: "#fff", borderRadius: 6, border: "1px solid #eee" }}>
              <div style={{ marginBottom: 8 }}>PAN Number</div>
              <input placeholder="PAN Number" style={{ width: "100%", padding: 8 }} />
              <div style={{ marginTop: 8 }}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          <button type="button" onClick={() => { setAddress(""); setCity(""); setPin(""); setLatitude(""); setLongitude(""); }} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}>
            Cancel
          </button>

          <button
            type="button"
            onClick={() => alert("Save API not implemented yet. Create API route /app/api/restros/[code]/address-docs/route.ts and call it from here.")}
            disabled={loading}
            style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#06a3d9", color: "#fff" }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
