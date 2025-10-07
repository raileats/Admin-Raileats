// components/restro-edit/StationSettingsTab.tsx
import React from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local?: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
};

export default function StationSettingsTab({ local = {}, updateField, stationDisplay = "" }: Props) {
  return (
    <TabContainer title="Station Settings" kicker="Station Settings">
      <div className="form-grid">
        <div className="field">
          <div className="label">Station</div>
          <div className="readonly">{stationDisplay}</div>
        </div>

        <div className="field">
          <div className="label">Raileats Customer Delivery Charge</div>
          <input className="input" type="number" value={local?.RaileatsDeliveryCharge ?? 0} onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <div className="label">Weekly Off</div>
          <select className="input" value={local?.WeeklyOff ?? "SUN"} onChange={(e) => updateField("WeeklyOff", e.target.value)}>
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
          <div className="label">Raileats Customer Delivery Charge GST Rate (%)</div>
          <input className="input" type="number" value={local?.RaileatsDeliveryChargeGSTRate ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <div className="label">Open Time</div>
          <input className="input" type="time" value={local?.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Closed Time</div>
          <input className="input" type="time" value={local?.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} />
        </div>

        <div className="field">
          <div className="label">Raileats Customer Delivery Charge GST (absolute)</div>
          <input className="input" type="number" value={local?.RaileatsDeliveryChargeGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <div className="label">Raileats Customer Delivery Charge Total Incl GST</div>
          <input className="input" type="number" value={local?.RaileatsDeliveryChargeTotalInclGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <div className="label">Minimum Order Value</div>
          <input className="input" type="number" value={local?.MinimumOrderValue ?? 0} onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <div className="label">Cut Off Time (mins)</div>
          <input className="input" type="number" value={local?.CutOffTime ?? 0} onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))} />
        </div>

        <div className="field">
          <div className="label">Raileats Orders Payment Option for Customer</div>
          <select className="input" value={local?.OrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("OrdersPaymentOptionForCustomer", e.target.value)}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div className="field">
          <div className="label">IRCTC Orders Payment Option for Customer</div>
          <select className="input" value={local?.IRCTCOrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("IRCTCOrdersPaymentOptionForCustomer", e.target.value)}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div className="field">
          <div className="label">Restro Type of Delivery (Vendor / Raileats)</div>
          <select className="input" value={local?.RestroTypeOfDelivery ?? "RAILEATS"} onChange={(e) => updateField("RestroTypeOfDelivery", e.target.value)}>
            <option value="RAILEATS">Raileats Delivery</option>
            <option value="VENDOR">Vendor Self</option>
          </select>
        </div>
      </div>

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 1100px) { .form-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } }

        .field { display:flex; flex-direction:column; }
        .label { font-size: 0.875rem; font-weight: 700; color: var(--muted, #6b7280); margin-bottom: 8px; }
        .input { padding:10px 12px; height:44px; border-radius:8px; border:1px solid var(--border, #e6e6e6); font-size:1rem; }
        .readonly { padding:10px 12px; border-radius:8px; background:var(--soft-bg,#fbfdff); border:1px solid #f3f3f3; }
      `}</style>
    </TabContainer>
  );
}
