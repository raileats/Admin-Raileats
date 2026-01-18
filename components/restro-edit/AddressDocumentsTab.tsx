"use client";

import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";
const { AdminForm, FormRow, FormField, SubmitButton } = UI;

type Props = {
  local: any;
  updateField: (key: string, v: any) => void;
};

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
}) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 42,
          height: 24,
          borderRadius: 16,
          background: checked ? "#06b6d4" : "#e5e7eb",
          position: "relative",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 22 : 3,
            width: 18,
            height: 18,
            borderRadius: 12,
            background: "#fff",
            transition: "left .15s",
          }}
        />
      </span>
      <span style={{ fontSize: 13 }}>{checked ? "Active" : "Inactive"}</span>
    </label>
  );
}

export default function AddressDocumentsTab({ local = {} }: Props) {
  const restroCode = local?.RestroCode;

  /* =======================
     FSSAI STATE
  ======================== */
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [fssaiExpiry, setFssaiExpiry] = useState<string | null>(null);
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [fssaiStatus, setFssaiStatus] = useState<"ON" | "OFF">("OFF");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* =======================
     LOAD FROM MASTER (VIEW)
  ======================== */
  useEffect(() => {
    setFssaiNumber(local?.FSSAINumber ?? "");
    setFssaiExpiry(local?.FSSAIExpiry ?? null);
    setFssaiStatus(local?.FSSAIStatus === "ON" ? "ON" : "OFF");
  }, [local]);

  /* =======================
     SAVE FSSAI (BANK-LIKE)
  ======================== */
  async function saveFssai() {
    if (!fssaiNumber) {
      alert("Enter FSSAI number");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch(
        `/api/restros/${encodeURIComponent(String(restroCode))}/fssai`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fssai_number: fssaiNumber,
            expiry_date: fssaiExpiry,
            file_url: fssaiFile ? fssaiFile.name : null,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Save failed");
      }

      alert("FSSAI saved successfully ✅");

      setFssaiStatus("ON");
      setModalOpen(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminForm>
      <h3 style={{ textAlign: "center" }}>Address & Documents</h3>

      {/* =======================
          FSSAI SECTION
      ======================== */}
      <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>FSSAI</strong>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              background: "#06b6d4",
              color: "#fff",
              padding: "6px 10px",
              borderRadius: 6,
            }}
          >
            Add New FSSAI
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 180px 180px 120px",
            gap: 12,
            marginTop: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12 }}>Number</div>
            <div>{fssaiNumber || "—"}</div>
          </div>

          <div>
            <div style={{ fontSize: 12 }}>Expiry</div>
            <div>{fssaiExpiry || "—"}</div>
          </div>

          <div>
            <div style={{ fontSize: 12 }}>File</div>
            <div>{fssaiFile?.name || "—"}</div>
          </div>

          <div>
            <div style={{ fontSize: 12 }}>Status</div>
            <ToggleSwitch
              checked={fssaiStatus === "ON"}
              onChange={(b) => setFssaiStatus(b ? "ON" : "OFF")}
            />
          </div>
        </div>
      </div>

      {/* =======================
          MODAL
      ======================== */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div style={{ background: "#fff", padding: 20, width: 420 }}>
            <h3>Add New FSSAI</h3>

            <div style={{ marginBottom: 10 }}>
              <label>FSSAI Number</label>
              <input
                className="w-full border p-2"
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Expiry</label>
              <input
                type="date"
                className="w-full border p-2"
                value={fssaiExpiry ?? ""}
                onChange={(e) => setFssaiExpiry(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Upload Copy</label>
              <input
                type="file"
                onChange={(e) => setFssaiFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setModalOpen(false)}>Cancel</button>
              <button
                onClick={saveFssai}
                disabled={saving}
                style={{ background: "#06b6d4", color: "#fff", padding: "6px 12px" }}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminForm>
  );
}
