"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseBrowser"; // path we created
type Props = {
  initialData: any; // row from RestroMaster
  restroCode: number;
};

const BOX_BG = "#eaf6ff";

export default function AddressDocsForm({ initialData, restroCode }: Props) {
  // address fields
  const [restroAddress, setRestroAddress] = useState(initialData?.RestroAddress ?? "");
  const [city, setCity] = useState(initialData?.City ?? "");
  const [stateName, setStateName] = useState(initialData?.State ?? "");
  const [district, setDistrict] = useState(initialData?.District ?? "");
  const [pinCode, setPinCode] = useState(initialData?.PinCode ?? "");
  const [latitude, setLatitude] = useState(initialData?.RestroLatitude ?? "");
  const [longitude, setLongitude] = useState(initialData?.RestroLongitude ?? "");

  // documents single/master (these will be rendered from history tables)
  const [fssaiList, setFssaiList] = useState<any[]>([]);
  const [gstList, setGstList] = useState<any[]>([]);
  const [panList, setPanList] = useState<any[]>([]);

  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // modal states
  const [showFssaiModal, setShowFssaiModal] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);

  // fssai modal form
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [fssaiExpiry, setFssaiExpiry] = useState("");
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);

  // gst modal form
  const [gstNumber, setGstNumber] = useState("");
  const [gstType, setGstType] = useState("");
  const [gstFile, setGstFile] = useState<File | null>(null);

  useEffect(() => {
    fetchHistories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restroCode]);

  async function fetchHistories() {
    try {
      const { data: fdata } = await supabase
        .from("restro_fssai")
        .select("*")
        .eq("restro_code", restroCode)
        .order("created_at", { ascending: false });
      const { data: gdata } = await supabase
        .from("restro_gst")
        .select("*")
        .eq("restro_code", restroCode)
        .order("created_at", { ascending: false });
      const { data: pdata } = await supabase
        .from("restro_pan")
        .select("*")
        .eq("restro_code", restroCode)
        .order("created_at", { ascending: false });
      setFssaiList(fdata ?? []);
      setGstList(gdata ?? []);
      setPanList(pdata ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  // helper: format date
  function formatDate(d?: string | null) {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString();
  }

  // min expiry date = today + 1 month (for input date min attr)
  const minExpiry = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  async function uploadFileToStorage(file: File | null, folder: string) {
    if (!file) return null;
    const path = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const bucket = "restro-docs";
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (upErr) {
      console.error("Upload error", upErr);
      throw upErr;
    }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  }

  // FSSAI submit (calls RPC)
  async function submitNewFssai() {
    try {
      // client validation: expiry must be >= minExpiry
      if (!fssaiNumber) {
        setMessage("FSSAI number required");
        return;
      }
      if (fssaiExpiry && fssaiExpiry < minExpiry) {
        setMessage("FSSAI expiry must be at least 1 month from today");
        return;
      }
      setMessage(null);
      const copyUrl = fssaiFile ? await uploadFileToStorage(fssaiFile, `restro_${restroCode}/fssai`) : null;

      const { data, error } = await supabase.rpc("add_fssai_atomic", {
        p_restro_code: restroCode,
        p_fssai_number: fssaiNumber,
        p_fssai_expiry: fssaiExpiry || null,
        p_fssai_copy_url: copyUrl || null,
        p_created_by: "web", // optionally send user email
      });

      if (error) {
        console.error("RPC error", error);
        setMessage("Failed to save FSSAI: " + (error.message ?? error));
      } else {
        // rpc returns the newly inserted row — but Supabase RPC returns array
        setFssaiList((prev) => {
          const newRow = Array.isArray(data) && data.length ? data[0] : data;
          return [newRow, ...prev.map(r => ({ ...r, active: false }))];
        });
        setShowFssaiModal(false);
        setFssaiNumber("");
        setFssaiExpiry("");
        setFssaiFile(null);
        setMessage("FSSAI saved");
      }
    } catch (err: any) {
      console.error(err);
      setMessage("Network/upload error");
    }
  }

  // GST submit
  async function submitNewGst() {
    try {
      if (!gstNumber) {
        setMessage("GST number required");
        return;
      }
      setMessage(null);
      const copyUrl = gstFile ? await uploadFileToStorage(gstFile, `restro_${restroCode}/gst`) : null;
      const { data, error } = await supabase.rpc("add_gst_atomic", {
        p_restro_code: restroCode,
        p_gst_number: gstNumber,
        p_gst_type: gstType || null,
        p_gst_copy_url: copyUrl || null,
        p_created_by: "web",
      });
      if (error) {
        console.error("RPC error", error);
        setMessage("Failed to save GST: " + (error.message ?? error));
      } else {
        setGstList((prev) => {
          const newRow = Array.isArray(data) && data.length ? data[0] : data;
          return [newRow, ...prev.map(r => ({ ...r, active: false }))];
        });
        setShowGstModal(false);
        setGstNumber("");
        setGstType("");
        setGstFile(null);
        setMessage("GST saved");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network/upload error");
    }
  }

  // Save address (existing endpoint, unchanged)
  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const body: Record<string, any> = {
      RestroAddress: restroAddress,
      City: city,
      State: stateName,
      District: district,
      PinCode: pinCode,
      RestroLatitude: latitude,
      RestroLongitude: longitude,
    };

    try {
      const res = await fetch(`/api/restros/${restroCode}/address-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Save error", data);
        setMessage(`Save failed: ${data?.error ?? "unknown"}`);
      } else {
        setMessage("Saved successfully.");
      }
    } catch (err: any) {
      console.error(err);
      setMessage("Save failed (network).");
    } finally {
      setSaving(false);
    }
  }

  // UI helpers
  const containerStyle: React.CSSProperties = { padding: 18 };
  const sectionStyle: React.CSSProperties = { background: BOX_BG, padding: 18, borderRadius: 6, marginBottom: 18 };
  const labelStyle: React.CSSProperties = { fontSize: 13, color: "#333", marginBottom: 6 };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #e6eef7", boxSizing: "border-box" };

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 700 }}>{initialData?.RestroCode ?? restroCode} / {initialData?.RestroName}</div>
        <div style={{ fontSize: 13, color: "#1a8fb5" }}>
          {initialData?.StationName ? `(${initialData?.StationCode}) ${initialData?.StationName}` : ""}
        </div>
      </div>

      {/* ADDRESS SECTION */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#0b5f8a" }}>Address</div>

        <div style={{ marginBottom: 12 }}>
          <div style={labelStyle}>Restro Address</div>
          <textarea value={restroAddress} onChange={(e) => setRestroAddress(e.target.value)} style={{ ...inputStyle, minHeight: 90 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>City / Village</div>
            <input value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>State</div>
            {/* state non-editable */}
            <input value={stateName} readOnly style={{ ...inputStyle, background: "#fafafa", color: "#333" }} />
          </div>

          <div>
            <div style={labelStyle}>District</div>
            {/* district non-editable */}
            <input value={district} readOnly style={{ ...inputStyle, background: "#fafafa", color: "#333" }} />
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <div style={labelStyle}>Pin Code</div>
            <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Latitude</div>
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <div style={labelStyle}>Longitude</div>
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* DOCUMENTS SECTION: FSSAI + GST + PAN */}
      <div style={sectionStyle}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#0b5f8a" }}>Documents</div>

        {/* FSSAI area */}
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>FSSAI</div>
          <button onClick={() => setShowFssaiModal(true)} style={{ background: "#0ea5e9", color: "#fff", padding: "6px 10px", borderRadius: 6, border: "none" }}>
            + Add new FSSAI
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          {fssaiList.length === 0 && <div style={{ color: "#666" }}>No FSSAI entries</div>}
          {fssaiList.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f1f1" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.fssai_number}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{r.fssai_expiry ? formatDate(r.fssai_expiry) : ""}</div>
              </div>
              <div style={{ width: 120, textAlign: "right" }}>
                <span style={{ padding: "6px 10px", borderRadius: 6, color: "#fff", background: r.active ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                  {r.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* GST area */}
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>GST</div>
          <button onClick={() => setShowGstModal(true)} style={{ background: "#0ea5e9", color: "#fff", padding: "6px 10px", borderRadius: 6, border: "none" }}>
            + Add new GST
          </button>
        </div>

        <div>
          {gstList.length === 0 && <div style={{ color: "#666" }}>No GST entries</div>}
          {gstList.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f1f1" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.gst_number}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{r.gst_type ?? ""}</div>
              </div>
              <div style={{ width: 120, textAlign: "right" }}>
                <span style={{ padding: "6px 10px", borderRadius: 6, color: "#fff", background: r.active ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                  {r.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* PAN view (read only) */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>PAN</div>
          {panList.length === 0 && <div style={{ color: "#666" }}>No PAN entries</div>}
          {panList.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f1f1" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{r.pan_number}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{r.pan_type ?? ""}</div>
              </div>
              <div style={{ width: 120, textAlign: "right" }}>
                <span style={{ padding: "6px 10px", borderRadius: 6, color: "#fff", background: r.active ? "#16a34a" : "#ef4444", fontWeight: 700 }}>
                  {r.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* bottom actions (Cancel left, Save right) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => window.history.back()} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}>Cancel</button>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {message && <div style={{ color: message.includes("failed") ? "crimson" : "green" }}>{message}</div>}
          <button onClick={handleSave} disabled={saving} style={{ background: "#06a6e3", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none" }}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      {/* FSSAI Modal (simple) */}
      {showFssaiModal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", zIndex: 2000 }}>
          <div style={{ width: 680, background: "#fff", borderRadius: 8, padding: 18 }}>
            <h3>New FSSAI</h3>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>FSSAI Number</div>
              <input value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>FSSAI Expiry</div>
              <input type="date" value={fssaiExpiry} min={minExpiry} onChange={(e) => setFssaiExpiry(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>Upload Copy (optional)</div>
              <input type="file" onChange={(e) => setFssaiFile(e.target.files?.[0] ?? null)} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowFssaiModal(false)} style={{ padding: "8px 12px" }}>Cancel</button>
              <button onClick={submitNewFssai} style={{ padding: "8px 12px", background: "#06a6e3", color: "#fff" }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* GST Modal */}
      {showGstModal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", zIndex: 2000 }}>
          <div style={{ width: 640, background: "#fff", borderRadius: 8, padding: 18 }}>
            <h3>New GST</h3>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>GST Number</div>
              <input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>GST Type</div>
              <input value={gstType} onChange={(e) => setGstType(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>Upload Copy (optional)</div>
              <input type="file" onChange={(e) => setGstFile(e.target.files?.[0] ?? null)} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowGstModal(false)} style={{ padding: "8px 12px" }}>Cancel</button>
              <button onClick={submitNewGst} style={{ padding: "8px 12px", background: "#06a6e3", color: "#fff" }}>Submit</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
