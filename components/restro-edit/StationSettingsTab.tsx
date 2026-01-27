// components/restro-edit/StationSettingsTab.tsx
"use client";
import React from "react";
import UI from "@/components/AdminUI";
const { FormRow, FormField, Toggle } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function StationSettingsTab({ local, updateField, stationDisplay, stations = [], loadingStations }: Props) {
  return (
    <div className="px-4 py-2">
      <h3 className="text-center text-lg font-bold mb-4">Station Settings</h3>

      <div className="max-w-6xl mx-auto bg-white rounded shadow-sm p-6">
        <FormRow cols={3} gap={6}>
          <FormField label="Station">
            <div className="rounded border border-slate-100 bg-slate-50 p-2 text-sm">{stationDisplay}</div>
          </FormField>

          <FormField label="Raileats Customer Delivery Charge">
            <input
              type="number"
              value={local?.RaileatsDeliveryCharge ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value || 0))}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Weekly Off">
            <select value={local?.WeeklyOff ?? "SUN"} onChange={(e) => updateField("WeeklyOff", e.target.value)} className="w-full p-2 rounded border">
              <option value="SUN">SUN</option>
              <option value="MON">MON</option>
              <option value="TUE">TUE</option>
              <option value="WED">WED</option>
              <option value="THU">THU</option>
              <option value="FRI">FRI</option>
              <option value="SAT">SAT</option>
            </select>
          </FormField>

          <FormField label="Raileats Customer Delivery Charge GST Rate (%)">
            <input
              type="number"
              value={local?.RaileatsDeliveryChargeGSTRate ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value || 0))}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Open Time">
            <input type="time" value={local?.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Closed Time">
            <input type="time" value={local?.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Raileats Customer Delivery Charge GST (absolute)">
            <input
              type="number"
              value={local?.RaileatsDeliveryChargeGST ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value || 0))}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Raileats Customer Delivery Charge Total Incl GST">
            <input
              type="number"
              value={local?.RaileatsDeliveryChargeTotalInclGST ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value || 0))}
              className="w-full p-2 rounded border"
            />
          </FormField>

          <FormField label="Minimum Order Value">
            <input type="number" value={local?.MinimumOrderValue ?? 0} onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Cut Off Time (mins)">
            <input type="number" value={local?.CutOffTime ?? 0} onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))} className="w-full p-2 rounded border" />
          </FormField>

          <FormField label="Raileats Orders Payment Option for Customer">
            <select value={local?.OrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("OrdersPaymentOptionForCustomer", e.target.value)} className="w-full p-2 rounded border">
              <option value="BOTH">Both</option>
              <option value="PREPAID">Prepaid Only</option>
              <option value="COD">COD Only</option>
            </select>
          </FormField>

          <FormField label="IRCTC Orders Payment Option for Customer">
            <select value={local?.IRCTCOrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("IRCTCOrdersPaymentOptionForCustomer", e.target.value)} className="w-full p-2 rounded border">
              <option value="BOTH">Both</option>
              <option value="PREPAID">Prepaid Only</option>
              <option value="COD">COD Only</option>
            </select>
          </FormField>

          <FormField label="Restro Type of Delivery (Vendor / Raileats)">
            <select value={local?.RestroTypeOfDelivery ?? "RAILEATS"} onChange={(e) => updateField("RestroTypeOfDelivery", e.target.value)} className="w-full p-2 rounded border">
              <option value="RAILEATS">Raileats Delivery</option>
              <option value="VENDOR">Vendor Self</option>
            </select>
          </FormField>
        </FormRow>
      </div>
    </div>
  );
}
