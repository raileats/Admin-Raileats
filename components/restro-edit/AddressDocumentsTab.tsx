// components/restro-edit/AddressDocumentsTab.tsx
import React from "react";

type StationOption = { label: string; value: string };

type Props = {
  // these mirror the 'common' object spread from RestroEditModal
  local: any;
  updateField: (key: string, value: any) => void;
  stationDisplay: string;
  stations: StationOption[];
  loadingStations?: boolean;
};

export default function AddressDocumentsTab({ local, updateField, stationDisplay, stations, loadingStations }: Props) {
  // fallbacks
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

  return (
    <div style={{ padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>Address & Documents</h3>

      {/* Station (readonly) */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 13, color: "#444", marginBottom: 6, fontWeight: 600 }}>Station</label>
        <div style={{ padding: 8, borderRadius: 6, background: "#fafafa", border: "1px solid #f0f0f0" }}>{stationDisplay || "—"}</div>
      </div>

      <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
        <h4 style={{ marginTop: 0 }}>Address</h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1 / span 3" }}>
            <label style={{ display: "block", marginBottom: 6 }}>Restro Address</label>
            <textarea
              name="RestroAddress"
              value={restroAddress}
              onChange={(e) => updateField("RestroAddress", e.target.value)}
              style={{ width: "100%", minHeight: 80, padding: 8 }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>City / Village</label>
            <input name="City" value={city} onChange={(e) => updateField("City", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>State</label>
            <input name="State" value={stateVal} onChange={(e) => updateField("State", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>District</label>
            <input name="District" value={district} onChange={(e) => updateField("District", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Pin Code</label>
            <input name="PinCode" value={pin} onChange={(e) => updateField("PinCode", e.target.value)} style={{ width: "100%", padding: 8 }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Latitude</label>
              <input name="RestroLatitude" value={lat} onChange={(e) => updateField("RestroLatitude", e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Longitude</label>
              <input name="RestroLongitude" value={lng} onChange={(e) => updateField("RestroLongitude", e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div style={{ marginTop: 16, background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
        <h4 style={{ marginTop: 0 }}>Documents</h4>

        <div style={{ display: "grid", gap: 12 }}>
          {/* FSSAI row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 240px 160px 120px", gap: 12, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", marginBottom: 6 }}>FSSAI Number</label>
              <input name="FSSAINumber" value={fssai} onChange={(e) => updateField("FSSAINumber", e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>FSSAI Expiry</label>
              <input type="date" name="FSSAIExpiry" value={fssaiExpiry} onChange={(e) => updateField("FSSAIExpiry", e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Upload Copy</label>
              <input type="file" name="FSSAICopy" onChange={() => {/* handle file upload separately */}} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Status</label>
              <button
                type="button"
                onClick={() => updateField("FSSAIStatus", !(local?.FSSAIStatus ?? false))}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: local?.FSSAIStatus ? "#16a34a" : "#d1d5db",
                  color: local?.FSSAIStatus ? "#fff" : "#111",
                }}
              >
                {local?.FSSAIStatus ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* GST row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 240px 160px 120px", gap: 12, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", marginBottom: 6 }}>GST Number</label>
              <input name="GSTNumber" value={gst} onChange={(e) => updateField("GSTNumber", e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>GST Type</label>
              <select name="GSTType" value={gstType} onChange={(e) => updateField("GSTType", e.target.value)} style={{ width: "100%", padding: 8 }}>
                <option value="">--Select--</option>
                <option value="Regular">Regular</option>
                <option value="Composition">Composition</option>
                <option value="NotApplicable">Not Applicable</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Upload Copy</label>
              <input type="file" name="GSTCopy" onChange={() => {/* handle file upload separately */}} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Status</label>
              <button
                type="button"
                onClick={() => updateField("GSTStatus", !(local?.GSTStatus ?? false))}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: local?.GSTStatus ? "#16a34a" : "#d1d5db",
                  color: local?.GSTStatus ? "#fff" : "#111",
                }}
              >
                {local?.GSTStatus ? "On" : "Off"}
              </button>
            </div>
          </div>

          {/* PAN row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 240px 160px 120px", gap: 12, alignItems: "center" }}>
            <div>
              <label style={{ display: "block", marginBottom: 6 }}>PAN Number</label>
              <input name="PANNumber" value={pan} onChange={(e) => updateField("PANNumber", e.target.value)} style={{ width: "100%", padding: 8 }} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>PAN Type</label>
              <select name="PANType" value={panType} onChange={(e) => updateField("PANType", e.target.value)} style={{ width: "100%", padding: 8 }}>
                <option value="">--Select--</option>
                <option value="Individual">Individual</option>
                <option value="Company">Company</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Upload Copy</label>
              <input type="file" name="PANCopy" onChange={() => {/* handle file upload separately */}} />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>Status</label>
              <button
                type="button"
                onClick={() => updateField("PANStatus", !(local?.PANStatus ?? false))}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: local?.PANStatus ? "#16a34a" : "#d1d5db",
                  color: local?.PANStatus ? "#fff" : "#111",
                }}
              >
                {local?.PANStatus ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Helper note */}
      <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
        Note: File uploads are placeholders — implement Supabase storage signed uploads or server endpoints to handle files.
      </div>
    </div>
  );
}
