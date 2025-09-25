// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Replacement AddressDocsClient component with section header / margins
 * adjusted to match the look-and-feel of "Basic Information" and
 * "Station Settings" tabs.
 *
 * Drop this file in place of your current components/tabs/AddressDocsClient.tsx
 * and it should make the heading, font sizing and left/right margins
 * consistent with the other tabs.
 */

type Props = {
  initialData?: any;
  imagePrefix?: string;
};

export default function AddressDocsClient({ initialData = {}, imagePrefix = "" }: Props) {
  const router = useRouter();

  const [local, setLocal] = useState<any>({
    RestroAddress: initialData?.RestroAddress ?? "",
    City: initialData?.City ?? "",
    State: initialData?.State ?? "",
    District: initialData?.District ?? "",
    PinCode: initialData?.PinCode ?? "",
    Latitude: initialData?.Latitude ?? "",
    Longitude: initialData?.Longitude ?? "",
    FSSAINumber: initialData?.FSSAINumber ?? "",
    FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
    GSTNumber: initialData?.GSTNumber ?? "",
    GSTType: initialData?.GSTType ?? "",
  });

  useEffect(() => {
    setLocal({
      RestroAddress: initialData?.RestroAddress ?? "",
      City: initialData?.City ?? "",
      State: initialData?.State ?? "",
      District: initialData?.District ?? "",
      PinCode: initialData?.PinCode ?? "",
      Latitude: initialData?.Latitude ?? "",
      Longitude: initialData?.Longitude ?? "",
      FSSAINumber: initialData?.FSSAINumber ?? "",
      FSSAIExpiry: initialData?.FSSAIExpiry ?? "",
      GSTNumber: initialData?.GSTNumber ?? "",
      GSTType: initialData?.GSTType ?? "",
    });
  }, [initialData]);

  function update(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
  }

  // If you need to show images later, build URL like:
  // const someUrl = imagePrefix ? `${imagePrefix}/${imagePath}` : imagePath;

  return (
    <div className="admin-form-wrapper">
      {/* Section header - matches size/weight used in other tabs */}
      <div className="section-header">
        <h4 className="section-title">Address &amp; Documents</h4>
      </div>

      {/* Body that keeps the same left/right margins as other tabs */}
      <div className="section-body">
        <div className="compact-grid">
          <div className="field full-col">
            <label>Restro Address</label>
            <textarea value={local.RestroAddress ?? ""} onChange={(e) => update("RestroAddress", e.target.value)} />
          </div>

          <div className="field">
            <label>City / Village</label>
            <input value={local.City ?? ""} onChange={(e) => update("City", e.target.value)} />
          </div>

          <div className="field">
            <label>State</label>
            <input value={local.State ?? ""} onChange={(e) => update("State", e.target.value)} />
          </div>

          <div className="field">
            <label>District</label>
            <input value={local.District ?? ""} onChange={(e) => update("District", e.target.value)} />
          </div>

          <div className="field">
            <label>Pin Code</label>
            <input value={local.PinCode ?? ""} onChange={(e) => update("PinCode", e.target.value)} />
          </div>

          <div className="field">
            <label>Latitude</label>
            <input value={local.Latitude ?? ""} onChange={(e) => update("Latitude", e.target.value)} />
          </div>

          <div className="field">
            <label>Longitude</label>
            <input value={local.Longitude ?? ""} onChange={(e) => update("Longitude", e.target.value)} />
          </div>
        </div>

        <div style={{ height: 18 }} />

        <div className="compact-grid">
          <div className="field">
            <label>FSSAI Number</label>
            <input value={local.FSSAINumber ?? ""} onChange={(e) => update("FSSAINumber", e.target.value)} />
          </div>

          <div className="field">
            <label>FSSAI Expiry</label>
            <input type="date" value={local.FSSAIExpiry ?? ""} onChange={(e) => update("FSSAIExpiry", e.target.value)} />
          </div>

          <div className="field">
            <label>GST Number</label>
            <input value={local.GSTNumber ?? ""} onChange={(e) => update("GSTNumber", e.target.value)} />
          </div>

          <div className="field">
            <label>GST Type</label>
            <input value={local.GSTType ?? ""} onChange={(e) => update("GSTType", e.target.value)} />
          </div>
        </div>
      </div>

      <style jsx>{`
        /* wrapper padding tuned to match other tab content (left/right margins)
           and to keep the section body aligned with Basic Information / Station Settings */
        .admin-form-wrapper {
          padding: 18px 28px; /* tweak if your other components use slightly different values */
        }

        .section-header {
          padding-top: 4px;
          padding-bottom: 6px;
          border-bottom: none; /* keep minimal - other tabs show simple centered title */
        }

        .section-title {
          margin: 0;
          font-size: 15px; /* smaller than big h3, matches "Basic Information" look */
          font-weight: 600;
          color: #222;
          text-align: center;
          letter-spacing: 0.1px;
        }

        .section-body {
          max-width: 1100px; /* same container width used by other tabs */
          margin: 0 auto; /* keeps left/right consistent */
          padding-top: 18px;
        }

        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
        }

        .field.full-col {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          font-size: 13px;
          color: #444;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .field input,
        textarea {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          font-size: 13px;
          background: #fff;
          box-sizing: border-box;
        }

        textarea {
          min-height: 80px;
          resize: vertical;
        }

        @media (max-width: 1100px) {
          .compact-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-form-wrapper {
            padding-left: 20px;
            padding-right: 20px;
          }
        }

        @media (max-width: 720px) {
          .compact-grid {
            grid-template-columns: 1fr;
          }

          .admin-form-wrapper {
            padding-left: 14px;
            padding-right: 14px;
          }
        }
      `}</style>
    </div>
  );
}
