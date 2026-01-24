"use client";

import React from "react";
import UI from "@/components/AdminUI";
import AdminSection from "@/components/AdminSection";

const { AdminForm } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
};

export default function StationSettingsTab({
  local = {},
  updateField,
}: Props) {
  return (
    <AdminForm>
      <AdminSection title="Station Settings">
        <div className="grid grid-cols-3 gap-4 text-sm">
          {/* Station */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Station
            </label>
            <input
              value={local.Station || ""}
              disabled
              className="w-full p-2 border rounded bg-gray-100"
            />
          </div>

          {/* Weekly Off */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Weekly Off
            </label>
            <select
              value={local.WeeklyOff || "SUN"}
              onChange={(e) =>
                updateField("WeeklyOff", e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              <option value="SUN">Sunday</option>
              <option value="MON">Monday</option>
              <option value="TUE">Tuesday</option>
              <option value="WED">Wednesday</option>
              <option value="THU">Thursday</option>
              <option value="FRI">Friday</option>
              <option value="SAT">Saturday</option>
            </select>
          </div>

          {/* Open Time */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Open Time
            </label>
            <input
              type="time"
              value={local.OpenTime || ""}
              onChange={(e) =>
                updateField("OpenTime", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Close Time */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Closed Time
            </label>
            <input
              type="time"
              value={local.CloseTime || ""}
              onChange={(e) =>
                updateField("CloseTime", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Minimum Order Value */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Minimum Order Value
            </label>
            <input
              value={local.MinimumOrderValue || ""}
              onChange={(e) =>
                updateField("MinimumOrderValue", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Cut Off Time */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Cut Off Time (mins)
            </label>
            <input
              value={local.CutOffTime || ""}
              onChange={(e) =>
                updateField("CutOffTime", e.target.value)
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Customer Delivery Charge */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Customer Delivery Charge
            </label>
            <input
              value={local.CustomerDeliveryCharge || ""}
              onChange={(e) =>
                updateField(
                  "CustomerDeliveryCharge",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* GST Rate */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Delivery Charge GST %
            </label>
            <input
              value={local.CustomerDeliveryGST || ""}
              onChange={(e) =>
                updateField(
                  "CustomerDeliveryGST",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* GST Absolute */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Delivery Charge GST (absolute)
            </label>
            <input
              value={local.CustomerDeliveryGSTAbsolute || ""}
              onChange={(e) =>
                updateField(
                  "CustomerDeliveryGSTAbsolute",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Total incl GST */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Delivery Charge Total (Incl GST)
            </label>
            <input
              value={local.CustomerDeliveryTotal || ""}
              onChange={(e) =>
                updateField(
                  "CustomerDeliveryTotal",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Payment Option (Customer) */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Customer Payment Option
            </label>
            <select
              value={local.CustomerPaymentOption || "Both"}
              onChange={(e) =>
                updateField(
                  "CustomerPaymentOption",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            >
              <option value="Both">Both</option>
              <option value="COD">COD</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* IRCTC Payment Option */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              IRCTC Payment Option
            </label>
            <select
              value={local.IRCTCPaymentOption || "Both"}
              onChange={(e) =>
                updateField(
                  "IRCTCPaymentOption",
                  e.target.value
                )
              }
              className="w-full p-2 border rounded"
            >
              <option value="Both">Both</option>
              <option value="COD">COD</option>
              <option value="Online">Online</option>
            </select>
          </div>

          {/* Delivery Type */}
          <div>
            <label className="text-xs font-semibold text-gray-600">
              Delivery Type
            </label>
            <select
              value={local.DeliveryType || "Raileats"}
              onChange={(e) =>
                updateField("DeliveryType", e.target.value)
              }
              className="w-full p-2 border rounded"
            >
              <option value="Raileats">Raileats Delivery</option>
              <option value="Vendor">Vendor Delivery</option>
            </select>
          </div>
        </div>
      </AdminSection>
    </AdminForm>
  );
}
