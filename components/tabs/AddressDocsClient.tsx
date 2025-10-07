// components/tabs/AddressDocsClient.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  initialData?: any;
  imagePrefix?: string;
  // from RestroEditModal common:
  local?: any;
  updateField?: (k: string, v: any) => void;
  restroCode?: string;
  InputWithIcon?: any;
  Toggle?: any;
};

export default function AddressDocsClient({
  initialData = {},
  imagePrefix = "",
  local = {},
  updateField = () => {},
}: Props) {
  // local._fssaiList and local._gstList will hold arrays of { number, expiry, active, uploadedCopyUrl? }
  // initialize from initialData or from local
  const initialF = local._fssaiList ?? initialData._fssaiList ?? [];
  const initialG = local._gstList ?? initialData._gstList ?? [];

  const [fssaiList, setFssaiList] = useState<any[]>([]);
  const [gstList, setGstList] = useState<any[]>([]);
  const [showFssaiModal, setShowFssaiModal] = useState(false);
  const [showGstModal, setShowGstModal] = useState(false);

  useEffect(() => {
    // normalize
    if (Array.isArray(initialF) && initialF.length) setFssaiList(initialF);
    else if (initialData.FSSAI_Number || initialData.FSSAI) {
      setFssaiList([{ number: initialData.FSSAI_Number ?? initialData.FSSAI, expiry: initialData.FSSAI_Expiry ?? "", active: true }]);
    } else {
      setFssaiList([]);
    }

    if (Array.isArray(initialG) && initialG.length) setGstList(initialG);
    else if (initialData.GST_Number || initialData.GST) {
      setGstList([{ number: initialData.GST_Number ?? initialData.GST, expiry: initialData.GST_Expiry ?? "", active: true }]);
    } else {
      setGstList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // whenever lists change, persist into parent local state via updateField so global save will persist
  useEffect(() => {
    updateField("_fssaiList", fssaiList);
    // also keep snapshot fields for backward compatibility
    const activeF = fssaiList.find((f) => f.active) || null;
    if (activeF) {
      updateField("FSSAI_Number", activeF.number);
      updateField("FSSAI_Expiry", activeF.expiry);
    } else {
      updateField("FSSAI_Number", "");
      updateField("FSSAI_Expiry", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fssaiList]);

  useEffect(() => {
    updateField("_gstList", gstList);
    const activeG = gstList.find((g) => g.active) || null;
    if (activeG) {
      updateField("GST_Number", activeG.number);
      updateField("GST_Expiry", activeG.expiry);
    } else {
      updateField("GST_Number", "");
      updateField("GST_Expiry", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstList]);

  function addNewFssai(obj: { number: string; expiry?: string }) {
    // mark all current inactive
    const updated = fssaiList.map((it) => ({ ...it, active: false }));
    updated.unshift({ number: obj.number, expiry: obj.expiry ?? "", active: true });
    setFssaiList(updated);
    setShowFssaiModal(false);
  }

  function addNewGst(obj: { number: string; expiry?: string }) {
    const updated = gstList.map((it) => ({ ...it, active: false }));
    updated.unshift({ number: obj.number, expiry: obj.expiry ?? "", active: true });
    setGstList(updated);
    setShowGstModal(false);
  }

  return (
    <div style={{ padding: 8 }}>
      {/* Top cards showing active items + Add buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "stretch" }}>
        <div style={{ flex: 1, background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, padding: 14, boxShadow: "0 4px 12px rgba(11,15,30,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "top" }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>FSSAI</div>
              {fssaiList.length ? (
                <>
                  <div style={{ fontWeight: 700 }}>{fssaiList.find((f) => f.active)?.number ?? fssaiList[0].number}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{fssaiList.find((f) => f.active)?.expiry ?? "No expiry"}</div>
                </>
              ) : (
                <div style={{ color: "#6b7280" }}>No FSSAI on file</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <button onClick={() => setShowFssaiModal(true)} style={{ background: "#06b6d4", color: "#fff", padding: "6px 10px", borderRadius: 6, border: "none", fontWeight: 700 }}>Add New FSSAI</button>
              <div style={{ marginTop: 10, color: fssaiList.find((f) => f.active) ? "#059669" : "#6b7280", fontWeight: 700 }}>
                {fssaiList.find((f) => f.active) ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, background: "#fff", border: "1px solid #f0f0f0", borderRadius: 8, padding: 14, boxShadow: "0 4px 12px rgba(11,15,30,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "top" }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>GST</div>
              {gstList.length ? (
                <>
                  <div style={{ fontWeight: 700 }}>{gstList.find((g) => g.active)?.number ?? gstList[0].number}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{gstList.find((g) => g.active)?.expiry ?? "No expiry"}</div>
                </>
              ) : (
                <div style={{ color: "#6b7280" }}>No GST on file</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <button onClick={() => setShowGstModal(true)} style={{ background: "#06b6d4", color: "#fff", padding: "6px 10px", borderRadius: 6, border: "none", fontWeight: 700 }}>Add New GST</button>
              <div style={{ marginTop: 10, color: gstList.find((g) => g.active) ? "#059669" : "#6b7280", fontWeight: 700 }}>
                {gstList.find((g) => g.active) ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section header for Address fields */}
      <div style={{ textAlign: "center", margin: "18px 0" }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Address & Documents</div>
      </div>

      {/* Address form (existing fields) */}
      <div style={{ background: "#fff", borderRadius: 8, padding: 20, border: "1px solid #f3f3f3" }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Restro Address</div>
          <textarea className="readonly" style={{ width: "100%", minHeight: 60 }}>{local.RestroAddress ?? initialData.RestroAddress ?? ""}</textarea>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>City / Village</div>
            <input className="input" value={local.City ?? ""} onChange={(e) => updateField("City", e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>State</div>
            <input className="input" value={local.State ?? ""} onChange={(e) => updateField("State", e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>District</div>
            <input className="input" value={local.District ?? ""} onChange={(e) => updateField("District", e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>Pin Code</div>
            <input className="input" value={local.PinCode ?? ""} onChange={(e) => updateField("PinCode", e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>Latitude</div>
            <input className="input" value={local.Latitude ?? ""} onChange={(e) => updateField("Latitude", e.target.value)} />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>Longitude</div>
            <input className="input" value={local.Longitude ?? ""} onChange={(e) => updateField("Longitude", e.target.value)} />
          </div>

          {/* FSSAI fields (read-only) */}
          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>FSSAI Number</div>
            <input className="input" value={local.FSSAI_Number ?? ""} readOnly />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>FSSAI Expiry</div>
            <input className="input" value={local.FSSAI_Expiry ?? ""} readOnly />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>GST Number</div>
            <input className="input" value={local.GST_Number ?? ""} readOnly />
          </div>

          <div>
            <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>GST Expiry</div>
            <input className="input" value={local.GST_Expiry ?? ""} readOnly />
          </div>

          {/* extra space filler */}
          <div />
        </div>
      </div>

      {/* FSSAI Add Modal */}
      {showFssaiModal && (
        <SimpleDocModal
          title="Add New FSSAI"
          onClose={() => setShowFssaiModal(false)}
          onSave={(data) => addNewFssai(data)}
          fields={[{ name: "number", label: "FSSAI Number", placeholder: "Enter FSSAI number" }, { name: "expiry", label: "Expiry Date (dd-mm-yyyy)", placeholder: "dd-mm-yyyy" }]}
        />
      )}

      {/* GST Add Modal */}
      {showGstModal && (
        <SimpleDocModal
          title="Add New GST"
          onClose={() => setShowGstModal(false)}
          onSave={(data) => addNewGst(data)}
          fields={[{ name: "number", label: "GST Number", placeholder: "Enter GST number" }, { name: "expiry", label: "Expiry Date (dd-mm-yyyy)", placeholder: "dd-mm-yyyy" }]}
        />
      )}
    </div>
  );
}

/* small reusable modal used above for both FSSAI and GST additions */
function SimpleDocModal({ title, onClose, onSave, fields }: any) {
  const [state, setState] = useState<any>({});
  function set(k: string, v: any) { setState((s: any) => ({ ...s, [k]: v })); }
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2200
    }}>
      <div style={{ width: 480, background: "#fff", borderRadius: 8, padding: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {fields.map((f: any) => (
            <div key={f.name}>
              <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 6 }}>{f.label}</div>
              <input value={state[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e6e6e6" }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
          <button onClick={onClose} style={{ background: "#fff", border: "1px solid #e6e6e6", padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
          <button onClick={() => { if (!state.number) return alert("Please enter number"); onSave({ number: state.number, expiry: state.expiry ?? "" }); }} style={{ background: "#0ea5e9", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6 }}>Save</button>
        </div>
      </div>
    </div>
  );
}
