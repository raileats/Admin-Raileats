"use client";

import React, { useMemo, useState } from "react";

type FssaiEntry = {
  id: string; // local id (uuid-ish)
  FSSAINumber: string;
  FSSAIExpiryDate: string | null; // yyyy-mm-dd
  FSSAICopyUpload?: string | null;
  FSSAIStatus: 0 | 1; // 1 active, 0 inactive
};

type GstEntry = {
  id: string;
  GSTNumber: string;
  GSTType?: string;
  GSTCopyUpload?: string | null;
  GSTStatus: 0 | 1;
};

type PanEntry = {
  id: string;
  PANNumber: string;
  PANType?: string;
  UploadPanCopy?: string | null;
  PANStatus: 0 | 1;
};

type Props = {
  initialData: any; // row from RestroMaster
  restroCode: number;
};

const BOX_BG = "#eaf6ff";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function isoDateFromInput(d?: string | null) {
  if (!d) return null;
  // assume already yyyy-mm-dd
  return d;
}

export default function AddressDocsForm({ initialData, restroCode }: Props) {
  // address fields
  const [restroAddress, setRestroAddress] = useState(initialData?.RestroAddress ?? "");
  const [city, setCity] = useState(initialData?.City ?? "");
  const [stateName] = useState(initialData?.State ?? ""); // readonly
  const [district] = useState(initialData?.District ?? ""); // readonly
  const [pinCode, setPinCode] = useState(initialData?.PinCode ?? "");
  const [latitude, setLatitude] = useState(initialData?.RestroLatitude ?? "");
  const [longitude, setLongitude] = useState(initialData?.RestroLongitude ?? "");

  // existing single fields (kept for backward compatibility)
  const [fssaiNumber, setFssaiNumber] = useState(""); // kept for quick-add (not used in saved body)
  const [fssaiExpiry, setFssaiExpiry] = useState("");

  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Prepare initial lists from initialData if available
  const initialFssaiList: FssaiEntry[] = useMemo(() => {
    // If initialData has single columns, convert to list.
    // Also support if backend already returned historical array in initialData.FSSAIs
    if (Array.isArray(initialData?.FSSAIs)) {
      return initialData.FSSAIs.map((x: any) => ({
        id: uid(),
        FSSAINumber: x.FSSAINumber ?? "",
        FSSAIExpiryDate: x.FSSAIExpiryDate ?? null,
        FSSAICopyUpload: x.FSSAICopyUpload ?? null,
        FSSAIStatus: x.FSSAIStatus ?? 0,
      }));
    }
    // fallback: single entry
    if (initialData?.FSSAINumber) {
      return [
        {
          id: uid(),
          FSSAINumber: initialData.FSSAINumber,
          FSSAIExpiryDate: initialData.FSSAIExpiryDate ?? null,
          FSSAICopyUpload: initialData.FSSAICopyUpload ?? null,
          FSSAIStatus: initialData.FSSAIStatus ?? 1,
        },
      ];
    }
    return [];
  }, [initialData]);

  const initialGstList: GstEntry[] = useMemo(() => {
    if (Array.isArray(initialData?.GSTs)) {
      return initialData.GSTs.map((x: any) => ({
        id: uid(),
        GSTNumber: x.GSTNumber ?? "",
        GSTType: x.GSTType ?? "",
        GSTCopyUpload: x.GSTCopyUpload ?? null,
        GSTStatus: x.GSTStatus ?? 0,
      }));
    }
    if (initialData?.GSTNumber) {
      return [
        {
          id: uid(),
          GSTNumber: initialData.GSTNumber,
          GSTType: initialData.GSTType ?? "",
          GSTCopyUpload: initialData.GSTCopyUpload ?? null,
          GSTStatus: initialData.GSTStatus ?? 1,
        },
      ];
    }
    return [];
  }, [initialData]);

  const initialPanList: PanEntry[] = useMemo(() => {
    if (Array.isArray(initialData?.PANs)) {
      return initialData.PANs.map((x: any) => ({
        id: uid(),
        PANNumber: x.PANNumber ?? "",
        PANType: x.PANType ?? "",
        UploadPanCopy: x.UploadPanCopy ?? null,
        PANStatus: x.PANStatus ?? 0,
      }));
    }
    if (initialData?.PANNumber) {
      return [
        {
          id: uid(),
          PANNumber: initialData.PANNumber,
          PANType: initialData.PANType ?? "",
          UploadPanCopy: initialData.UploadPanCopy ?? null,
          PANStatus: initialData.PANStatus ?? 1,
        },
      ];
    }
    return [];
  }, [initialData]);

  const [fssaiList, setFssaiList] = useState<FssaiEntry[]>(initialFssaiList);
  const [gstList, setGstList] = useState<GstEntry[]>(initialGstList);
  const [panList, setPanList] = useState<PanEntry[]>(initialPanList);

  // Add-new modals (simple local state for forms)
  const [showAddFssai, setShowAddFssai] = useState(false);
  const [newFssaiNumber, setNewFssaiNumber] = useState("");
  const [newFssaiExpiry, setNewFssaiExpiry] = useState(""); // yyyy-mm-dd

  const [showAddGst, setShowAddGst] = useState(false);
  const [newGstNumber, setNewGstNumber] = useState("");
  const [newGstType, setNewGstType] = useState("");

  const [showAddPan, setShowAddPan] = useState(false);
  const [newPanNumber, setNewPanNumber] = useState("");
  const [newPanType, setNewPanType] = useState("");

  // min date for expiry = today + 1 month
  const minExpiry = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const mm = ("0" + (d.getMonth() + 1)).slice(-2);
    const dd = ("0" + d.getDate()).slice(-2);
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // handlers to add new entries (they will mark older active->inactive)
  function handleAddFssaiSubmit() {
    if (!newFssaiNumber?.trim()) {
      setMessage("FSSAI number required.");
      return;
    }
    if (!newFssaiExpiry) {
      setMessage("Expiry date required.");
      return;
    }
    // validate min date
    if (newFssaiExpiry < minExpiry) {
      setMessage("Expiry date must be at least 1 month from today.");
      return;
    }
    // mark older active -> inactive
    const updated = fssaiList.map((e) => ({ ...e, FSSAIStatus: 0 }));
    const entry: FssaiEntry = {
      id: uid(),
      FSSAINumber: newFssaiNumber.trim(),
      FSSAIExpiryDate: isoDateFromInput(newFssaiExpiry),
      FSSAICopyUpload: null,
      FSSAIStatus: 1,
    };
    setFssaiList([...updated, entry]);
    setNewFssaiNumber("");
    setNewFssaiExpiry("");
    setShowAddFssai(false);
    setMessage(null);
  }

  function handleAddGstSubmit() {
    if (!newGstNumber?.trim()) {
      setMessage("GST number required.");
      return;
    }
    const updated = gstList.map((e) => ({ ...e, GSTStatus: 0 }));
    const entry: GstEntry = {
      id: uid(),
      GSTNumber: newGstNumber.trim(),
      GSTType: newGstType,
      GSTCopyUpload: null,
      GSTStatus: 1,
    };
    setGstList([...updated, entry]);
    setNewGstNumber("");
    setNewGstType("");
    setShowAddGst(false);
    setMessage(null);
  }

  function handleAddPanSubmit() {
    if (!newPanNumber?.trim()) {
      setMessage("PAN number required.");
      return;
    }
    const updated = panList.map((e) => ({ ...e, PANStatus: 0 }));
    const entry: PanEntry = {
      id: uid(),
      PANNumber: newPanNumber.trim(),
      PANType: newPanType,
      UploadPanCopy: null,
      PANStatus: 1,
    };
    setPanList([...updated, entry]);
    setNewPanNumber("");
    setNewPanType("");
    setShowAddPan(false);
    setMessage(null);
  }

  // remove / deactivate helpers (not required but useful)
  function deactivateFssai(id: string) {
    setFssaiList((s) => s.map((x) => (x.id === id ? { ...x, FSSAIStatus: 0 } : x)));
  }
  function deactivateGst(id: string) {
    setGstList((s) => s.map((x) => (x.id === id ? { ...x, GSTStatus: 0 } : x)));
  }
  function deactivatePan(id: string) {
    setPanList((s) => s.map((x) => (x.id === id ? { ...x, PANStatus: 0 } : x)));
  }

  // Save to server - this posts address plus all lists
  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const body: Record<string, any> = {
        RestroAddress: restroAddress,
        City: city,
        State: stateName,
        District: district,
        PinCode: pinCode,
        RestroLatitude: latitude,
        RestroLongitude: longitude,
        // documents as arrays
        FSSAIs: fssaiList.map((f) => ({
          FSSAINumber: f.FSSAINumber,
          FSSAIExpiryDate: f.FSSAIExpiryDate,
          FSSAICopyUpload: f.FSSAICopyUpload,
          FSSAIStatus: f.FSSAIStatus,
        })),
        GSTs: gstList.map((g) => ({
          GSTNumber: g.GSTNumber,
          GSTType: g.GSTType,
          GSTCopyUpload: g.GSTCopyUpload,
          GSTStatus: g.GSTStatus,
        })),
        PANs: panList.map((p) => ({
          PANNumber: p.PANNumber,
          PANType: p.PANType,
          UploadPanCopy: p.UploadPanCopy,
          PANStatus: p.PANStatus,
        })),
      };

      const res = await fetch(`/api/restros/${restroCode}/address-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Save failed: ${data?.error ?? "unknown"}`);
      } else {
        setMessage("Saved successfully.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Save failed (network).");
    } finally {
      setSaving(false);
    }
  }

  // styles
  const containerStyle: React.CSSProperties = { padding: 18 };
  const sectionStyle: React.CSSProperties = { background: BOX_BG, padding: 18, borderRadius: 6, marginBottom: 18 };
  const sectionTitle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#0b5f8a" };
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

      {/* ADDRESS */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Address</div>

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
            <input value={stateName} readOnly style={{ ...inputStyle, background: "#f5f7fa", cursor: "not-allowed" }} />
          </div>

          <div>
            <div style={labelStyle}>District</div>
            <input value={district} readOnly style={{ ...inputStyle, background: "#f5f7fa", cursor: "not-allowed" }} />
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

      {/* DOCUMENTS - FSSAI */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Documents</div>

        <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>FSSAI</div>
          <button onClick={() => setShowAddFssai(true)} style={{ background: "#0ea5e9", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
            + Add new FSSAI
          </button>
        </div>

        {/* list FSSAI */}
        <div style={{ marginBottom: 12 }}>
          {fssaiList.length === 0 && <div style={{ color: "#666" }}>No FSSAI entries</div>}
          {fssaiList.map((f) => (
            <div key={f.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>{f.FSSAINumber}</div>
              <div style={{ width: 180 }}>{f.FSSAIExpiryDate ?? "-"}</div>
              <div style={{ width: 110, textAlign: "center" }}>
                {f.FSSAIStatus ? <span style={{ color: "green", fontWeight: 700 }}>Active</span> : <span style={{ color: "crimson", fontWeight: 700 }}>Inactive</span>}
              </div>
            </div>
          ))}
        </div>

        {/* GST section */}
        <div style={{ marginTop: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>GST</div>
          <button onClick={() => setShowAddGst(true)} style={{ background: "#0ea5e9", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
            + Add new GST Detail
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          {gstList.length === 0 && <div style={{ color: "#666" }}>No GST entries</div>}
          {gstList.map((g) => (
            <div key={g.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>{g.GSTNumber}</div>
              <div style={{ width: 180 }}>{g.GSTType ?? "-"}</div>
              <div style={{ width: 110, textAlign: "center" }}>{g.GSTStatus ? <span style={{ color: "green", fontWeight: 700 }}>Active</span> : <span style={{ color: "crimson", fontWeight: 700 }}>Inactive</span>}</div>
            </div>
          ))}
        </div>

        {/* PAN section */}
        <div style={{ marginTop: 8, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 600 }}>PAN</div>
          <button onClick={() => setShowAddPan(true)} style={{ background: "#0ea5e9", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
            + Add new PAN
          </button>
        </div>

        <div>
          {panList.length === 0 && <div style={{ color: "#666" }}>No PAN entries</div>}
          {panList.map((p) => (
            <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>{p.PANNumber}</div>
              <div style={{ width: 180 }}>{p.PANType ?? "-"}</div>
              <div style={{ width: 110, textAlign: "center" }}>{p.PANStatus ? <span style={{ color: "green", fontWeight: 700 }}>Active</span> : <span style={{ color: "crimson", fontWeight: 700 }}>Inactive</span>}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
          Note: File upload is disabled in this UI example. Status changes are local and will be sent to the server when you press Save.
        </div>
      </div>

      {/* bottom actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => { window.history.back(); }} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff" }}>
          Cancel
        </button>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {message && <div style={{ color: message.includes("failed") ? "crimson" : "green" }}>{message}</div>}
          <button onClick={handleSave} disabled={saving} style={{ background: "#06a6e3", color: "#fff", padding: "10px 16px", borderRadius: 8, border: "none", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* ---- modal-like overlays (simple) ---- */}
      {showAddFssai && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ width: 560, background: "#fff", borderRadius: 8, padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Add new FSSAI</h3>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>FSSAI Number</div>
              <input value={newFssaiNumber} onChange={(e) => setNewFssaiNumber(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>FSSAI Expiry (choose)</div>
              <input type="date" min={minExpiry} value={newFssaiExpiry} onChange={(e) => setNewFssaiExpiry(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => { setShowAddFssai(false); setMessage(null); }} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
              <button onClick={handleAddFssaiSubmit} style={{ background: "#06a6e3", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showAddGst && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ width: 560, background: "#fff", borderRadius: 8, padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Add new GST</h3>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>GST Number</div>
              <input value={newGstNumber} onChange={(e) => setNewGstNumber(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>GST Type</div>
              <input value={newGstType} onChange={(e) => setNewGstType(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowAddGst(false)} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
              <button onClick={handleAddGstSubmit} style={{ background: "#06a6e3", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {showAddPan && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
          <div style={{ width: 560, background: "#fff", borderRadius: 8, padding: 18 }}>
            <h3 style={{ marginTop: 0 }}>Add new PAN</h3>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>PAN Number</div>
              <input value={newPanNumber} onChange={(e) => setNewPanNumber(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={labelStyle}>PAN Type</div>
              <input value={newPanType} onChange={(e) => setNewPanType(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowAddPan(false)} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
              <button onClick={handleAddPanSubmit} style={{ background: "#06a6e3", color: "#fff", padding: "8px 12px", borderRadius: 6 }}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
