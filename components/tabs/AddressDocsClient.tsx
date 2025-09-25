// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useState, useEffect } from "react";

type Props = {
  initialData?: any;
  imagePrefix?: string;
  restro?: any;
};

export default function AddressDocsClient({ initialData = {}, restro = null, imagePrefix = "" }: Props) {
  const init = initialData ?? restro ?? {};

  const [restroAddress, setRestroAddress] = useState(init.RestroAddress ?? "");
  const [city, setCity] = useState(init.City ?? "");
  const [stateVal, setStateVal] = useState(init.State ?? "");
  const [district, setDistrict] = useState(init.District ?? "");
  const [pinCode, setPinCode] = useState(init.PinCode ?? "");
  const [latitude, setLatitude] = useState(init.Latitude ?? "");
  const [longitude, setLongitude] = useState(init.Longitude ?? "");
  const [fssaiNumber, setFssaiNumber] = useState(init.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(init.FSSAIExpiry ?? "");
  const [gstNumber, setGstNumber] = useState(init.GSTNumber ?? "");

  // keep local copy in case initialData changes
  useEffect(() => {
    setRestroAddress(init.RestroAddress ?? "");
    setCity(init.City ?? "");
    setStateVal(init.State ?? "");
    setDistrict(init.District ?? "");
    setPinCode(init.PinCode ?? "");
    setLatitude(init.Latitude ?? "");
    setLongitude(init.Longitude ?? "");
    setFssaiNumber(init.FSSAINumber ?? "");
    setFssaiExpiry(init.FSSAIExpiry ?? "");
    setGstNumber(init.GSTNumber ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, restro]);

  // NOTE: We intentionally do NOT render internal Save/Cancel here.
  // Modal's outer fixed Save/Cancel should handle submit via /api/restros/<code>.
  // If you want this component to perform its own save, add a handler and the modal should not duplicate.

  return (
    <div style={{ padding: 18 }}>
      {/* wrapper to match BasicInfoClient centering & max-width */}
      <div className="content-wrap">
        <div className="card">
          <div className="heading">Address</div>

          <div className="field full">
            <label>Restro Address</label>
            <textarea value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} />
          </div>

          <div className="compact-grid">
            <div className="field">
              <label>City / Village</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div className="field">
              <label>State</label>
              <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
            </div>

            <div className="field">
              <label>District</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>

            <div className="field">
              <label>Pin Code</label>
              <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} />
            </div>

            <div className="field">
              <label>Latitude</label>
              <input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </div>

            <div className="field">
              <label>Longitude</label>
              <input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18 }}>
          <div className="heading">Documents</div>

          <div className="compact-grid">
            <div className="field">
              <label>FSSAI Number</label>
              <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} />
            </div>

            <div className="field">
              <label>FSSAI Expiry</label>
              <input type="date" value={fssaiExpiry ?? ""} onChange={(e) => setFssaiExpiry(e.target.value)} />
            </div>

            <div className="field">
              <label>GST Number</label>
              <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .content-wrap {
          max-width: 1100px; /* same as Basic */
          margin: 0 auto;
        }
        .card {
          background: #fff;
          border-radius: 6px;
          border: 1px solid #eef6fb;
          padding: 18px;
        }
        .heading {
          font-weight: 700;
          color: #0b5f8a;
          font-size: 18px;
          margin-bottom: 12px;
        }
        label {
          display: block;
          font-size: 13px;
          color: #333;
          margin-bottom: 6px;
        }
        textarea {
          width: 100%;
          min-height: 86px;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e6eef7;
          box-sizing: border-box;
        }
        input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e6eef7;
          box-sizing: border-box;
        }
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 8px;
        }
        .field.full { margin-bottom: 12px; }
        @media (max-width: 1100px) { .compact-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 720px) { .compact-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
