// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <div className="raileats-tab-wrapper">
      <div className="tab-header">
        <h3 className="tab-section-title">Address &amp; Documents</h3>
      </div>

      <div className="tab-body">
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
        /* VARIABLES - tweak these to perfectly match Basic Information / Station Settings */
        :root {
          --tab-padding-vertical: 18px;
          --tab-padding-horizontal: 40px;
          --content-max-width: 1100px;
          --title-font-size: 15px;     /* try 15 or 16 to match other tabs */
          --title-font-weight: 600;
          --title-margin-bottom: 6px;
          --title-color: #222;
          --label-font-size: 13px;
          --label-color: #444;
          --input-font-size: 13px;
        }

        /* outer wrapper uses same left/right padding used by other tabs */
        .raileats-tab-wrapper {
          padding: var(--tab-padding-vertical) var(--tab-padding-horizontal);
        }

        /* header: centered small title (matches other tab styling) */
        .tab-header {
          text-align: center;
          margin-bottom: 2px;
        }

        .tab-section-title {
          margin: 0;
          padding: 0;
          font-size: var(--title-font-size);
          font-weight: var(--title-font-weight);
          color: var(--title-color);
          letter-spacing: 0.2px;
        }

        /* body container centered like Basic Information / Station Settings */
        .tab-body {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding-top: 12px;
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
          font-size: var(--label-font-size);
          color: var(--label-color);
          margin-bottom: 6px;
          font-weight: 600;
        }

        .field input,
        textarea {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          font-size: var(--input-font-size);
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
          .raileats-tab-wrapper {
            padding-left: 20px;
            padding-right: 20px;
          }
        }

        @media (max-width: 720px) {
          .compact-grid {
            grid-template-columns: 1fr;
          }
          .raileats-tab-wrapper {
            padding-left: 14px;
            padding-right: 14px;
          }
        }
      `}</style>
    </div>
  );
}
