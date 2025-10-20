"use client";

import React, { useEffect, useMemo, useState } from "react";
import UI from "@/components/AdminUI";
const { AdminForm, FormRow, FormField, SubmitButton } = UI;

type Props = {
  local: any;
  updateField: (key: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

// simple validators
const validateFssai = (v?: string | null) => !!v && /^\d{14}$/.test(v.trim());
const validatePan = (v?: string | null) => !!v && /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(v.trim());
const validateGst = (v?: string | null) => !!v && /^[0-9]{2}[A-Z0-9]{13}$/i.test(v.trim()) && v.trim().length === 15;

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{ width: 40, height: 22, display: "inline-block", borderRadius: 16, background: checked ? "#06b6d4" : "#e5e7eb", position: "relative" }}>
        <span
          onClick={() => onChange(!checked)}
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: 12,
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
            transition: "left .12s",
          }}
        />
      </span>
      <span style={{ fontSize: 13 }}>{checked ? "Active" : "Inactive"}</span>
    </label>
  );
}

export default function AddressDocumentsTab({ local = {}, updateField }: Props) {
  const restroCode = local?.RestroCode ?? null;

  // Address
  const [restroAddress, setRestroAddress] = useState(local?.RestroAddress ?? "");
  const [stateVal, setStateVal] = useState(local?.State ?? "");
  const [city, setCity] = useState(local?.["City/Village"] ?? local?.City ?? "");
  const [district, setDistrict] = useState(local?.District ?? "");
  const [pin, setPin] = useState(local?.PinCode ?? "");
  const [lat, setLat] = useState(local?.RestroLatitude ?? "");
  const [lng, setLng] = useState(local?.RestroLongituden ?? local?.RestroLongitude ?? "");

  // Documents single-row values (initial from local)
  const [fssaiNumber, setFssaiNumber] = useState(local?.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(local?.FSSAIExpiry ?? "");
  const [fssaiCopyName, setFssaiCopyName] = useState(local?.FSSAICopyUpload ?? "");
  const [fssaiStatus, setFssaiStatus] = useState(local?.FSSAIStatus === "ON" ? "ON" : "OFF");

  const [gstNumber, setGstNumber] = useState(local?.GSTNumber ?? "");
  const [gstType, setGstType] = useState(local?.GSTType ?? "");
  const [gstCopyName, setGstCopyName] = useState(local?.GSTCopyUpload ?? "");
  const [gstStatus, setGstStatus] = useState(local?.GSTStatus === "ON" ? "ON" : "OFF");

  const [panNumber, setPanNumber] = useState(local?.PANNumber ?? "");
  const [panType, setPanType] = useState(local?.PANType ?? "");
  const [panCopyName, setPanCopyName] = useState(local?.UploadPanCopy ?? "");
  const [panStatus, setPanStatus] = useState(local?.PANStatus === "ON" ? "ON" : "OFF");

  // modal
  const [modalOpen, setModalOpen] = useState<null | "FSSAI" | "GST" | "PAN">(null);
  const [modalNumber, setModalNumber] = useState("");
  const [modalExpiry, setModalExpiry] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalTypeValue, setModalTypeValue] = useState("");

  // sync local -> states if parent sends new local later
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
    setFssaiCopyName(local?.FSSAICopyUpload ?? "");
    setFssaiStatus(local?.FSSAIStatus === "ON" ? "ON" : "OFF");

    setGstNumber(local?.GSTNumber ?? "");
    setGstType(local?.GSTType ?? "");
    setGstCopyName(local?.GSTCopyUpload ?? "");
    setGstStatus(local?.GSTStatus === "ON" ? "ON" : "OFF");

    setPanNumber(local?.PANNumber ?? "");
    setPanType(local?.PANType ?? "");
    setPanCopyName(local?.UploadPanCopy ?? "");
    setPanStatus(local?.PANStatus === "ON" ? "ON" : "OFF");
  }, [local]);

  // auto-deactivate expired FSSAI locally and notify parent
  useEffect(() => {
    if (!fssaiExpiry) return;
    try {
      const exp = new Date(fssaiExpiry);
      exp.setHours(23, 59, 59, 999);
      const now = new Date();
      if (exp < now && fssaiStatus === "ON") {
        setFssaiStatus("OFF");
        // notify parent to persist this change
        updateField("FSSAIStatus", "OFF");
      }
    } catch {
      /* ignore parse error */
    }
  }, [fssaiExpiry]); // eslint-disable-line

  // file input handlers (store filename only; actual upload left to parent)
  const handleFssaiFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFssaiCopyName(f.name);
  };
  const handleGstFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setGstCopyName(f.name);
  };
  const handlePanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setPanCopyName(f.name);
  };

  // Save the whole row: send individual fields to parent via updateField.
  const handleSaveRow = async () => {
    // basic validations
    if (fssaiNumber && !validateFssai(fssaiNumber)) {
      alert("FSSAI invalid — must be exactly 14 digits.");
      return;
    }
    if (panNumber && !validatePan(panNumber)) {
      alert("PAN invalid (format ABCDE1234F).");
      return;
    }
    if (gstNumber && !validateGst(gstNumber)) {
      alert("GST invalid — expected 15-character GSTIN.");
      return;
    }

    // update parent fields one by one (parent should persist to Supabase)
    updateField("RestroAddress", restroAddress);
    updateField("State", stateVal);
    updateField("City/Village", city);
    updateField("District", district);
    updateField("PinCode", pin);
    updateField("RestroLatitude", lat);
    updateField("RestroLongituden", lng);

    updateField("FSSAINumber", fssaiNumber || null);
    updateField("FSSAIExpiry", fssaiExpiry || null);
    updateField("FSSAICopyUpload", fssaiCopyName || null);
    updateField("FSSAIStatus", fssaiStatus);

    updateField("GSTNumber", gstNumber || null);
    updateField("GSTType", gstType || null);
    updateField("GSTCopyUpload", gstCopyName || null);
    updateField("GSTStatus", gstStatus);

    updateField("PANNumber", panNumber || null);
    updateField("PANType", panType || null);
    updateField("UploadPanCopy", panCopyName || null);
    updateField("PANStatus", panStatus);

    // parent is responsible for persistence; we can optionally notify parent to trigger save
    updateField("SAVE_TRIGGER", { at: new Date().toISOString() });

    alert("Updated fields sent to parent (parent should persist to Supabase).");
  };

  // Modal flows: open, validate, save. When saving modal we set new value active and also send updateField
  function openAdd(kind: "FSSAI" | "GST" | "PAN") {
    setModalNumber("");
    setModalExpiry(null);
    setModalFile(null);
    setModalTypeValue("");
    setModalOpen(kind);
  }

  const modalValid = (kind: "FSSAI" | "GST" | "PAN" | null) => {
    if (!modalNumber) return false;
    if (kind === "FSSAI") return validateFssai(modalNumber);
    if (kind === "GST") return validateGst(modalNumber) && !!modalTypeValue;
    if (kind === "PAN") return validatePan(modalNumber) && !!modalTypeValue;
    return false;
  };

  async function saveModalEntry(kind: "FSSAI" | "GST" | "PAN") {
    if (!modalValid(kind)) {
      alert("Please enter valid values.");
      return;
    }

    // For single-row design: when new entry added, previous becomes inactive.
    if (kind === "FSSAI") {
      // set fields locally
      setFssaiNumber(modalNumber.trim());
      setFssaiExpiry(modalExpiry ?? "");
      setFssaiCopyName(modalFile ? modalFile.name : fssaiCopyName);
      setFssaiStatus("ON");

      // notify parent
      updateField("FSSAINumber", modalNumber.trim());
      updateField("FSSAIExpiry", modalExpiry ?? null);
      updateField("FSSAICopyUpload", modalFile ? modalFile.name : fssaiCopyName ?? null);
      updateField("FSSAIStatus", "ON");
      // also inactivate any previous (parent may handle history; here it's single-row so updating is enough)
    } else if (kind === "GST") {
      setGstNumber(modalNumber.trim());
      setGstType(modalTypeValue);
      setGstCopyName(modalFile ? modalFile.name : gstCopyName);
      setGstStatus("ON");

      updateField("GSTNumber", modalNumber.trim());
      updateField("GSTType", modalTypeValue);
      updateField("GSTCopyUpload", modalFile ? modalFile.name : gstCopyName ?? null);
      updateField("GSTStatus", "ON");
    } else {
      setPanNumber(modalNumber.trim());
      setPanType(modalTypeValue);
      setPanCopyName(modalFile ? modalFile.name : panCopyName);
      setPanStatus("ON");

      updateField("PANNumber", modalNumber.trim());
      updateField("PANType", modalTypeValue);
      updateField("UploadPanCopy", modalFile ? modalFile.name : panCopyName ?? null);
      updateField("PANStatus", "ON");
    }

    // signal parent to persist (save trigger)
    updateField("SAVE_TRIGGER", { at: new Date().toISOString(), modalKind: kind });
    setModalOpen(null);
  }

  // render helper
  const renderDocumentLine = (
    label: string,
    number: string,
    expiry: string | null | undefined,
    copyName: string,
    status: string,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onAddClick: () => void,
    onToggleStatus: (v: boolean) => void
  ) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong style={{ fontSize: 15 }}>{label}</strong>
        <button onClick={onAddClick} style={{ background: "#06b6d4", color: "#fff", padding: "8px 10px", borderRadius: 6 }}>
          Add New {label}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 220px 220px 120px", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>{label} Number</div>
          <div style={{ fontSize: 14 }}>{number || "—"}</div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Expiry</div>
          <div style={{ fontSize: 14 }}>{expiry || "—"}</div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Copy</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ fontSize: 13 }}>{copyName || "No file"}</div>
            <label style={{ background: "#f3f4f6", padding: "6px 8px", borderRadius: 6, cursor: "pointer" }}>
              Browse
              <input type="file" onChange={onFileChange} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Created / Updated</div>
          <div style={{ fontSize: 13, color: "#666" }}>—</div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Status</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <ToggleSwitch checked={status === "ON"} onChange={(b) => onToggleStatus(b)} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminForm>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Address & Documents</h3>

      <div style={{ maxWidth: 1200, margin: "12px auto" }}>
        {/* Address block */}
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

        {/* Documents */}
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #f1f1f1" }}>
          <h4 style={{ margin: "4px 0 16px 0", color: "#083d77", textAlign: "center" }}>Documents</h4>

          {renderDocumentLine(
            "FSSAI",
            fssaiNumber,
            fssaiExpiry,
            fssaiCopyName,
            fssaiStatus,
            handleFssaiFile,
            () => openAdd("FSSAI"),
            async (checked) => {
              setFssaiStatus(checked ? "ON" : "OFF");
              updateField("FSSAIStatus", checked ? "ON" : "OFF");
            }
          )}

          <hr style={{ margin: "12px 0" }} />

          {renderDocumentLine(
            "GST",
            gstNumber,
            null,
            gstCopyName,
            gstStatus,
            handleGstFile,
            () => openAdd("GST"),
            async (checked) => {
              setGstStatus(checked ? "ON" : "OFF");
              updateField("GSTStatus", checked ? "ON" : "OFF");
            }
          )}

          <hr style={{ margin: "12px 0" }} />

          {renderDocumentLine(
            "PAN",
            panNumber,
            null,
            panCopyName,
            panStatus,
            handlePanFile,
            () => openAdd("PAN"),
            async (checked) => {
              setPanStatus(checked ? "ON" : "OFF");
              updateField("PANStatus", checked ? "ON" : "OFF");
            }
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 12 }}>
          <SubmitButton onClick={handleSaveRow}>Save Address & Docs</SubmitButton>
        </div>
      </div>

      {/* modal */}
      {modalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", zIndex: 9999 }}>
          <div style={{ width: 520, background: "#fff", borderRadius: 10, padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>{modalOpen === "FSSAI" ? "Add New FSSAI" : modalOpen === "GST" ? "Add New GST" : "Add New PAN"}</h3>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Number</label>
                <input value={modalNumber} onChange={(e) => setModalNumber(e.target.value)} className="w-full p-2 rounded border" />
                {modalOpen === "FSSAI" && modalNumber && !validateFssai(modalNumber) && <div style={{ color: "crimson", marginTop: 6 }}>FSSAI must be exactly 14 digits.</div>}
                {modalOpen === "GST" && modalNumber && !validateGst(modalNumber) && <div style={{ color: "crimson", marginTop: 6 }}>GST must be 15-character GSTIN.</div>}
                {modalOpen === "PAN" && modalNumber && !validatePan(modalNumber) && <div style={{ color: "crimson", marginTop: 6 }}>PAN format e.g. ABCDE1234F.</div>}
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
                  <div style={{ color: "#666" }}>New entries will be Active and previous will be inactivated by parent logic.</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setModalOpen(null)} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
                <button disabled={!modalValid(modalOpen)} onClick={() => saveModalEntry(modalOpen!)} style={{ padding: "8px 12px", borderRadius: 6, background: modalValid(modalOpen) ? "#06b6d4" : "#9ca3af", color: "#fff" }}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
