// components/restro-edit/AddressDocumentsTab.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import UI from "@/components/AdminUI";
const { AdminForm, FormRow, FormField, SubmitButton, Toggle } = UI;

type DocEntry = {
  id: string;
  number: string;
  expiry?: string | null;
  photoName?: string | null;
  status: "ON" | "OFF";
  createdAt: string;
};

type Props = {
  local: any;
  updateField: (key: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function fmtDateISOToReadable(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function AddressDocumentsTab({ local = {}, updateField }: Props) {
  // Normalize arrays from parent local (backwards-compatible single-field conversion)
  const initialFSSAIs: DocEntry[] = useMemo(() => {
    const arr: DocEntry[] = [];
    if (Array.isArray(local?.FSSAIEntries)) return local.FSSAIEntries;
    if (local?.FSSAINumber) {
      arr.push({
        id: genId(),
        number: String(local.FSSAINumber ?? ""),
        expiry: local?.FSSAIExpiry ?? null,
        photoName: local?.FSSAICopy ?? null,
        status: local?.FSSAIStatus === "ON" ? "ON" : "OFF",
        createdAt: local?.FSSAICreatedAt ?? new Date().toISOString(),
      });
    }
    return arr;
  }, [local]);

  const initialGSTs: DocEntry[] = useMemo(() => {
    const arr: DocEntry[] = [];
    if (Array.isArray(local?.GSTEntries)) return local.GSTEntries;
    if (local?.GSTNumber) {
      arr.push({
        id: genId(),
        number: String(local.GSTNumber ?? ""),
        expiry: null,
        photoName: local?.GSTCopy ?? null,
        status: local?.GSTStatus === "ON" ? "ON" : "OFF",
        createdAt: local?.GSTCreatedAt ?? new Date().toISOString(),
      });
    }
    return arr;
  }, [local]);

  const initialPANs: DocEntry[] = useMemo(() => {
    const arr: DocEntry[] = [];
    if (Array.isArray(local?.PANEntries)) return local.PANEntries;
    if (local?.PANNumber) {
      arr.push({
        id: genId(),
        number: String(local.PANNumber ?? ""),
        expiry: null,
        photoName: local?.PANCopy ?? null,
        status: local?.PANStatus === "ON" ? "ON" : "OFF",
        createdAt: local?.PANCreatedAt ?? new Date().toISOString(),
      });
    }
    return arr;
  }, [local]);

  const [fssaiEntries, setFssaiEntries] = useState<DocEntry[]>(initialFSSAIs);
  const [gstEntries, setGstEntries] = useState<DocEntry[]>(initialGSTs);
  const [panEntries, setPanEntries] = useState<DocEntry[]>(initialPANs);

  const [modalOpen, setModalOpen] = useState<null | "FSSAI" | "GST" | "PAN">(null);
  const [modalForm, setModalForm] = useState<{ number: string; expiry?: string | null; photoFile?: File | null; extra?: any }>({
    number: "",
    expiry: null,
    photoFile: null,
    extra: {},
  });

  const persist = (key: "FSSAIEntries" | "GSTEntries" | "PANEntries", arr: DocEntry[]) => {
    updateField(key, arr);
  };

  // expiry check on mount (auto-inactivate expired ON entries)
  useEffect(() => {
    const today = new Date();
    let changed = false;

    const checkAndFix = (arr: DocEntry[]) =>
      arr.map((e) => {
        if (e.expiry) {
          const exp = new Date(e.expiry);
          exp.setHours(23, 59, 59, 999);
          if (exp < today && e.status === "ON") {
            changed = true;
            return { ...e, status: "OFF" };
          }
        }
        return e;
      });

    const fnew = checkAndFix(fssaiEntries);
    const gnew = checkAndFix(gstEntries);
    const pnew = checkAndFix(panEntries);

    if (changed) {
      setFssaiEntries(fnew);
      persist("FSSAIEntries", fnew);
      setGstEntries(gnew);
      persist("GSTEntries", gnew);
      setPanEntries(pnew);
      persist("PANEntries", pnew);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setFssaiEntries(initialFSSAIs), [initialFSSAIs]);
  useEffect(() => setGstEntries(initialGSTs), [initialGSTs]);
  useEffect(() => setPanEntries(initialPANs), [initialPANs]);

  function openAddModal(kind: "FSSAI" | "GST" | "PAN") {
    setModalForm({ number: "", expiry: null, photoFile: null, extra: {} });
    setModalOpen(kind);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setModalForm((s) => ({ ...s, photoFile: f }));
  }

  function saveFromModal(kind: "FSSAI" | "GST" | "PAN") {
    const now = new Date().toISOString();
    const newEntry: DocEntry = {
      id: genId(),
      number: modalForm.number?.trim() ?? "",
      expiry: modalForm.expiry ?? null,
      photoName: modalForm.photoFile ? modalForm.photoFile.name : null,
      status: "ON",
      createdAt: now,
    };

    if (!newEntry.number) {
      alert("Please enter number");
      return;
    }

    if (kind === "FSSAI") {
      const updated = fssaiEntries.map((e) => ({ ...e, status: e.status === "ON" ? "OFF" : e.status }));
      const next = [...updated, newEntry];
      setFssaiEntries(next);
      persist("FSSAIEntries", next);
    } else if (kind === "GST") {
      const updated = gstEntries.map((e) => ({ ...e, status: e.status === "ON" ? "OFF" : e.status }));
      const next = [...updated, newEntry];
      setGstEntries(next);
      persist("GSTEntries", next);
    } else {
      const updated = panEntries.map((e) => ({ ...e, status: e.status === "ON" ? "OFF" : e.status }));
      const next = [...updated, newEntry];
      setPanEntries(next);
      persist("PANEntries", next);
    }

    setModalOpen(null);
  }

  function toggleEntryStatus(kind: "FSSAI" | "GST" | "PAN", id: string) {
    if (kind === "FSSAI") {
      const next = fssaiEntries.map((e) => (e.id === id ? { ...e, status: e.status === "ON" ? "OFF" : "ON" } : e));
      setFssaiEntries(next);
      persist("FSSAIEntries", next);
    } else if (kind === "GST") {
      const next = gstEntries.map((e) => (e.id === id ? { ...e, status: e.status === "ON" ? "OFF" : "ON" } : e));
      setGstEntries(next);
      persist("GSTEntries", next);
    } else {
      const next = panEntries.map((e) => (e.id === id ? { ...e, status: e.status === "ON" ? "OFF" : "ON" } : e));
      setPanEntries(next);
      persist("PANEntries", next);
    }
  }

  const renderRowList = (kind: "FSSAI" | "GST" | "PAN", entries: DocEntry[]) => {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>{kind}</div>
          <div>
            <button type="button" onClick={() => openAddModal(kind)} style={{ background: "#06b6d4", color: "#fff", padding: "8px 10px", borderRadius: 6 }}>
              Add New {kind}
            </button>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #eee", paddingTop: 8 }}>
          {entries.length === 0 ? (
            <div style={{ color: "#666", padding: "8px 0" }}>No entries</div>
          ) : (
            entries
              .slice()
              .reverse()
              .map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 200px 180px 220px 120px",
                    gap: 12,
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px dashed #f1f1f1",
                  }}
                >
                  <div style={{ fontSize: 14, wordBreak: "break-all" }}>{e.number}</div>
                  <div style={{ fontSize: 13 }}>{e.expiry ?? "—"}</div>
                  <div style={{ fontSize: 13 }}>
                    {e.photoName ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 48, height: 32, background: "#fafafa", border: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                          Preview
                        </div>
                        <div style={{ fontSize: 12, color: "#333" }}>{e.photoName}</div>
                      </div>
                    ) : (
                      <span style={{ color: "#999" }}>No file</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13 }}>{fmtDateISOToReadable(e.createdAt)}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ padding: "4px 8px", borderRadius: 6, background: e.status === "ON" ? "#16a34a" : "#e5e7eb", color: e.status === "ON" ? "#fff" : "#374151", fontWeight: 700 }}>
                      {e.status === "ON" ? "Active" : "Inactive"}
                    </div>
                    <button type="button" onClick={() => toggleEntryStatus(kind, e.id)} style={{ border: "none", background: "#f3f4f6", padding: "6px 8px", borderRadius: 6 }}>
                      Toggle
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  return (
    <AdminForm>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>Address & Documents</h3>

      <div style={{ maxWidth: 1200, margin: "12px auto" }}>
        {/* Address block (kept at top exactly as requested) */}
        <div style={{ background: "#eef8ff", padding: 16, borderRadius: 10, border: "1px solid #d6eaf8", marginBottom: 16 }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#083d77", textAlign: "center" }}>Address</h4>

          <FormRow cols={3} gap={12}>
            <FormField label="Restro Address" className="col-span-3">
              <textarea
                name="RestroAddress"
                value={local?.RestroAddress ?? ""}
                onChange={(e) => updateField("RestroAddress", e.target.value)}
                style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 6, border: "1px solid #e6eef6" }}
              />
            </FormField>

            <FormField label="City / Village">
              <input name="City" value={local?.City ?? ""} onChange={(e) => updateField("City", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="State">
              <input name="State" value={local?.State ?? ""} onChange={(e) => updateField("State", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="District">
              <input name="District" value={local?.District ?? ""} onChange={(e) => updateField("District", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Pin Code">
              <input name="PinCode" value={local?.PinCode ?? ""} onChange={(e) => updateField("PinCode", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Latitude">
              <input name="RestroLatitude" value={local?.RestroLatitude ?? ""} onChange={(e) => updateField("RestroLatitude", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>

            <FormField label="Longitude">
              <input name="RestroLongitude" value={local?.RestroLongitude ?? ""} onChange={(e) => updateField("RestroLongitude", e.target.value)} className="w-full p-2 rounded border" />
            </FormField>
          </FormRow>
        </div>

        {/* Documents area */}
        <div style={{ background: "#fff", padding: 12, borderRadius: 8, border: "1px solid #f1f1f1" }}>
          <h4 style={{ margin: "4px 0 16px 0", color: "#083d77", textAlign: "center" }}>Documents</h4>

          {renderRowList("FSSAI", fssaiEntries)}

          <div style={{ height: 16 }} />

          {renderRowList("GST", gstEntries)}

          <div style={{ height: 16 }} />

          {renderRowList("PAN", panEntries)}
        </div>

        <div style={{ marginTop: 16, color: "#666", fontSize: 13 }}>
          Note: Add new entries will deactivate the previous active entry. Expired entries are auto-marked inactive by expiry date check.
        </div>

        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <SubmitButton onClick={() => { /* parent save usually handles final persistence */ }}>Save</SubmitButton>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", zIndex: 9999 }}>
          <div style={{ width: 520, background: "#fff", borderRadius: 10, padding: 18, boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}>
            <h3 style={{ marginTop: 0 }}>{modalOpen === "FSSAI" ? "Add New FSSAI" : modalOpen === "GST" ? "Add New GST" : "Add New PAN"}</h3>

            <div style={{ display: "grid", gap: 10 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Number</label>
                <input value={modalForm.number} onChange={(e) => setModalForm((s) => ({ ...s, number: e.target.value }))} className="w-full p-2 rounded border" />
              </div>

              {modalOpen === "FSSAI" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Expiry</label>
                  <input type="date" value={modalForm.expiry ?? ""} onChange={(e) => setModalForm((s) => ({ ...s, expiry: e.target.value ?? null }))} className="w-full p-2 rounded border" />
                </div>
              )}

              {modalOpen === "GST" && (
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>GST Type</label>
                  <select value={modalForm.extra?.gstType ?? ""} onChange={(e) => setModalForm((s) => ({ ...s, extra: { ...(s.extra || {}), gstType: e.target.value } }))} className="w-full p-2 rounded border">
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
                  <select value={modalForm.extra?.panType ?? ""} onChange={(e) => setModalForm((s) => ({ ...s, extra: { ...(s.extra || {}), panType: e.target.value } }))} className="w-full p-2 rounded border">
                    <option value="">-- Select --</option>
                    <option value="Individual">Individual</option>
                    <option value="Company">Company</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Upload Photo / Copy</label>
                <input type="file" onChange={handleFileSelect} />
                {modalForm.photoFile && <div style={{ marginTop: 6 }}>Selected: {modalForm.photoFile.name}</div>}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Status (auto)</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ padding: "6px 10px", background: "#16a34a", color: "#fff", borderRadius: 6 }}>Active</div>
                  <div style={{ color: "#666" }}>New entries are created Active; previous active entries are set Inactive automatically.</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setModalOpen(null)} style={{ padding: "8px 12px", borderRadius: 6 }}>Cancel</button>
                <button type="button" onClick={() => saveFromModal(modalOpen)} style={{ padding: "8px 12px", borderRadius: 6, background: "#06b6d4", color: "#fff" }}>
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
