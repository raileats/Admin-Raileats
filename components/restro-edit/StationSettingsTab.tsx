"use client";
import React from "react";
import UI from "@/components/AdminUI";

const { FormRow, FormField } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay: string;
};

export default function StationSettingsTab({
  local,
  updateField,
  stationDisplay,
}: Props) {
  return (
    <div className="px-4 py-2">
      <h3 className="text-center text-lg font-bold mb-4">
        Station Settings
      </h3>

      <div className="max-w-6xl mx-auto bg-white rounded shadow-sm p-6">
        <FormRow cols={3} gap={6}>
          {/* Station (read-only) */}
          <FormField label="Station">
            <div className="rounded border bg-slate-50 p-2 text-sm">
              {stationDisplay}
            </div>
          </FormField>

          {/* Delivery Charge */}
          <FormField label="Raileats Customer Delivery Charge">
            <input
              type="number"
              value={local?.RaileatsCustomerDeliveryCharge ?? 0}
              onChange={(e) =>
                updateField(
                  "RaileatsCustomerDeliveryCharge",
                  Number(e.target.value || 0)
                )
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* Weekly Off */}
          <FormField label="Weekly Off">
            <select
              value={local?.WeeklyOff ?? "SUN"}
              onChange={(e) =>
                updateField("WeeklyOff", e.target.value)
              }
              className="w-full p-2 rounded border"
            >
              {["SUN","MON","TUE","WED","THU","FRI","SAT"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </FormField>

          {/* GST Rate */}
          <FormField label="Delivery Charge GST Rate (%)">
            <input
              type="number"
              value={local?.RaileatsCustomerDeliveryChargeGSTRate ?? ""}
              onChange={(e) =>
                updateField(
                  "RaileatsCustomerDeliveryChargeGSTRate",
                  e.target.value
                )
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* OPEN TIME — ⚠ ZERO */}
          <FormField label="Open Time">
            <input
              type="time"
              value={local?.["0penTime"] ?? ""}
              onChange={(e) =>
                updateField("0penTime", e.target.value)
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* CLOSED TIME */}
          <FormField label="Closed Time">
            <input
              type="time"
              value={local?.ClosedTime ?? ""}
              onChange={(e) =>
                updateField("ClosedTime", e.target.value)
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* GST Absolute */}
          <FormField label="Delivery Charge GST (absolute)">
            <input
              type="number"
              value={local?.RaileatsCustomerDeliveryChargeGST ?? ""}
              onChange={(e) =>
                updateField(
                  "RaileatsCustomerDeliveryChargeGST",
                  e.target.value
                )
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* GST Total */}
          <FormField label="Delivery Charge Total Incl GST">
            <input
              type="number"
              value={local?.RaileatsCustomerDeliveryChargeTotalInclGST ?? ""}
              onChange={(e) =>
                updateField(
                  "RaileatsCustomerDeliveryChargeTotalInclGST",
                  e.target.value
                )
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* ⚠ MINIMUM ORDER m */}
          <FormField label="Minimum Order Value">
            <input
              type="number"
              value={local?.MinimumOrdermValue ?? ""}
              onChange={(e) =>
                updateField(
                  "MinimumOrdermValue",
                  Number(e.target.value || 0)
                )
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* Cut Off */}
          <FormField label="Cut Off Time (mins)">
            <input
              type="number"
              value={local?.CutOffTime ?? ""}
              onChange={(e) =>
                updateField(
                  "CutOffTime",
                  Number(e.target.value || 0)
                )
              }
              className="w-full p-2 rounded border"
            />
          </FormField>

          {/* Payment Options */}
          <FormField label="Raileats Orders Payment Option">
            <select
              value={local?.RaileatsOrdersPaymentOptionforCustomer ?? "BOTH"}
              onChange={(e) =>
                updateField(
                  "RaileatsOrdersPaymentOptionforCustomer",
                  e.target.value
                )
              }
              className="w-full p-2 rounded border"
            >
              <option value="BOTH">Both</option>
              <option value="PREPAID">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </FormField>

          <FormField label="IRCTC Orders Payment Option">
            <select
              value={local?.IRCTCOrdersPaymentOptionforCustomer ?? "BOTH"}
              onChange={(e) =>
                updateField(
                  "IRCTCOrdersPaymentOptionforCustomer",
                  e.target.value
                )
              }
              className="w-full p-2 rounded border"
            >
              <option value="BOTH">Both</option>
              <option value="PREPAID">Prepaid</option>
              <option value="COD">COD</option>
            </select>
          </FormField>

          {/* Delivery Type */}
          <FormField label="Restro Type of Delivery">
            <select
              value={local?.RestroTypeofDeliveryRailEatsorVendor ?? "RAILEATS"}
              onChange={(e) =>
                updateField(
                  "RestroTypeofDeliveryRailEatsorVendor",
                  e.target.value
                )
              }
              className="w-full p-2 rounded border"
            >
              <option value="RAILEATS">Raileats</option>
              <option value="VENDOR">Vendor</option>
            </select>
          </FormField>
        </FormRow>
      </div>
    </div>
  );
}
