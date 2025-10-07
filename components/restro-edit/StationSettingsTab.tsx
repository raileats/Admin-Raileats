// components/restro-edit/StationSettingsTab.tsx
"use client";

import React from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function StationSettingsTab({ local = {}, updateField, stationDisplay, stations = [], loadingStations }: Props) {
  return (
    <TabContainer title="Station Settings">
      <div className="restro-grid">
        <div>
          <label className="restro-label">Station</label>
          <div className="readonly" style={{ padding: 10 }}>{stationDisplay || "—"}</div>
        </div>

        <div>
          <label className="restro-label">Raileats Customer Delivery Charge</label>
          <input className="restro-input" type="number" value={local?.RaileatsDeliveryCharge ?? 0} onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value || 0))} />
        </div>

        <div>
          <label className="restro-label">Weekly Off</label>
          <select className="restro-input" value={local?.WeeklyOff ?? "SUN"} onChange={(e) => updateField("WeeklyOff", e.target.value)}>
            <option value="SUN">SUN</option>
            <option value="MON">MON</option>
            <option value="TUE">TUE</option>
            <option value="WED">WED</option>
            <option value="THU">THU</option>
            <option value="FRI">FRI</option>
            <option value="SAT">SAT</option>
          </select>
        </div>

        <div>
          <label className="restro-label">Raileats Customer Delivery Charge GST Rate (%)</label>
          <input className="restro-input" type="number" value={local?.RaileatsDeliveryChargeGSTRate ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value || 0))} />
        </div>

        <div>
          <label className="restro-label">Open Time</label>
          <input className="restro-input" type="time" value={local?.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Closed Time</label>
          <input className="restro-input" type="time" value={local?.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} />
        </div>

        <div>
          <label className="restro-label">Raileats Customer Delivery Charge GST (absolute)</label>
          <input className="restro-input" type="number" value={local?.RaileatsDeliveryChargeGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value || 0))} />
        </div>

        <div>
          <label className="restro-label">Raileats Customer Delivery Charge Total Incl GST</label>
          <input className="restro-input" type="number" value={local?.RaileatsDeliveryChargeTotalInclGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value || 0))} />
        </div>

        <div>
          <label className="restro-label">Minimum Order Value</label>
          <input className="restro-input" type="number" value={local?.MinimumOrderValue ?? 0} onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))} />
        </div>

        <div>
          <label className="restro-label">Cut Off Time (mins)</label>
          <input className="restro-input" type="number" value={local?.CutOffTime ?? 0} onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))} />
        </div>

        <div>
          <label className="restro-label">Raileats Orders Payment Option for Customer</label>
          <select className="restro-input" value={local?.OrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("OrdersPaymentOptionForCustomer", e.target.value)}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div>
          <label className="restro-label">IRCTC Orders Payment Option for Customer</label>
          <select className="restro-input" value={local?.IRCTCOrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("IRCTCOrdersPaymentOptionForCustomer", e.target.value)}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div>
          <label className="restro-label">Restro Type of Delivery</label>
          <select className="restro-input" value={local?.RestroTypeOfDelivery ?? "RAILEATS"} onChange={(e) => updateField("RestroTypeOfDelivery", e.target.value)}>
            <option value="RAILEATS">Raileats Delivery</option>
            <option value="VENDOR">Vendor Self</option>
          </select>
        </div>

        <div className="restro-row-full">
          <div className="restro-note">Note: Times use browser time input. Check values before saving.</div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width:1100px) { .restro-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width:720px) { .restro-grid { grid-template-columns: 1fr; } }
      `}</style>
    </TabContainer>
  );
}
