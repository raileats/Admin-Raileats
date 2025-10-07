// components/restro-edit/StationSettingsTab.tsx
"use client";
import React from "react";
import TabContainer from "@/components/TabContainer";

type CommonProps = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  InputWithIcon?: any;
};

export default function StationSettingsTab({ local = {}, updateField, stationDisplay = "" }: CommonProps) {
  return (
    <TabContainer title="Station Settings">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Station</label>
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#fcfdfe", border: "1px solid #f1f5f9" }}>{stationDisplay}</div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Raileats Customer Delivery Charge</label>
          <input
            type="number"
            value={local?.RaileatsDeliveryCharge ?? 0}
            onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value || 0))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Weekly Off</label>
          <select
            value={local?.WeeklyOff ?? "SUN"}
            onChange={(e) => updateField("WeeklyOff", e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}
          >
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
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Raileats Customer Delivery Charge GST Rate (%)</label>
          <input
            type="number"
            value={local?.RaileatsDeliveryChargeGSTRate ?? 0}
            onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value || 0))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Open Time</label>
          <input type="time" value={local?.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Closed Time</label>
          <input type="time" value={local?.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Raileats Customer Delivery Charge GST (absolute)</label>
          <input type="number" value={local?.RaileatsDeliveryChargeGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value || 0))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Raileats Customer Delivery Charge Total Incl GST</label>
          <input type="number" value={local?.RaileatsDeliveryChargeTotalInclGST ?? 0} onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value || 0))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Minimum Order Value</label>
          <input type="number" value={local?.MinimumOrderValue ?? 0} onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Cut Off Time (mins)</label>
          <input type="number" value={local?.CutOffTime ?? 0} onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Raileats Orders Payment Option for Customer</label>
          <select value={local?.OrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("OrdersPaymentOptionForCustomer", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>IRCTC Orders Payment Option for Customer</label>
          <select value={local?.IRCTCOrdersPaymentOptionForCustomer ?? "BOTH"} onChange={(e) => updateField("IRCTCOrdersPaymentOptionForCustomer", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}>
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid Only</option>
            <option value="COD">COD Only</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, color: "#475569", fontWeight: 700 }}>Restro Type of Delivery (Vendor / Raileats)</label>
          <select value={local?.RestroTypeOfDelivery ?? "RAILEATS"} onChange={(e) => updateField("RestroTypeOfDelivery", e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e6eef6" }}>
            <option value="RAILEATS">Raileats Delivery</option>
            <option value="VENDOR">Vendor Self</option>
          </select>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1100px) {
          div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 720px) {
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </TabContainer>
  );
}
