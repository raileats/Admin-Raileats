// components/restro-edit/StationSettingsTab.tsx
import React from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
};

export default function StationSettingsTab({ local = {}, updateField, stationDisplay = "" }: Props) {
  return (
    <TabContainer title="Station Settings">
      <div className="form-grid" style={{ maxWidth: 1200, margin: "0 auto" }}>
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

        {/* rest of fields similarly... keep as before */}
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

        {/* ...other fields kept same structure */}
      </div>
    </TabContainer>
  );
}
