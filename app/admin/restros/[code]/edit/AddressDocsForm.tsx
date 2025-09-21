"use client";

import React, { useState } from "react";

type Props = {
  restroCode: number;
  initialData: any;
};

export default function AddressDocsForm({ restroCode, initialData }: Props) {
  const [formData, setFormData] = useState(initialData || {});
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }

  function handleToggle(name: string) {
    setFormData((prev: any) => ({ ...prev, [name]: !prev[name] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/restros/${restroCode}/address-docs`, {
        method: "POST", // 👈 server route expects POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      alert("Address & Documents saved successfully!");
    } catch (err: any) {
      console.error("Save failed", err);
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Address</h2>

      {/* Address */}
      <div style={{ marginBottom: 12 }}>
        <label>Restro Address</label>
        <input
          name="RestroAddress"
          value={formData.RestroAddress || ""}
          onChange={handleChange}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label>City / Village</label>
          <input
            name="City"
            value={formData.City || ""}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>State</label>
          <input
            name="State"
            value={formData.State || ""}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>District</label>
          <input
            name="District"
            value={formData.District || ""}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label>Pin Code</label>
          <input
            name="PinCode"
            value={formData.PinCode || ""}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Latitude</label>
          <input
            name="Latitude"
            value={formData.Latitude || ""}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Longitude</label>
          <input
            name="Longitude"
            value={formData.Longitude || ""}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
      </div>

      <h2 style={{ margin: "20px 0 12px" }}>Documents</h2>

      {/* FSSAI */}
      <div style={{ marginBottom: 12, border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
        <h4>FSSAI</h4>
        <input
          name="FSSAINumber"
          placeholder="14-digit FSSAI Number"
          value={formData.FSSAINumber || ""}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <input
          type="date"
          name="FSSAIExpiry"
          value={formData.FSSAIExpiry || ""}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
        <div>
          <label>Status:</label>
          <button type="button" onClick={() => handleToggle("FSSAIStatus")}>
            {formData.FSSAIStatus ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* GST */}
      <div style={{ marginBottom: 12, border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
        <h4>GST</h4>
        <input
          name="GSTNumber"
          placeholder="15-digit GST Number"
          value={formData.GSTNumber || ""}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <select
          name="GSTType"
          value={formData.GSTType || ""}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        >
          <option value="">--Select GST Type--</option>
          <option value="Regular">Regular</option>
          <option value="Composition">Composition</option>
          <option value="NotApplicable">Not Applicable</option>
        </select>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
        <div>
          <label>Status:</label>
          <button type="button" onClick={() => handleToggle("GSTStatus")}>
            {formData.GSTStatus ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* PAN */}
      <div style={{ marginBottom: 12, border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
        <h4>PAN</h4>
        <input
          name="PANNumber"
          placeholder="10-digit PAN Number"
          value={formData.PANNumber || ""}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <select
          name="PANType"
          value={formData.PANType || ""}
          onChange={handleChange}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        >
          <option value="">--Select PAN Type--</option>
          <option value="Individual">Individual</option>
          <option value="Company">Company</option>
        </select>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
        <div>
          <label>Status:</label>
          <button type="button" onClick={() => handleToggle("PANStatus")}>
            {formData.PANStatus ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* Save */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 20px",
            borderRadius: 6,
            background: saving ? "#999" : "#0ea5e9",
            color: "#fff",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
