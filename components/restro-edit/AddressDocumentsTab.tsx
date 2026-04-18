"use client";

import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";

import FssaiTab from "./FssaiTab";
import GstTab from "./GstTab";
import PanTab from "./PanTab";
import AdminSection from "@/components/AdminSection";

const { AdminForm, SubmitButton } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  restroCode: string | number;
};

export default function AddressDocumentsTab({
  local = {},
  updateField,
  restroCode,
}: Props) {
  const [addr, setAddr] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [pin, setPin] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= SYNC ================= */
  useEffect(() => {
    setAddr(local?.RestroAddress ?? "");
    setCity(local?.City ?? local?.["City/Village"] ?? "");
    setState(local?.State ?? "");
    setDistrict(local?.District ?? "");
    setPin(local?.PinCode ?? "");
    setLat(local?.RestroLatitude ?? "");
    setLng(local?.RestroLongitude ?? "");
  }, [local]);

  /* ================= SAVE ADDRESS ================= */
  async function saveAddress() {
    try {
      if (!restroCode) {
        alert("RestroCode missing");
        return;
      }

      setLoading(true);

      const payload = {
        RestroAddress: addr,
        City: city,
        State: state,
        District: district,
        PinCode: pin,
        RestroLatitude: lat,
        RestroLongitude: lng,
      };

      console.log("📦 Address Payload:", payload);

      const res = await fetch(`/api/admin/restros/${restroCode}`, {
        method: "PATCH", // ✅ FIXED (PUT → PATCH)
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      console.log("📥 API Response:", json);

      if (!res.ok) {
        throw new Error(json?.error || "Address save failed");
      }

      // UI sync
      Object.entries(payload).forEach(([k, v]) => updateField(k, v));

      alert("✅ Address saved successfully");
    } catch (e: any) {
      console.error("❌ Address Save Error:", e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminForm>
      {/* ================= ADDRESS ================= */}
      <AdminSection
        title="Address"
        action={
          <SubmitButton onClick={saveAddress} disabled={loading}>
            {loading ? "Saving..." : "Save Address"}
          </SubmitButton>
        }
      >
        <textarea
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Restaurant full address"
          className="w-full p-2 border rounded mb-3 text-sm"
          rows={2}
        />

        <div className="grid grid-cols-6 gap-2 text-xs font-semibold text-gray-600 mb-1">
          <div>City / Village</div>
          <div>State</div>
          <div>District</div>
          <div>Pin Code</div>
          <div>Latitude</div>
          <div>Longitude</div>
        </div>

        <div className="grid grid-cols-6 gap-2 text-sm">
          <input value={city} onChange={(e) => setCity(e.target.value)} className="p-2 border rounded" />
          <input value={state} onChange={(e) => setState(e.target.value)} className="p-2 border rounded" />
          <input value={district} onChange={(e) => setDistrict(e.target.value)} className="p-2 border rounded" />
          <input value={pin} onChange={(e) => setPin(e.target.value)} className="p-2 border rounded" />
          <input value={lat} onChange={(e) => setLat(e.target.value)} className="p-2 border rounded" />
          <input value={lng} onChange={(e) => setLng(e.target.value)} className="p-2 border rounded" />
        </div>
      </AdminSection>

      {/* ================= DOCUMENTS ================= */}
      <AdminSection title="FSSAI">
        <FssaiTab restroCode={restroCode} />
      </AdminSection>

      <AdminSection title="GST">
        <GstTab restroCode={restroCode} />
      </AdminSection>

      <AdminSection title="PAN Card">
        <PanTab restroCode={restroCode} />
      </AdminSection>
    </AdminForm>
  );
}
