"use client";

import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";
import FssaiTab from "./FssaiTab";
import GstTab from "./GstTab";

const { AdminForm, FormRow, FormField, SubmitButton } = UI;

type Props = {
  local: any;
  updateField: (key: string, v: any) => void;
  restroCode: string | number;
};

export default function AddressDocumentsTab({
  local = {},
  updateField,
  restroCode,
}: Props) {
  /* ================= ADDRESS ================= */
  const [restroAddress, setRestroAddress] = useState(local?.RestroAddress ?? "");
  const [stateVal, setStateVal] = useState(local?.State ?? "");
  const [city, setCity] = useState(local?.["City/Village"] ?? "");
  const [district, setDistrict] = useState(local?.District ?? "");
  const [pin, setPin] = useState(local?.PinCode ?? "");
  const [lat, setLat] = useState(local?.RestroLatitude ?? "");
  const [lng, setLng] = useState(local?.RestroLongituden ?? "");

  useEffect(() => {
    setRestroAddress(local?.RestroAddress ?? "");
    setStateVal(local?.State ?? "");
    setCity(local?.["City/Village"] ?? "");
    setDistrict(local?.District ?? "");
    setPin(local?.PinCode ?? "");
    setLat(local?.RestroLatitude ?? "");
    setLng(local?.RestroLongituden ?? "");
  }, [local]);

  const saveAddress = () => {
    updateField("RestroAddress", restroAddress);
    updateField("State", stateVal);
    updateField("City/Village", city);
    updateField("District", district);
    updateField("PinCode", pin);
    updateField("RestroLatitude", lat);
    updateField("RestroLongituden", lng);
    alert("Address saved");
  };

  return (
    <AdminForm>
      <h3 style={{ textAlign: "center" }}>Address & Documents</h3>

      {/* ================= ADDRESS ================= */}
      <div style={{ background: "#eef8ff", padding: 16, borderRadius: 10 }}>
        <h4 style={{ textAlign: "center" }}>Address</h4>

        <FormRow cols={3} gap={12}>
          <FormField label="Restro Address" className="col-span-3">
            <textarea
              value={restroAddress}
              onChange={(e) => setRestroAddress(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </FormField>

          <FormField label="City / Village">
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </FormField>

          <FormField label="State">
            <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
          </FormField>

          <FormField label="District">
            <input value={district} onChange={(e) => setDistrict(e.target.value)} />
          </FormField>

          <FormField label="Pin Code">
            <input value={pin} onChange={(e) => setPin(e.target.value)} />
          </FormField>

          <FormField label="Latitude">
            <input value={lat} onChange={(e) => setLat(e.target.value)} />
          </FormField>

          <FormField label="Longitude">
            <input value={lng} onChange={(e) => setLng(e.target.value)} />
          </FormField>
        </FormRow>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <SubmitButton onClick={saveAddress}>Save Address</SubmitButton>
        </div>
      </div>

      {/* ================= DOCUMENTS ================= */}
      <div style={{ marginTop: 30 }}>
        {/* 🔥 BANK-LIKE FSSAI */}
        <FssaiTab restroCode={restroCode} />

        <hr style={{ margin: "30px 0" }} />

        {/* 🔥 BANK-LIKE GST */}
        <GstTab restroCode={restroCode} />
      </div>
    </AdminForm>
  );
}
