// components/restro-edit/AddressDocumentsTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import UI from "@/components/AdminUI";
import { supabase } from "@/lib/supabase"; // <- adjust path if your supabase client is exported elsewhere
const { AdminForm, FormRow, FormField, SubmitButton } = UI;

type Props = {
  local: any; // parent may pass partial row (we also fetch authoritative row from supabase)
  updateField: (key: string, v: any) => void; // parent update hook (kept for compatibility)
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

const TABLE = "RestroMaster";

export default function AddressDocumentsTab({ local = {}, updateField }: Props) {
  const restroCode = local?.RestroCode ?? local?.RestroCode; // ensure we have code

  // ----- state mapped directly to your Supabase columns -----
  const [restroAddress, setRestroAddress] = useState(local?.RestroAddress ?? "");
  const [stateVal, setStateVal] = useState(local?.State ?? "");
  const [city, setCity] = useState(local?.["City/Village"] ?? local?.City ?? "");
  const [district, setDistrict] = useState(local?.District ?? "");
  const [pin, setPin] = useState(local?.PinCode ?? "");
  const [lat, setLat] = useState(local?.RestroLatitude ?? "");
  const [lng, setLng] = useState(local?.RestroLongituden ?? local?.RestroLongitude ?? "");

  // documents (single current values per your table columns)
  const [fssaiNumber, setFssaiNumber] = useState(local?.FSSAINumber ?? "");
  const [fssaiExpiry, setFssaiExpiry] = useState(local?.FSSAIExpiry ?? "");
  const [fssaiCopyName, setFssaiCopyName] = useState(local?.FSSAICopyUpload ?? "");
  const [fssaiStatus, setFssaiStatus] = useState(local?.FSSAIStatus ?? "OFF");

  const [gstNumber, setGstNumber] = useState(local?.GSTNumber ?? "");
  const [gstType, setGstType] = useState(local?.GSTType ?? "");
  const [gstCopyName, setGstCopyName] = useState(local?.GSTCopyUpload ?? "");
  const [gstStatus, setGstStatus] = useState(local?.GSTStatus ?? "OFF");

  const [panNumber, setPanNumber] = useState(local?.PANNumber ?? "");
  const [panType, setPanType] = useState(local?.PANType ?? "");
  const [panCopyName, setPanCopyName] = useState(local?.UploadPanCopy ?? "");
  const [panStatus, setPanStatus] = useState(local?.PANStatus ?? "OFF");

  // modal
  const [modalOpen, setModalOpen] = useState<null | "FSSAI" | "GST" | "PAN">(null);
  const [modalNumber, setModalNumber] = useState("");
  const [modalExpiry, setModalExpiry] = useState<string | null>(null);
  const [modalFile, setModalFile] = useState<File | null>(null);
  const [modalTypeValue, setModalTypeValue] = useState<string>(""); // GST type or PAN type when relevant

  const [loading, setLoading] = useState(false);
  const [rowLoaded, setRowLoaded] = useState(false);

  // helper to format ISO timestamp to readable
  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  // --- fetch authoritative row from supabase on mount or when restroCode changes ---
  useEffect(() => {
    if (!restroCode) return;

    let mounted = true;
    setLoading(true);

    async function loadRow() {
      const { data, error } = await supabase.from(TABLE).select(`
        FSSAICopyUpload, FSSAINumber, FSSAIStatus, FSSAIExpiry,
        GSTNumber, GSTType, GSTCopyUpload, GSTStatus,
        PANNumber, PANType, UploadPanCopy, PANStatus,
        RestroAddress, State, "City/Village", District, PinCode, RestroLatitude, RestroLongituden, updated_at
      `).eq("RestroCode", restroCode).single();

      if (!mounted) return;
      setLoading(false);

      if (error) {
        // handle gracefully - console for debugging
        // eslint-disable-next-line no-console
        console.error("Error fetching row:", error);
        return;
      }
      if (!data) return;

      // populate fields from row (prefer supabase row over parent-provided local)
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
      setFssaiStatus(data.FSSAIStatus ?? "OFF");

      setGstNumber(data.GSTNumber ?? "");
      setGstType(data.GSTType ?? "");
      setGstCopyName(data.GSTCopyUpload ?? "");
      setGstStatus(data.GSTStatus ?? "OFF");

      setPanNumber(data.PANNumber ?? "");
      setPanType(data.PANType ?? "");
      setPanCopyName(data.UploadPanCopy ?? "");
      setPanStatus(data.PANStatus ?? "OFF");

      setRowLoaded(true);
    }

    loadRow();

    return () => {
      mounted = false;
    };
  }, [restroCode]);

  // Auto-deactivate FSSAI if expired (runs on load and when expiry changes)
  useEffect(() => {
    if (!fssaiExpiry) return;
    try {
      const exp = new Date(fssaiExpiry);
      exp.setHours(23, 59, 59, 999);
      const now = new Date();
      if (exp < now && fssaiStatus === "ON") {
        // mark OFF both locally and persist to supabase
        setFssaiStatus("OFF");
        // persist change
        (async () => {
          if (!restroCode) return;
          await supabase.from(TABLE).update({ FSSAIStatus: "OFF" }).eq("RestroCode", restroCode);
        })();
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [fssaiExpiry, fssaiStatus, restroCode]);

  // file input handlers (we currently store file name only; add storage upload where TODO indicates)
  function onFssaiFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFssaiCopyName(f.name);
    // TODO: upload file to Supabase storage and store the public path in FSSAICopyUpload
    // e.g. supabase.storage.from('restro-files').upload(`${restroCode}/fssai/${Date.now()}-${f.name}`, f)
  }
  function onGstFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setGstCopyName(f.name);
  }
  function onPanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPanCopyName(f.name);
  }

  // Save entire Address & Documents row (updates the single row)
  async function handleSaveRow() {
    if (!restroCode) {
      alert("Missing RestroCode — cannot save.");
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

      // documents columns (single current)
      FSSAINumber: fssaiNumber,
      FSSAIExpiry: fssaiExpiry || null,
      FSSAICopyUpload: fssaiCopyName || null,
      FSSAIStatus: fssaiStatus,

      GSTNumber: gstNumber,
      GSTType: gstType,
      GSTCopyUpload: gstCopyName || null,
      GSTStatus: gstStatus,

      PANNumber: panNumber,
      PANType: panType,
      UploadPanCopy: panCopyName || null,
      PANStatus: panStatus,
    };

    const { data, error } = await supabase.from(TABLE).update(payload).eq("RestroCode", restroCode);

    setLoading(false);
    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving:", error);
      alert("Save failed: " + error.message);
      return;
    }

    // update parent local (optional)
    try {
      updateField && updateField("SupabaseLastSavedAt", new Date().toISOString());
    } catch {
      // ignore
    }

    alert("Saved successfully.");
  }

  // ----- Modal flows for Add New FSSAI/GST/PAN -----
  function openAdd(kind: "FSSAI" | "GST" | "PAN") {
    setModalNumber("");
    setModalExpiry(null);
    setModalFile(null);
    setModalTypeValue("");
    setModalOpen(kind);
  }

  async function saveModalEntry(kind: "FSSAI" | "GST" | "PAN") {
    if (!restroCode) {
      alert("Missing RestroCode — cannot save.");
      return;
    }
    if (!modalNumber || modalNumber.trim().length === 0) {
      alert("Please enter number.");
      return;
    }

    // When adding a new one, behaviour requested: make the new entry active and previous inactive.
    // Since table columns are single fields, saving simply overwrites the columns with new values and sets status ON.
    // If you store history in another table, you'd insert a new row and set previous row inactive — we didn't implement history here.
    const payload: any = {};
    if (kind === "FSSAI") {
      payload.FSSAINumber = modalNumber.trim();
      payload.FSSAIExpiry = modalExpiry ?? null;
      payload.FSSAICopyUpload = modalFile ? modalFile.name : fssaiCopyName ?? null; // ideally upload file and store path
      payload.FSSAIStatus = "ON";
    } else if (kind === "GST") {
      payload.GSTNumber = modalNumber.trim();
      payload.GSTType = modalTypeValue || gstType;
      payload.GSTCopyUpload = modalFile ? modalFile.name : gstCopyName ?? null;
      payload.GSTStatus = "ON";
    } else {
      payload.PANNumber = modalNumber.trim();
      payload.PANType = modalTypeValue || panType;
      payload.UploadPanCopy = modalFile ? modalFile.name : panCopyName ?? null;
      payload.PANStatus = "ON";
    }

    setLoading(true);
    const { data, error } = await supabase.from(TABLE).update(payload).eq("RestroCode", restroCode);
    setLoading(false);

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Error saving modal:", error);
      alert("Save failed: " + error.message);
      return;
    }

    // reflect changes locally
    if (kind === "FSSAI") {
      setFssaiNumber(payload.FSSAINumber);
      setFssaiExpiry(payload.FSSAIExpiry);
      setFssaiCopyName(payload.FSSAICopyUpload);
      setFssaiStatus("ON");
    }
    if (kind === "GST") {
      setGstNumber(payload.GSTNumber);
      setGstType(payload.GSTType);
      setGstCopyName(payload.GSTCopyUpload);
      setGstStatus("ON");
    }
    if (kind === "PAN") {
      setPanNumber(payload.PANNumber);
      setPanType(payload.PANType);
      setPanCopyName(payload.UploadPanCopy);
      setPanStatus("ON");
    }

    setModalOpen(null);
    alert(`${kind} saved and activated.`);
  }

  // small UI render helpers
  const renderDocumentLine = (
    label: string,
    number: string,
    expiry: string | null | undefined,
    copyName: string,
    status: string,
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onAddClick: () => void,
    onToggleStatus?: () => void
  ) => {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>{label}</strong>
          <button onClick={onAddClick} style={{ background: "#06b6d4", color: "#fff", padding: "8px 10px", borderRadius: 6 }}>
            Add New {label}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 200px 220px 120px", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>{label} Number</div>
            <div style={{ fontSize: 14 }}>{number || "—"}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>{label} Expiry</div>
            <div style={{ fontSize: 14 }}>{expiry || "—"}</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Copy</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 13 }}>{copyName || "No file"}</div>
              <label style={{ background: "#f3f4f6", padding: "6px 8px", borderRadius: 6, cursor: "pointer" }}>
                Browse
                <input type="file" onChange={onFileChange} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Created / Updated</div>
            <div style={{ fontSize: 13, color: "#666" }}>{/* we don't keep a createdAt column in this single-row approach */}—</div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 6 }}>Status</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ padding: "4px 8px", borderRadius: 6, background: status === "ON" ? "#16a34a" : "#e5e7eb", color: status === "ON" ? "#fff" : "#374151", fontWeight: 700 }}>
                {status === "ON" ? "Active" : "Inactive"}
              </div>
              {onToggleStatus && <button onClick={onToggleStatus} style={{ padding: "6px 8px", borderRadius: 6, border: "none", background: "#f3f4f6" }}>Toggle</button>}
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

          {renderDocumentLine("FSSAI", fssaiNumber, fssaiExpiry, fssaiCopyName, fssaiStatus, onFssaiFile, () => openAdd("FSSAI"), async () => {
            // toggle FSSAI status quick action
            const newStatus = fssaiStatus === "ON" ? "OFF" : "ON";
            setFssaiStatus(newStatus);
            await supabase.from(TABLE).update({ FSSAIStatus: newStatus }).eq("RestroCode", restroCode);
          })}

          <hr />

          {renderDocumentLine("GST", gstNumber, null, gstCopyName, gstStatus, onGstFile, () => openAdd("GST"), async () => {
            const newStatus = gstStatus === "ON" ? "OFF" : "ON";
            setGstStatus(newStatus);
            await supabase.from(TABLE).update({ GSTStatus: newStatus }).eq("RestroCode", restroCode);
          })}

          <hr />

          {renderDocumentLine("PAN", panNumber, null, panCopyName, panStatus, onPanFile, () => openAdd("PAN"), async () => {
            const newStatus = panStatus === "ON" ? "OFF" : "ON";
            setPanStatus(newStatus);
            await supabase.from(TABLE).update({ PANStatus: newStatus }).eq("RestroCode", restroCode);
          })}
        </div>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 12 }}>
          <button onClick={() => {
            // revert to values from DB (reload)
            if (!restroCode) return;
            setRowLoaded(false);
            setTimeout(() => window.location.reload(), 50); // crude reload — or call fetch again
          }} style={{ padding: "8px 12px", borderRadius: 6 }}>Reload</button>

          <SubmitButton onClick={handleSaveRow}>{loading ? "Saving..." : "Save Address & Docs"}</SubmitButton>
        </div>
      </div>

      {/* Add modal */}
      {modalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", zIndex: 9999 }}>
          <div style={{ width: 520, background: "#fff", borderRadius: 10, padding: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}>
            <h3 style={{ marginTop: 0 }}>
              {modalOpen === "FSSAI" ? "Add New FSSAI" : modalOpen === "GST" ? "Add New GST" : "Add New PAN"}
            </h3>

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
                  <div style={{ color: "#666" }}>New entries will be created Active and previous values overwritten.</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button onClick={() => setModalOpen(null)} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
                <button onClick={() => saveModalEntry(modalOpen)} style={{ padding: "8px 12px", borderRadius: 6, background: "#06b6d4", color: "#fff" }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
