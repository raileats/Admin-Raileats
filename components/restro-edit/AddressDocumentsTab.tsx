"use client";

import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";
import FssaiTab from "./FssaiTab";

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
  /* ================= ADDRESS STATE ================= */
  const [restroAddress, setRestroAddress] = useState(local?.RestroAddress ?? "");
  const [stateVal, setStateVal] = useState(local?.State ?? "");
  const [city, setCity] = useState(local?.["City/Village"] ?? local?.City ?? "");
  const [district, setDistrict] = useState(local?.District ?? "");
  const [pin, setPin] = useState(local?.PinCode ?? "");
  const [lat, setLat] = useState(local?.RestroLatitude ?? "");
  const [lng, setLng] = useState(
    local?.RestroLongituden ?? local?.RestroLongitude ?? ""
  );

  /* ================= SYNC FROM PARENT ================= */
  useEffect(() => {
    setRestroAddress(local?.RestroAddress ?? "");
    setStateVal(local?.State ?? "");
    setCity(local?.["City/Village"] ?? local?.City ?? "");
    setDistrict(local?.District ?? "");
    setPin(local?.PinCode ?? "");
    setLat(local?.RestroLatitude ?? "");
    setLng(local?.RestroLongituden ?? local?.RestroLongitude ?? "");
  }, [local]);

  /* ================= SAVE ADDRESS ================= */
  const saveAddress = () => {
    updateField("RestroAddress", restroAddress);
    updateField("State", stateVal);
    updateField("City/Village", city);
    updateField("District", district);
    updateField("PinCode", pin);
    updateField("RestroLatitude", lat);
    updateField("RestroLongituden", lng);

    alert("Address saved (Documents are handled separately)");
  };

  return (
    <AdminForm>
      <h3 style={{ textAlign: "center", marginTop: 0 }}>
        Address & Documents
      </h3>

      <div style={{ maxWidth: 1200, margin: "12px auto" }}>
        {/* ================= ADDRESS ================= */}
        <div
          style={{
            background: "#eef8ff",
            padding: 16,
            borderRadius: 10,
            border: "1px solid #d6eaf8",
            marginBottom: 20,
          }}
        >
          <h4 style={{ textAlign: "center", marginBottom: 12 }}>
            Address
          </h4>

          <FormRow cols={3} gap={12}>
            <FormField label="Restro Address" className="col-span-3">
              <textarea
                value={restroAddress}
                onChange={(e) => setRestroAddress(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 80,
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #e6eef6",
                }}
              />
            </FormField>

            <FormField label="City / Village">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </FormField>

            <FormField label="State">
              <input
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </FormField>

            <FormField label="District">
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </FormField>

            <FormField label="Pin Code">
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </FormField>

            <FormField label="Latitude">
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </FormField>

            <FormField label="Longitude">
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full p-2 rounded border"
              />
            </FormField>
          </FormRow>

          <div style={{ textAlign: "center", marginTop: 12 }}>
            <SubmitButton onClick={saveAddress}>
              Save Address
            </SubmitButton>
          </div>
        </div>

        {/* ================= DOCUMENTS ================= */}
        <div
          style={{
            background: "#fff",
            padding: 16,
            borderRadius: 10,
            border: "1px solid #eee",
          }}
        >
          <h4 style={{ textAlign: "center", marginBottom: 16 }}>
            Documents
          </h4>

          {/* 🔥 BANK-LIKE FSSAI TAB */}
          <FssaiTab restroCode={restroCode} />

          {/* GST & PAN next */}
        </div>
      </div>
    </AdminForm>
  );
}
