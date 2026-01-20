"use client";

import React, { useEffect, useState } from "react";
import UI from "@/components/AdminUI";
import FssaiTab from "./FssaiTab";
import GstTab from "./GstTab";

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
  const [addr, setAddr] = useState(local?.RestroAddress ?? "");
  const [city, setCity] = useState(local?.City ?? "");
  const [state, setState] = useState(local?.State ?? "");
  const [district, setDistrict] = useState(local?.District ?? "");
  const [pin, setPin] = useState(local?.PinCode ?? "");
  const [lat, setLat] = useState(local?.RestroLatitude ?? "");
  const [lng, setLng] = useState(local?.RestroLongitude ?? "");

  useEffect(() => {
    setAddr(local?.RestroAddress ?? "");
    setCity(local?.City ?? "");
    setState(local?.State ?? "");
    setDistrict(local?.District ?? "");
    setPin(local?.PinCode ?? "");
    setLat(local?.RestroLatitude ?? "");
    setLng(local?.RestroLongitude ?? "");
  }, [local]);

  function saveAddress() {
    updateField("RestroAddress", addr);
    updateField("City", city);
    updateField("State", state);
    updateField("District", district);
    updateField("PinCode", pin);
    updateField("RestroLatitude", lat);
    updateField("RestroLongitude", lng);
    alert("Address saved");
  }

  return (
    <AdminForm>
      {/* ================= ADDRESS (COMPACT) ================= */}
      <div className="border rounded-md p-3 bg-sky-50 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-sm">Address</h4>
          <SubmitButton onClick={saveAddress}>Save Address</SubmitButton>
        </div>

        <textarea
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Restaurant Address"
          className="w-full p-2 border rounded mb-2 text-sm"
          rows={2}   // 🔥 height reduced
        />

        <div className="grid grid-cols-6 gap-2 text-sm">
          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="p-2 border rounded col-span-1"
          />
          <input
            placeholder="State"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="p-2 border rounded col-span-1"
          />
          <input
            placeholder="District"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="p-2 border rounded col-span-1"
          />
          <input
            placeholder="Pin"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="p-2 border rounded col-span-1"
          />
          <input
            placeholder="Lat"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="p-2 border rounded col-span-1"
          />
          <input
            placeholder="Lng"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="p-2 border rounded col-span-1"
          />
        </div>
      </div>

      {/* ================= FSSAI ================= */}
      <FssaiTab restroCode={restroCode} />

      {/* ================= GST ================= */}
      <div className="mt-6">
        <GstTab restroCode={restroCode} />
      </div>
    </AdminForm>
  );
}
