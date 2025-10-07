// components/restro-edit/StationSettingsTab.tsx
import React from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function StationSettingsTab({ local, updateField, stationDisplay }: Props) {
  return (
    <TabContainer header="Station Settings">
      <div className="compact-grid" style={{ maxWidth: 1200, margin: "8px auto" }}>
        <div className="field">
          <label>Station</label>
          <div className="readonly">{stationDisplay}</div>
        </div>

        <div className="field">
          <label>Raileats Customer Delivery Charge</label>
          <input type="number" value={local?.RaileatsDeliveryCharge ?? 0} onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <label>Weekly Off</label>
          <select value={local?.WeeklyOff ?? "SUN"} onChange={(e) => updateField("WeeklyOff", e.target.value)}>
            <option value="SUN">SUN</option>
            <option value="MON">MON</option>
            <option value="TUE">TUE</option>
            <option value="WED">WED</option>
            <option value="THU">THU</option>
            <option value="FRI">FRI</option>
            <option value="SAT">SAT</option>
          </select>
        </div>

        <div className="field">
          <label>Raileats Customer Delivery Charge GST Rate (%)</label>
          <input type="number" value={local?.RaileatsDeliveryChargeGSTRate ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <label>Open Time</label>
          <input type="time" value={local?.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} />
        </div>

        <div className="field">
          <label>Closed Time</label>
          <input type="time" value={local?.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} />
        </div>

        <div className="field">
          <label>Raileats Customer Delivery Charge GST (absolute)</label>
          <input type="number" value={local?.RaileatsDeliveryChargeGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <label>Raileats Customer Delivery Charge Total Incl GST</label>
          <input type="number" value={local?.RaileatsDeliveryChargeTotalInclGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <label>Minimum Order Value</label>
          <input type="number" value={local?.MinimumOrderValue ?? 0} onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <label>Cut Off Time (mins)</label>
          <input type="number" value={local?.CutOffTime ?? 0} onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <label>Raileats Orders Payment Option for Customer</label>
          <select value={local?.OrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("OrdersPaymentOptionForCustomer", e.target.value)}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div className="field">
          <label>IRCTC Orders Payment Option for Customer</label>
          <select value={local?.IRCTCOrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("IRCTCOrdersPaymentOptionForCustomer", e.target.value)}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div className="field">
          <label>Restro Type of Delivery (Vendor / Raileats)</label>
          <select value={local?.RestroTypeOfDelivery ?? "RAILEATS"} onChange={(e) => updateField("RestroTypeOfDelivery", e.target.value)}>
            <option value="RAILEATS">Raileats Delivery</option>
            <option value="VENDOR">Vendor Self</option>
          </select>
        </div>
      </div>

      <style jsx>{`
        .compact-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px 18px; max-width: 1200px; margin: 8px auto; }
        .field label { display:block; font-weight:600; margin-bottom:6px; color:#444; }
        .field input, .field select { width:100%; padding:8px; border-radius:6px; border:1px solid #e3e3e3; }
        .readonly { padding:8px 10px; background:#fafafa; border-radius:6px; border:1px solid #f0f0f0; }
        @media (max-width:1100px) { .compact-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width:720px) { .compact-grid { grid-template-columns: 1fr; } }
      `}</style>
    </TabContainer>
  );
}
