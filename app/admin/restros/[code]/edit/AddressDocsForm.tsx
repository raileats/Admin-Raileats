// app/admin/restros/[code]/edit/AddressDocsForm.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = { params?: { code?: string } };

export default function AddressDocsForm({ params }: Props) {
  const code = params?.code ?? "";

  // simple local state placeholders (you will wire to API later)
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [district, setDistrict] = useState("");
  const [pin, setPin] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  useEffect(() => {
    // Optional: fetch existing data via client API (e.g. /api/restros/[code])
    // fetch(`/api/restros/${code}`).then(...)
  }, [code]);

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ textAlign: "center" }}>Address & Documents</h3>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <label>Restro Address</label>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: "100%", minHeight: 80 }} />
          </div>
          <div>
            <label>City / Village</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <label>State</label>
            <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} style={{ width: "100%" }} />
          </div>

          <div>
            <label>District</label>
            <input value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div>
            <label>Pin Code</label>
            <input value={pin} onChange={(e) => setPin(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} style={{ flex: 1 }} />
            <input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} style={{ flex: 1 }} />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h4>Documents</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <div style={{ padding: 12, border: "1px solid #eee" }}>
              <div>FSSAI Number</div>
              <input style={{ width: "100%" }} placeholder="14-digit FSSAI" />
              <div style={{ marginTop: 8 }}><input type="file" accept=".pdf,.jpg,.png" /></div>
            </div>

            <div style={{ padding: 12, border: "1px solid #eee" }}>
              <div>GST Number</div>
              <input style={{ width: "100%" }} placeholder="GST Number" />
              <div style={{ marginTop: 8 }}><input type="file" accept=".pdf,.jpg,.png" /></div>
            </div>

            <div style={{ padding: 12, border: "1px solid #eee" }}>
              <div>PAN Number</div>
              <input style={{ width: "100%" }} placeholder="PAN Number" />
              <div style={{ marginTop: 8 }}><input type="file" accept=".pdf,.jpg,.png" /></div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
          <button type="button">Cancel</button>
          <button
            type="button"
            onClick={() => {
              alert("Save not wired. Implement server route /api/restros/[code]/address-docs to persist.");
            }}
            style={{ background: "#06a3d9", color: "#fff", padding: "8px 12px", border: "none", borderRadius: 6 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
