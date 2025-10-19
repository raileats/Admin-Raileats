// components/restro-edit/StationSettingsTab.tsx
import React from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField, Select, Toggle } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
};

export default function StationSettingsTab({
  local,
  updateField,
  stationDisplay,
  stations = [],
  loadingStations,
}: Props) {
  return (
    <div style={{ maxWidth: 1200, margin: "8px auto", padding: 8 }}>
      <h3 style={{ textAlign: "center", marginTop: 0, fontSize: 18, fontWeight: 700 }}>
        Station Settings
      </h3>

      <div style={{ marginTop: 12 }}>
        <FormRow cols={3} gap={16}>
          <FormField label="Station">
            <div style={{ padding: 8, borderRadius: 6, background: "#fafafa", border: "1px solid #f0f0f0" }}>
              {stationDisplay || "—"}
            </div>
          </FormField>

          <FormField label="Raileats Customer Delivery Charge">
            <input
              type="number"
              value={local?.RaileatsDeliveryCharge ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryCharge", Number(e.target.value || 0))}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Weekly Off">
            <Select
              name="weekly_off"
              value={local?.WeeklyOff ?? "SUN"}
              onChange={(v: string) => updateField("WeeklyOff", v)}
              options={[
                { label: "SUN", value: "SUN" },
                { label: "MON", value: "MON" },
                { label: "TUE", value: "TUE" },
                { label: "WED", value: "WED" },
                { label: "THU", value: "THU" },
                { label: "FRI", value: "FRI" },
                { label: "SAT", value: "SAT" },
              ]}
            />
          </FormField>

          <FormField label="Raileats Customer Delivery Charge GST Rate (%)">
            <input
              type="number"
              value={local?.RaileatsDeliveryChargeGSTRate ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryChargeGSTRate", Number(e.target.value || 0))}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Open Time">
            <input
              type="time"
              value={local?.OpenTime ?? ""}
              onChange={(e) => updateField("OpenTime", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Closed Time">
            <input
              type="time"
              value={local?.ClosedTime ?? ""}
              onChange={(e) => updateField("ClosedTime", e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Raileats Customer Delivery Charge GST (absolute)">
            <input
              type="number"
              value={local?.RaileatsDeliveryChargeGST ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryChargeGST", Number(e.target.value || 0))}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Raileats Customer Delivery Charge Total Incl GST">
            <input
              type="number"
              value={local?.RaileatsDeliveryChargeTotalInclGST ?? 0}
              onChange={(e) => updateField("RaileatsDeliveryChargeTotalInclGST", Number(e.target.value || 0))}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Minimum Order Value">
            <input
              type="number"
              value={local?.MinimumOrderValue ?? 0}
              onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Cut Off Time (mins)">
            <input
              type="number"
              value={local?.CutOffTime ?? 0}
              onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e3e3e3", fontSize: 14 }}
            />
          </FormField>

          <FormField label="Raileats Orders Payment Option for Customer">
            <Select
              name="orders_payment_option"
              value={local?.OrdersPaymentOptionForCustomer ?? "BOTH"}
              onChange={(v: string) => updateField("OrdersPaymentOptionForCustomer", v)}
              options={[
                { label: "Both", value: "BOTH" },
                { label: "Prepaid Only", value: "PREPAID" },
                { label: "COD Only", value: "COD" },
              ]}
            />
          </FormField>

          <FormField label="IRCTC Orders Payment Option for Customer">
            <Select
              name="irctc_orders_payment_option"
              value={local?.IRCTCOrdersPaymentOptionForCustomer ?? "BOTH"}
              onChange={(v: string) => updateField("IRCTCOrdersPaymentOptionForCustomer", v)}
              options={[
                { label: "Both", value: "BOTH" },
                { label: "Prepaid Only", value: "PREPAID" },
                { label: "COD Only", value: "COD" },
              ]}
            />
          </FormField>

          <FormField label="Restro Type of Delivery (Vendor / Raileats)">
            <Select
              name="restro_type_of_delivery"
              value={local?.RestroTypeOfDelivery ?? "RAILEATS"}
              onChange={(v: string) => updateField("RestroTypeOfDelivery", v)}
              options={[
                { label: "Raileats Delivery", value: "RAILEATS" },
                { label: "Vendor Self", value: "VENDOR" },
              ]}
            />
          </FormField>
        </FormRow>
      </div>
    </div>
  );
}
