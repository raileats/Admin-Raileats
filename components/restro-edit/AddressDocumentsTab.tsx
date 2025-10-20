// components/restro-edit/AddressDocumentsTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import UI from "@/components/AdminUI";
import { supabase } from "@/lib/supabase"; // <-- adjust if your client is exported elsewhere
const { AdminForm, FormRow, FormField, SubmitButton } = UI;

type Props = {
  local: any;
  updateField: (key: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

function isDigits(s?: string | null) {
  return !!s && /^\d+$/.test(s);
}

/** VALIDATORS */
function validateFssai(value?: string | null) {
  if (!value) return false;
  // FSSAI commonly 14 digits - accept strictly 14 digits
  return /^\d{14}$/.test(value.trim());
}

function validatePan(value?: string | null) {
  if (!value) return false;
  // PAN format: 5 letters + 4 digits + 1 letter (A-Z), case-insensitive
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(value.trim());
}

function validateGst(value?: string | null) {
  if (!value) return false;
  // GSTIN format: 15 characters: 2 digits (state) + 10-char PAN + 1 entity code (alnum) + 1 Z + 1 checksum
  // Loose regex that checks length and allowed chars (you can make stricter depending on needs)
  return /^[0-9]{2}[A-Z0-9]{13}$/i.test(value.trim()) && value.trim().length === 15;
}

/** small switch component (unstyled HTML + simple CSS for look) */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <span style={{ width: 40, height: 22, display: "inline-block", borderRadius: 16, background: checked ? "#06b6d4" : "#e5e7eb", position: "relative", transition: "background .15s" }}>
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
            transition: "left .15s",
          }}
        />
      </span>
      <span style={{ fontSize: 13 }}>{checked ? "Active" : "Inactive"}</span>
    </label>
  );
}

