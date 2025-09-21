// components/restro-edit/AddressDocumentsTab.tsx
import React from "react";

type StationOption = { label: string; value: string };

type Props = {
  // these mirror the 'common' object spread from RestroEditModal
  local: any;
  updateField: (key: string, value: any) => void;
  stationDisplay?: string;
  stations?: StationOption[];
  loadingStations?: boolean;
};

export default function AddressDocumentsTab({
  local,
  updateField,
  stationDisplay,
  stations,
  loadingStations,
}: Props) {
  // data fallbacks
  const restroAddress = local?.RestroAddress ?? "";
  const city = local?.City ?? "";
  const stateVal = local?.State ?? "";
  const district = local?.District ?? "";
  const pin = local?.PinCode ?? "";
  const lat = local?.RestroLatitude ?? local?.Latitude ?? "";
  const lng = local?.RestroLongitude ?? local?.Longitude ?? "";

  const fssai = local?.FSSAINumber ?? "";
  const fssaiExpiry = local?.FSSAIExpiry ?? "";
  const gst = local?.GSTNumber ?? "";
  const gstType = local?.GSTType ?? "";
  const pan = local?.PANNumber ?? "";
  const panType = local?.PANType ?? "";

  // small shared styles
  const sectionBoxStyle: React.CSSProperties = {
    background: "#e8f5ff", // light blue background as requested
    padding: 18,
    borderRadius: 10,
    border: "1px solid #d6eaf8",
    marginBottom: 16,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 6,
    color: "#333",
    fontWeight: 600,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #e6eef6",
    background: "#fff",
  };

  const headingLarge: React.CSSProperties = {
    margin: "0 0 12px 0",
    fontSize: 20,
    color: "#083d77",
    fontWeight: 700,
  };

  return (
    <div style={{ padding: "6px 6px 30px 6px" }}>
      {/* NOTE: removed the duplicate station header here (you said red-marked area should be removed).
          The global modal header already shows "1001 / Hotel Yash Palace (SUR) Solapur Jn". */}

      {/* Address SECTION (larger box with blue background) */}
      <div style={sectionBoxStyle}>
        <h3 style={headingLarge}>Address</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / span 3" }}>
            <label style={labelStyle}>Restro Address</label>
            <textarea
              name="RestroAddress"
              value={restroAddress}
              onChange={(e) => updateField("RestroAddress", e.target.value)}
              style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={labelStyle}>City / Village</label>
            <input name="City" value={city} onChange={(e) => updateField("City", e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>State</label>
            <input name="State" value={stateVal} onChange={(e) => updateField("State", e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>District</label>
            <input name="District" value={district} onChange={(e) => updateField("District", e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Pin Code</label>
            <input name="PinCode" value={pin} onChange={(e) => updateField("PinCode", e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Latitude</label>
              <input name="RestroLatitude" value={lat} onChange={(e) => updateField("RestroLatitude", e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Longitude</label>
              <input name="RestroLongitude" value={lng} onChange={(e) => updateField("RestroLongitude", e.target.value)} style={inputStyle} />
            </div>
          </div>
        </div>
      </div>

      {/* Documents SECTION (larger box with blue background) */}
      <div style={sectionBoxStyle}>
        <h3 style={headingLarge}>Documents</h3>

        <div style={{ display: "grid", gap: 12 }}>
          {/* FSSAI row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 140px 120px", gap: 12, alignItems: "center" }}>
            <div>
              <label style={labelStyle}>FSSAI Number</label>
              <input name="FSSAINumber" value={fssai} onChange={(e) => updateField("FSSAINumber", e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>FSSAI Expiry</label>
              <input type="date" name="FSSAIExpiry" value={fssaiExpiry} onChange={(e) => updateField("FSSAIExpiry", e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Upload Copy</label>
              <input type="file" name="FSSAICopy" onChange={() => { /* implement upload flow separately */ }} />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <button
                type="button"
                onClick={() => updateField("FSSAIStatus", !(local?.FSSAIStatus ?? false))}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: local?.FSSAIStatus ? "#16a34a" : "#9ca3af",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {local?.FSSAIStatus ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* GST row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 140px 120px", gap: 12, alignItems: "center" }}>
            <div>
              <label style={labelStyle}>GST Number</label>
              <input name="GSTNumber" value={gst} onChange={(e) => updateField("GSTNumber", e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>GST Type</label>
              <select name="GSTType" value={gstType} onChange={(e) => updateField("GSTType", e.target.value)} style={inputStyle as React.CSSProperties}>
                <option value="">-- Select --</option>
                <option value="Regular">Regular</option>
                <option value="Composition">Composition</option>
                <option value="NotApplicable">Not Applicable</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Upload Copy</label>
              <input type="file" name="GSTCopy" onChange={() => { /* implement upload */ }} />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <button
                type="button"
                onClick={() => updateField("GSTStatus", !(local?.GSTStatus ?? false))}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: local?.GSTStatus ? "#16a34a" : "#9ca3af",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {local?.GSTStatus ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* PAN row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 140px 120px", gap: 12, alignItems: "center" }}>
            <div>
              <label style={labelStyle}>PAN Number</label>
              <input name="PANNumber" value={pan} onChange={(e) => updateField("PANNumber", e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>PAN Type</label>
              <select name="PANType" value={panType} onChange={(e) => updateField("PANType", e.target.value)} style={inputStyle as React.CSSProperties}>
                <option value="">-- Select --</option>
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Upload Copy</label>
              <input type="file" name="PANCopy" onChange={() => { /* implement upload */ }} />
            </div>

            <div>
              <label style={labelStyle}>Status</label>
              <button
                type="button"
                onClick={() => updateField("PANStatus", !(local?.PANStatus ?? false))}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: local?.PANStatus ? "#16a34a" : "#9ca3af",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {local?.PANStatus ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div style={{ color: "#666", fontSize: 13 }}>
        Note: File uploads are placeholders — implement Supabase storage signed uploads or server endpoint to persist files.
      </div>
    </div>
  );
}
