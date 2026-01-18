"use client";

import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";
const { AdminForm, FormRow, FormField, SubmitButton } = UI;

type Props = {
  local: any;
  updateField: (key: string, v: any) => void;
};

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{ width: 42, height: 24, display: "inline-block", borderRadius: 16, background: checked ? "#06b6d4" : "#e5e7eb", position: "relative" }}>
        <span
          onClick={() => onChange(!checked)}
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 22 : 3,
            width: 18,
            height: 18,
            borderRadius: 12,
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
            transition: "left .12s",
          }}
        />
      </span>
      <span style={{ fontSize: 13 }}>{checked ? "Active" : "Inactive"}</span>
    </label>
  );
}

export default function AddressDocumentsTab({ local = {}, updateField }: Props) {
  // Address fields
  const [restroAddress, setRestroAddress] = useState(local?.RestroAddress ?? "");
  const [stateVal, setStateVal] = useState(local?.State ?? "");
  const [city, setCity] = useState(local?.["City/Village"] ?? local?.City ?? "");
  const [district, setDistrict] = useState(local?.District ?? "");
  const [pin, setPin] = useState(local?.PinCode ?? "");
  const [lat, setLat] = useState(local?.RestroLatitude ?? "");
  const [lng, setLng] = useState(local?.RestroLongituden ?? local?.RestroLongitude ?? "");

  // Document single-line values (initial)
  const [fssaiNumber, setFssaiNumber] = useState(local?.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(local?.FSSAIExpiry ?? "");
  const [fssaiCopy, setFssaiCopy] = useState(local?.FSSAICopyUpload ?? "");
  const [fssaiStatus, setFssaiStatus] = useState(local?.FSSAIStatus === "ON" ? "ON" : "OFF");

  const [gstNumber, setGstNumber] = useState(local?.GSTNumber ?? "");
  const [gstType, setGstType] = useState(local?.GSTType ?? "");
  const [gstCopy, setGstCopy] = useState(local?.GSTCopyUpload ?? "");
  const [gstStatus, setGstStatus] = useState(local?.GSTStatus === "ON" ? "ON" : "OFF");

  const [panNumber, setPanNumber] = useState(local?.PANNumber ?? "");
  const [panType, setPanType] = useState(local?.PANType ?? "");
  const [panCopy, setPanCopy] = useState(local?.UploadPanCopy ?? "");
  const [panStatus, setPanStatus] = useState(local?.PANStatus === "ON" ? "ON" : "OFF");

  // Modal state
  const [modalOpen, setModalOpen] = useState<null | "FSSAI" | "GST" | "PAN">(null);
  const [modalNumber, setModalNumber] = useState("");
  const [modalExpiry, setModalExpiry] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalTypeValue, setModalTypeValue] = useState("");

  // Keep local state in sync when parent 'local' updates externally
  useEffect(() => {
    setRestroAddress(local?.RestroAddress ?? "");
    setStateVal(local?.State ?? "");
    setCity(local?.["City/Village"] ?? local?.City ?? "");
    setDistrict(local?.District ?? "");
    setPin(local?.PinCode ?? "");
    setLat(local?.RestroLatitude ?? "");
    setLng(local?.RestroLongituden ?? local?.RestroLongitude ?? "");

    setFssaiNumber(local?.FSSAINumber ?? "");
    setFssaiExpiry(local?.FSSAIExpiry ?? "");
    setFssaiCopy(local?.FSSAICopyUpload ?? "");
    setFssaiStatus(local?.FSSAIStatus === "ON" ? "ON" : "OFF");

    setGstNumber(local?.GSTNumber ?? "");
    setGstType(local?.GSTType ?? "");
    setGstCopy(local?.GSTCopyUpload ?? "");
    setGstStatus(local?.GSTStatus === "ON" ? "ON" : "OFF");

    setPanNumber(local?.PANNumber ?? "");
    setPanType(local?.PANType ?? "");
    setPanCopy(local?.UploadPanCopy ?? "");
    setPanStatus(local?.PANStatus === "ON" ? "ON" : "OFF");
  }, [local]);

  // Auto-deactivate expired FSSAI (compare date portion)
  useEffect(() => {
    if (!fssaiExpiry) return;
    try {
      const exp = new Date(fssaiExpiry);
      exp.setHours(23, 59, 59, 999);
      const now = new Date();
      if (exp < now && fssaiStatus === "ON") {
        setFssaiStatus("OFF");
        updateField("FSSAIStatus", "OFF"); // notify parent to persist
      }
    } catch {
      // ignore
    }
  }, [fssaiExpiry]); // eslint-disable-line

  // file change handlers — only store filename here, actual upload should be done by parent/server
  const handleFssaiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFssaiCopy(f.name);
  };
  const handleGstFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setGstCopy(f.name);
  };
  const handlePanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setPanCopy(f.name);
  };

  // Save rows — send exact column keys you listed to parent
  const handleSaveAll = () => {
    // send address fields
    updateField("RestroAddress", restroAddress);
    updateField("State", stateVal);
    updateField("City/Village", city);
    updateField("District", district);
    updateField("PinCode", pin);
    updateField("RestroLatitude", lat);
    updateField("RestroLongituden", lng);

    // send doc columns exactly as requested
    updateField("FSSAINumber", fssaiNumber || null);
    updateField("FSSAICopyUpload", fssaiCopy || null);
    updateField("FSSAIExpiry", fssaiExpiry || null);
    updateField("FSSAIStatus", fssaiStatus);

    updateField("GSTNumber", gstNumber || null);
    updateField("GSTType", gstType || null);
    updateField("GSTCopyUpload", gstCopy || null);
    updateField("GSTStatus", gstStatus);

    updateField("PANNumber", panNumber || null);
    updateField("PANType", panType || null);
    updateField("UploadPanCopy", panCopy || null);
    updateField("PANStatus", panStatus);

    // optional: parent can listen to this to perform a DB save
    updateField("SAVE_TRIGGER", { at: new Date().toISOString() });

    // visual feedback
    // eslint-disable-next-line no-alert
    alert("Changes sent to parent. Parent should persist these to Supabase.");
  };

  // Open add-new modal (blank)
  function openAdd(kind: "FSSAI" | "GST" | "PAN") {
    setModalNumber("");
    setModalExpiry(null);
    setModalFile(null);
    setModalTypeValue("");
    setModalOpen(kind);
  }

  // Basic validators (lightweight)
  const isValidFssai = (s: string) => /^\d{14}$/.test(s.trim());
  const isValidPan = (s: string) => /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(s.trim());
  const isValidGst = (s: string) => s.trim().length === 15;

  function modalSave(kind: "FSSAI" | "GST" | "PAN") {
    const num = modalNumber.trim();
    if (!num) {
      // eslint-disable-next-line no-alert
      alert("Enter number");
      return;
    }
    if (kind === "FSSAI" && !isValidFssai(num)) {
      alert("FSSAI must be exactly 14 digits.");
      return;
    }
    if (kind === "GST" && !isValidGst(num)) {
      alert("GST should be 15 characters.");
      return;
    }
    if (kind === "PAN" && !isValidPan(num)) {
      alert("PAN format invalid.");
      return;
    }

    // set local UI & notify parent (single-row behaviour: new entry is active)
    if (kind === "FSSAI") {
      setFssaiNumber(num);
      setFssaiExpiry(modalExpiry ?? "");
      setFssaiCopy(modalFile ? modalFile.name : fssaiCopy);
      setFssaiStatus("ON");

      // deactivate older entry - in single-row DB, replacing values is sufficient.
      updateField("FSSAINumber", num);
      updateField("FSSAICopyUpload", modalFile ? modalFile.name : fssaiCopy || null);
      updateField("FSSAIExpiry", modalExpiry ?? null);
      updateField("FSSAIStatus", "ON");
    } else if (kind === "GST") {
      setGstNumber(num);
      setGstType(modalTypeValue || gstType);
      setGstCopy(modalFile ? modalFile.name : gstCopy);
      setGstStatus("ON");

      updateField("GSTNumber", num);
      updateField("GSTType", modalTypeValue || gstType);
      updateField("GSTCopyUpload", modalFile ? modalFile.name : gstCopy || null);
      updateField("GSTStatus", "ON");
    } else {
      setPanNumber(num);
      setPanType(modalTypeValue || panType);
      setPanCopy(modalFile ? modalFile.name : panCopy);
      setPanStatus("ON");

      updateField("PANNumber", num);
      updateField("PANType", modalTypeValue || panType);
      updateField("UploadPanCopy", modalFile ? modalFile.name : panCopy || null);
      updateField("PANStatus", "ON");
    }

    // let parent know to persist if needed
    updateField("SAVE_TRIGGER", { at: new Date().toISOString(), kind });
    setModalOpen(null);
  }

  // small document row UI builder
  const renderDocRow = (
    label: string,
    number: string,
    expiry: string | null | undefined,
    copy: string,
    status: string,
    onFile: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onAdd: () => void,
    onToggle: (b: boolean) => void
  ) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>{label}</div>
        <div>
          <button type="button" onClick={onAdd} style={{ background: "#06b6d4", color: "#fff", padding: "8px 10px", borderRadius: 6 }}>Add New {label}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 180px 220px 120px", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{label} Number</div>
          <div style={{ fontSize: 14 }}>{number || "—"}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Expiry</div>
          <div style={{ fontSize: 14 }}>{expiry || "—"}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Photo</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13 }}>{copy || "No file"}</div>
            <label style={{ background: "#f3f4f6", padding: "6px 8px", borderRadius: 6, cursor: "pointer" }}>Browse<input type="file" onChange={onFile} style={{ display: "none" }} /></label>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Created / Updated</div>
          <div style={{ fontSize: 13, color: "#444" }}>—</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Status</div>
          <div><ToggleSwitch checked={status === "ON"} onChange={(b) => { onToggle(b); }} /></div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminForm>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Address & Documents</h3>

      <div style={{ maxWidth: 1200, margin: "12px auto" }}>
        {/* Address box */}
        <div style={{ background: "#eef8ff", padding: 16, borderRadius: 10, border: "1px solid #d6eaf8", marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#083d77", textAlign: "center" }}>Address</h4>

          <FormRow cols={3} gap={12}>
            <FormField label="Restro Address" className="col-span-3">
              <textarea value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 6, border: "1px solid #e6eef6" }} />
            </FormField>

            <FormField label="City / Village">
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="State">
              <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="District">
              <input value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Pin Code">
              <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Latitude">
              <input value={lat} onChange={(e) => setLat(e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Longitude">
              <input value={lng} onChange={(e) => setLng(e.target.value)} className="w-full p-2 rounded border" />
            </FormField>
          </FormRow>
        </div>

        {/* Documents box */}
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #f1f1f1" }}>
          <h4 style={{ margin: "4px 0 16px 0", color: "#083d77", textAlign: "center" }}>Documents</h4>

          {renderDocRow(
            "FSSAI",
            fssaiNumber,
            fssaiExpiry,
            fssaiCopy,
            fssaiStatus,
            handleFssaiFile,
            () => openAdd("FSSAI"),
            (b: boolean) => {
              setFssaiStatus(b ? "ON" : "OFF");
              updateField("FSSAIStatus", b ? "ON" : "OFF");
            }
          )}

          <hr style={{ margin: "12px 0" }} />

          {renderDocRow(
            "GST",
            gstNumber,
            null,
            gstCopy,
            gstStatus,
            handleGstFile,
            () => openAdd("GST"),
            (b: boolean) => {
              setGstStatus(b ? "ON" : "OFF");
              updateField("GSTStatus", b ? "ON" : "OFF");
            }
          )}

          <hr style={{ margin: "12px 0" }} />

          {renderDocRow(
            "PAN",
            panNumber,
            null,
            panCopy,
            panStatus,
            handlePanFile,
            () => openAdd("PAN"),
            (b: boolean) => {
              setPanStatus(b ? "ON" : "OFF");
              updateField("PANStatus", b ? "ON" : "OFF");
            }
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 12 }}>
          <SubmitButton onClick={handleSaveAll}>Save Address & Docs</SubmitButton>
        </div>
      </div>

      {/* modal */}
      {modalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", zIndex: 9999 }}>
          <div style={{ width: 520, background: "#fff", borderRadius: 10, padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{modalOpen === "FSSAI" ? "Add New FSSAI" : modalOpen === "GST" ? "Add New GST" : "Add New PAN"}</h3>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Number</label>
                <input value={modalNumber} onChange={(e) => setModalNumber(e.target.value)} className="w-full p-2 rounded border" />
              </div>

              {modalOpen === "FSSAI" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Expiry</label>
                  <input type="date" value={modalExpiry ?? ""} onChange={(e) => setModalExpiry(e.target.value ?? null)} className="w-full p-2 rounded border" />
                </div>
              )}

              {modalOpen === "GST" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>GST Type</label>
                  <select value={modalTypeValue} onChange={(e) => setModalTypeValue(e.target.value)} className="w-full p-2 rounded border">
                    <option value="">-- Select --</option>
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                    <option value="NotApplicable">Not Applicable</option>
                  </select>
                </div>
              )}

              {modalOpen === "PAN" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>PAN Type</label>
                  <select value={modalTypeValue} onChange={(e) => setModalTypeValue(e.target.value)} className="w-full p-2 rounded border">
                    <option value="">-- Select --</option>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Upload Photo / Copy</label>
                <input type="file" onChange={(e) => setModalFile(e.target.files?.[0] ?? null)} />
                {modalFile && <div style={{ marginTop: 6 }}>Selected: {modalFile.name}</div>}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Status (auto)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ padding: "6px 10px", background: "#16a34a", color: "#fff", borderRadius: 6 }}>Active</div>
                  <div style={{ color: "#666" }}>New entries will be Active and previous one is expected to be inactivated by replacing values.</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setModalOpen(null)} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
                <button onClick={() => modalSave(modalOpen!)} style={{ padding: "8px 12px", borderRadius: 6, background: "#06b6d4", color: "#fff" }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