export default function AddressDocumentsTab({ local = {}, updateField }: Props) {
  const restroCode = local?.RestroCode ?? local?.RestroCode;

  // address fields
  const [restroAddress, setRestroAddress] = useState(local?.RestroAddress ?? "");
  const [stateVal, setStateVal] = useState(local?.State ?? "");
  const [city, setCity] = useState(local?.["City/Village"] ?? local?.City ?? "");
  const [district, setDistrict] = useState(local?.District ?? "");
  const [pin, setPin] = useState(local?.PinCode ?? "");
  const [lat, setLat] = useState(local?.RestroLatitude ?? "");
  const [lng, setLng] = useState(local?.RestroLongituden ?? local?.RestroLongitude ?? "");

  // documents (single-row columns)
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

  // modal state
  const [modalOpen, setModalOpen] = useState<null | "FSSAI" | "GST" | "PAN">(null);
  const [modalNumber, setModalNumber] = useState("");
  const [modalExpiry, setModalExpiry] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalTypeValue, setModalTypeValue] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // load authoritative row from supabase when restroCode is available
  useEffect(() => {
    if (!restroCode) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("RestroMaster")
        .select(`
          FSSAICopyUpload, FSSAINumber, FSSAIStatus, FSSAIExpiry,
          GSTNumber, GSTType, GSTCopyUpload, GSTStatus,
          PANNumber, PANType, UploadPanCopy, PANStatus,
          RestroAddress, State, "City/Village", District, PinCode, RestroLatitude, RestroLongituden
        `)
        .eq("RestroCode", restroCode)
        .single();

      if (!mounted) return;
      setLoading(false);
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching RestroMaster row", error);
        return;
      }
      if (!data) return;

      setRestroAddress(data.RestroAddress ?? "");
      setStateVal(data.State ?? "");
      setCity(data["City/Village"] ?? "");
      setDistrict(data.District ?? "");
      setPin(data.PinCode ?? "");
      setLat(data.RestroLatitude ?? "");
      setLng(data.RestroLongituden ?? data.RestroLongitude ?? "");

      setFssaiNumber(data.FSSAINumber ?? "");
      setFssaiExpiry(data.FSSAIExpiry ?? "");
      setFssaiCopyName(data.FSSAICopyUpload ?? "");
      setFssaiStatus(data.FSSAIStatus === "ON" ? "ON" : "OFF");

      setGstNumber(data.GSTNumber ?? "");
      setGstType(data.GSTType ?? "");
      setGstCopyName(data.GSTCopyUpload ?? "");
      setGstStatus(data.GSTStatus === "ON" ? "ON" : "OFF");

      setPanNumber(data.PANNumber ?? "");
      setPanType(data.PANType ?? "");
      setPanCopyName(data.UploadPanCopy ?? "");
      setPanStatus(data.PANStatus === "ON" ? "ON" : "OFF");
    })();
    return () => {
      mounted = false;
    };
  }, [restroCode]);

  // auto-deactivate expired FSSAI on load & when expiry changes
  useEffect(() => {
    if (!fssaiExpiry) return;
    try {
      const exp = new Date(fssaiExpiry);
      exp.setHours(23, 59, 59, 999);
      const now = new Date();
      if (exp < now && fssaiStatus === "ON") {
        // set OFF locally and persist
        setFssaiStatus("OFF");
        (async () => {
          if (!restroCode) return;
          await supabase.from("RestroMaster").update({ FSSAIStatus: "OFF" }).eq("RestroCode", restroCode);
        })();
      }
    } catch {
      // ignore
    }
  }, [fssaiExpiry, fssaiStatus, restroCode]);

  // file handlers: store only filename currently (TODO: upload to storage)
  function onFssaiFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFssaiCopyName(f.name);
    // TODO: upload to storage and store path in DB
  }
  function onGstFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setGstCopyName(f.name);
  }
  function onPanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setPanCopyName(f.name);
  }

  // Save whole row
  async function handleSaveRow() {
    if (!restroCode) {
      alert("Missing RestroCode — cannot save.");
      return;
    }

    // Quick validation: if fields provided, ensure they validate
    if (fssaiNumber && !validateFssai(fssaiNumber)) {
      alert("FSSAI number invalid — must be 14 digits.");
      return;
    }
    if (panNumber && !validatePan(panNumber)) {
      alert("PAN invalid — expected format e.g. ABCDE1234F");
      return;
    }
    if (gstNumber && !validateGst(gstNumber)) {
      alert("GST invalid — expected 15-character GSTIN.");
      return;
    }

    setLoading(true);
    const payload: any = {
      RestroAddress: restroAddress,
      State: stateVal,
      "City/Village": city,
      District: district,
      PinCode: pin,
      RestroLatitude: lat,
      RestroLongituden: lng,

      FSSAINumber: fssaiNumber || null,
      FSSAIExpiry: fssaiExpiry || null,
      FSSAICopyUpload: fssaiCopyName || null,
      FSSAIStatus: fssaiStatus,

      GSTNumber: gstNumber || null,
      GSTType: gstType || null,
      GSTCopyUpload: gstCopyName || null,
      GSTStatus: gstStatus,

      PANNumber: panNumber || null,
      PANType: panType || null,
      UploadPanCopy: panCopyName || null,
      PANStatus: panStatus,
    };

    const { error } = await supabase.from("RestroMaster").update(payload).eq("RestroCode", restroCode);
    setLoading(false);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Save failed", error);
      alert("Save failed: " + error.message);
      return;
    }

    // inform parent (optional)
    try {
      updateField && updateField("SupabaseLastSavedAt", new Date().toISOString());
    } catch {}

    alert("Saved successfully.");
  }

  // Modal flows
  function openAdd(kind: "FSSAI" | "GST" | "PAN") {
    setModalNumber("");
    setModalExpiry(null);
    setModalFile(null);
    setModalTypeValue("");
    setModalOpen(kind);
  }

  function modalValid(kind: "FSSAI" | "GST" | "PAN") {
    if (!modalNumber || modalNumber.trim().length === 0) return false;
    if (kind === "FSSAI") return validateFssai(modalNumber);
    if (kind === "GST") return validateGst(modalNumber) && !!modalTypeValue;
    if (kind === "PAN") return validatePan(modalNumber) && !!modalTypeValue;
    return false;
  }

  async function saveModalEntry(kind: "FSSAI" | "GST" | "PAN") {
    if (!restroCode) {
      alert("Missing RestroCode");
      return;
    }
    if (!modalValid(kind)) {
      alert("Please fill valid values in the modal.");
      return;
    }

    // Make new value active (set status ON) and persist: we overwrite the single-row columns.
    const payload: any = {};
    if (kind === "FSSAI") {
      payload.FSSAINumber = modalNumber.trim();
      payload.FSSAIExpiry = modalExpiry ?? null;
      payload.FSSAICopyUpload = modalFile ? modalFile.name : fssaiCopyName ?? null;
      payload.FSSAIStatus = "ON";
    } else if (kind === "GST") {
      payload.GSTNumber = modalNumber.trim();
      payload.GSTType = modalTypeValue;
      payload.GSTCopyUpload = modalFile ? modalFile.name : gstCopyName ?? null;
      payload.GSTStatus = "ON";
    } else {
      payload.PANNumber = modalNumber.trim();
      payload.PANType = modalTypeValue;
      payload.UploadPanCopy = modalFile ? modalFile.name : panCopyName ?? null;
      payload.PANStatus = "ON";
    }

    setLoading(true);
    const { error } = await supabase.from("RestroMaster").update(payload).eq("RestroCode", restroCode);
    setLoading(false);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Modal save failed", error);
      alert("Save failed: " + error.message);
      return;
    }

    // update local state
    if (kind === "FSSAI") {
      setFssaiNumber(payload.FSSAINumber);
      setFssaiExpiry(payload.FSSAIExpiry);
      setFssaiCopyName(payload.FSSAICopyUpload);
      setFssaiStatus("ON");
    } else if (kind === "GST") {
      setGstNumber(payload.GSTNumber);
      setGstType(payload.GSTType);
      setGstCopyName(payload.GSTCopyUpload);
      setGstStatus("ON");
    } else {
      setPanNumber(payload.PANNumber);
      setPanType(payload.PANType);
      setPanCopyName(payload.UploadPanCopy);
      setPanStatus("ON");
    }

    setModalOpen(null);
    alert(`${kind} saved and activated.`);
  }

  // small render helper for document line
  const renderDocumentLine = (
    label: string,
    number: string,
    expiry: string | null | undefined,
    copyName: string,
    status: string,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onAddClick: () => void,
    onToggleStatus: () => Promise<void>
  ) => {
    return (
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
              <ToggleSwitch checked={status === "ON"} onChange={async (v) => { await onToggleStatus(); }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            onFssaiFile,
            () => openAdd("FSSAI"),
            async () => {
              const newStatus = fssaiStatus === "ON" ? "OFF" : "ON";
              setFssaiStatus(newStatus);
              if (!restroCode) return;
              await supabase.from("RestroMaster").update({ FSSAIStatus: newStatus }).eq("RestroCode", restroCode);
            }
          )}

          <hr style={{ margin: "12px 0" }} />

          {renderDocumentLine(
            "GST",
            gstNumber,
            null,
            gstCopyName,
            gstStatus,
            onGstFile,
            () => openAdd("GST"),
            async () => {
              const newStatus = gstStatus === "ON" ? "OFF" : "ON";
              setGstStatus(newStatus);
              if (!restroCode) return;
              await supabase.from("RestroMaster").update({ GSTStatus: newStatus }).eq("RestroCode", restroCode);
            }
          )}

          <hr style={{ margin: "12px 0" }} />

          {renderDocumentLine(
            "PAN",
            panNumber,
            null,
            panCopyName,
            panStatus,
            onPanFile,
            () => openAdd("PAN"),
            async () => {
              const newStatus = panStatus === "ON" ? "OFF" : "ON";
              setPanStatus(newStatus);
              if (!restroCode) return;
              await supabase.from("RestroMaster").update({ PANStatus: newStatus }).eq("RestroCode", restroCode);
            }
          )}
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 12 }}>
          <SubmitButton onClick={handleSaveRow}>{loading ? "Saving..." : "Save Address & Docs"}</SubmitButton>
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
                {/* inline validation message */}
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
                  <div style={{ color: "#666" }}>New entries will be Active and previous will be overwritten/inactivated.</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button onClick={() => setModalOpen(null)} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
                <button disabled={!modalValid(modalOpen)} onClick={() => saveModalEntry(modalOpen)} style={{ padding: "8px 12px", borderRadius: 6, background: modalValid(modalOpen) ? "#06b6d4" : "#9ca3af", color: "#fff" }}>
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
