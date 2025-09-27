// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  initialData?: any;
  imagePrefix?: string;
};

function tryParseJSON(value: any) {
  if (typeof value !== "string") return value;
  try {
    const p = JSON.parse(value);
    return p;
  } catch {
    return value;
  }
}

export default function AddressDocsClient({ initialData = {}, imagePrefix = "" }: Props) {
  const [dump, setDump] = useState<any>(null);

  // tolerant extractor: returns first non-empty string found among many candidate keys
  const extractState = (row: any) => {
    if (!row) return "";
    const candidates = [
      "State",
      "StateName",
      "state",
      "stateName",
      "State_Code",
      "StateCode",
      "statecode",
      "Sate", // your typo
      "State Name",
      "state name",
      "SATE",
      "STATE",
      "state_code",
      "state_code",
      // possible nested
    ];

    for (const k of candidates) {
      if (k in row) {
        const v = row[k];
        if (v !== null && v !== undefined && String(v).trim() !== "") return String(v);
      }
    }

    // Try scanning all keys for something that looks like a state name (alphabetic, length 3+)
    for (const k of Object.keys(row)) {
      const v = row[k];
      if (typeof v === "string" && /^[A-Za-z\s\-&,.'()]{3,}$/.test(v) && v.length < 80) {
        // heuristics: skip very long text (address)
        const low = String(v).toLowerCase();
        // avoid address-like strings that contain digits or many commas
        if (/\d/.test(low)) continue;
        if ((low.match(/,/g) || []).length > 2) continue;
        return v;
      }
    }

    return "";
  };

  const extractDistrict = (row: any) => {
    if (!row) return "";
    const candidates = [
      "Districts",
      "District",
      "DistrictName",
      "district",
      "districts",
      "DistrictsName",
      "Districts Name",
      "District Name",
      "district_name",
      "districts_name",
      "Districts",
    ];

    for (const k of candidates) {
      if (k in row) {
        const raw = row[k];
        if (raw === null || raw === undefined) continue;
        // try parse if JSON string stored
        const parsed = tryParseJSON(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => (typeof x === "object" ? x.name ?? JSON.stringify(x) : String(x))).join(", ");
        }
        if (typeof parsed === "object") {
          // object -> try common fields
          if ("name" in parsed) return String(parsed.name);
          return JSON.stringify(parsed);
        }
        if (String(parsed).trim() !== "") return String(parsed);
      }
    }

    // fallback: look for keys that contain 'district' substring
    for (const k of Object.keys(row)) {
      if (k.toLowerCase().includes("district")) {
        const raw = row[k];
        const parsed = tryParseJSON(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => (typeof x === "object" ? x.name ?? JSON.stringify(x) : String(x))).join(", ");
        }
        if (parsed && String(parsed).trim() !== "") return String(parsed);
      }
    }

    return "";
  };

  // Normalize: some APIs return 'data' or 'row' wrapper
  const findPossibleRow = (data: any) => {
    if (!data) return {};
    // if it's an array with single element, prefer first element
    if (Array.isArray(data) && data.length === 1 && typeof data[0] === "object") return data[0];
    // some results wrap in { data: {...} } or { row: {...} }
    const wrapperKeys = ["data", "row", "restro", "result"];
    for (const k of wrapperKeys) {
      if (data && typeof data === "object" && k in data && data[k]) {
        if (Array.isArray(data[k]) && data[k].length === 1 && typeof data[k][0] === "object") return data[k][0];
        if (typeof data[k] === "object") return data[k];
      }
    }
    // if it's already an object (likely the row)
    if (typeof data === "object") return data;
    return {};
  };

  // derived values
  const row = findPossibleRow(initialData);
  const stateVal = extractState(row);
  const districtVal = extractDistrict(row);

  useEffect(() => {
    // create a debug dump for you to inspect
    const fullDump = {
      initialData,
      possibleRow: row,
      allKeys: Object.keys(initialData || {}).slice(0, 200),
      stateCandidates: {
        extracted: stateVal,
        scannedKeys: Object.keys(row).map((k) => ({ key: k, val: row[k] })).slice(0, 200),
      },
      districtCandidates: {
        extracted: districtVal,
      },
    };
    setDump(fullDump);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const imgSrc = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http://") || p.startsWith("https://")) return p;
    return (imagePrefix ?? "") + p;
  };

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ textAlign: "center", marginBottom: 18, fontSize: 20 }}>Address & Documents</h3>

      <div className="compact-grid">
        <div className="field full-col">
          <label>Restro Address</label>
          <textarea value={String(row?.RestroAddress ?? row?.Address ?? row?.AddressLine ?? "")} readOnly />
        </div>

        <div className="field">
          <label>City / Village</label>
          <input value={String(row?.City ?? row?.CityName ?? "")} readOnly />
        </div>

        <div className="field">
          <label>State</label>
          <input value={stateVal} readOnly />
        </div>

        <div className="field">
          <label>District</label>
          <input value={districtVal} readOnly />
        </div>

        <div className="field">
          <label>Pin Code</label>
          <input value={String(row?.PinCode ?? row?.Pincode ?? "")} readOnly />
        </div>

        <div className="field">
          <label>Latitude</label>
          <input value={String(row?.Latitude ?? "")} readOnly />
        </div>

        <div className="field">
          <label>Longitude</label>
          <input value={String(row?.Longitude ?? "")} readOnly />
        </div>
      </div>

      <div style={{ height: 18 }} />

      <div className="compact-grid">
        <div className="field">
          <label>FSSAI Number</label>
          <input value={String(row?.FSSAINumber ?? row?.FSSAI ?? "")} readOnly />
        </div>

        <div className="field">
          <label>FSSAI Expiry</label>
          <input type="date" value={String(row?.FSSAIExpiry ?? "")} readOnly />
        </div>

        <div className="field">
          <label>GST Number</label>
          <input value={String(row?.GSTNumber ?? row?.GSTno ?? "")} readOnly />
        </div>

        <div className="field">
          <label>GST Type</label>
          <input value={String(row?.GSTType ?? "")} readOnly />
        </div>

        <div className="field">
          <label>Display Preview</label>
          {row?.RestroDisplayPhoto || row?.photo ? (
            <img src={imgSrc(String(row?.RestroDisplayPhoto ?? row?.photo ?? ""))} alt="display" className="preview" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div className="readonly">No image</div>
          )}
        </div>
      </div>

      {/* DEBUG PANEL - show full dump to help identify keys */}
      <div style={{ marginTop: 18, background: "#fff8e6", padding: 12, borderRadius: 6 }}>
        <strong>DEBUG: initialData shape & candidates</strong>
        <div style={{ marginTop: 8 }}>
          <strong>Extracted State:</strong> {stateVal || "(empty)"}
        </div>
        <div>
          <strong>Extracted District:</strong> {districtVal || "(empty)"}
        </div>
        <div style={{ marginTop: 10 }}>
          <strong>Top-level keys in initialData:</strong>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 220, overflow: "auto", background: "#fff", padding: 8 }}>{JSON.stringify(Object.keys(initialData || {}).slice(0, 200), null, 2)}</pre>
        </div>

        <div style={{ marginTop: 10 }}>
          <strong>Possible row (object chosen for scanning):</strong>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto", background: "#fff", padding: 8 }}>{JSON.stringify(row, null, 2)}</pre>
        </div>

        <div style={{ marginTop: 10 }}>
          <strong>Scanned keys & values (sample):</strong>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto", background: "#fff", padding: 8 }}>
            {JSON.stringify(Object.keys(row || {}).map((k) => ({ key: k, value: row[k] })).slice(0, 200), null, 2)}
          </pre>
        </div>
      </div>

      <style jsx>{`
        .compact-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px 18px;
          max-width: 1100px;
          margin: 0 auto;
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
          background: #f9f9f9;
          box-sizing: border-box;
        }
        textarea {
          min-height: 80px;
          resize: vertical;
        }
        .preview {
          height: 80px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
        }
        .readonly {
          padding: 8px 10px;
          border-radius: 6px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
          font-size: 13px;
        }
        @media (max-width: 1100px) {
          .compact-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 720px) {
          .compact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
