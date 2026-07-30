// components/restro-route-tabs/StationSettingsClient.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import {
  AdminField,
  AdminInput,
  AdminSelect,
} from "@/components/admin/AdminField";

type Restro = Record<string, any>;

type Props = {
  initialData?: Restro;
  restroCode?: string | number;
  mode?: "edit" | "new";
  nextHref?: string;
};

const paymentOptions = [
  "Both",
  "Online",
  "COD",
  "Postpaid",
  "None",
];

const weekDays = [
  { value: "noOff", label: "No weekly off" },
  { value: "SUN", label: "SUN" },
  { value: "MON", label: "MON" },
  { value: "TUE", label: "TUE" },
  { value: "WED", label: "WED" },
  { value: "THU", label: "THU" },
  { value: "FRI", label: "FRI" },
  { value: "SAT", label: "SAT" },
];

const deliveryTypes = [
  "Raileats",
  "Vendor",
  "Both",
];

function normalizeTime(value: any, fallback: string) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  const time = String(value).trim();

  const match = time.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return time;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalize(row: Restro) {
  /*
   * Supabase mein Station Settings ki latest values
   * open_time aur closed_time mein save hoti hain.
   *
   * Isliye snake_case fields ko pehle priority di gayi hai.
   * OpenTime/ClosedTime sirf fallback ke liye hain.
   */
  const openTime =
    row?.open_time !== undefined &&
    row?.open_time !== null &&
    String(row.open_time).trim() !== ""
      ? row.open_time
      : row?.OpenTime;

  const closedTime =
    row?.closed_time !== undefined &&
    row?.closed_time !== null &&
    String(row.closed_time).trim() !== ""
      ? row.closed_time
      : row?.ClosedTime;

  return {
    ...row,
    OpenTime: normalizeTime(openTime, "10:00"),
    ClosedTime: normalizeTime(closedTime, "22:00"),
  };
}

function stationDisplay(restro: Restro) {
  const name = restro?.StationName ?? "";
  const code = restro?.StationCode ?? "";
  const state = restro?.State ?? "";

  if (!name && !code && !state) {
    return "-";
  }

  return `${name}${code ? ` (${code})` : ""}${
    state ? ` - ${state}` : ""
  }`;
}

function valueOrNull(value: any) {
  if (value === undefined || value === null) {
    return null;
  }

  const cleaned = String(value).trim();

  return cleaned === "" ? null : cleaned;
}

export default function StationSettingsClient({
  initialData = {},
  restroCode,
  mode = "edit",
  nextHref,
}: Props) {
  const router = useRouter();

  const createInitialState = () =>
    normalize({
      ...initialData,
      RestroCode:
        restroCode ??
        initialData?.RestroCode,
    });

  const [local, setLocal] =
    useState<Restro>(createInitialState);

  const [saving, setSaving] =
    useState(false);

  const [msg, setMsg] =
    useState<string | null>(null);

  /*
   * Router refresh ya server se fresh initialData aane par
   * form ko latest Supabase values se update karta hai.
   */
  useEffect(() => {
    setLocal(
      normalize({
        ...initialData,
        RestroCode:
          restroCode ??
          initialData?.RestroCode,
      })
    );
  }, [initialData, restroCode]);

  const code = useMemo(
    () =>
      String(
        restroCode ??
          local?.RestroCode ??
          ""
      ),
    [restroCode, local?.RestroCode]
  );

  function updateField(
    key: string,
    value: any
  ) {
    setLocal((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  const stationLocked =
    mode === "new" &&
    Boolean(local.StationCode);

  async function save() {
    if (!code) {
      setMsg(
        "Missing RestroCode. Please save Basic Information first."
      );
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        StationCode: valueOrNull(
          local.StationCode
        ),
        StationName: valueOrNull(
          local.StationName
        ),
        State: valueOrNull(local.State),
        WeeklyOff: valueOrNull(
          local.WeeklyOff
        ),

        open_time: valueOrNull(
          local.OpenTime
        ),
        closed_time: valueOrNull(
          local.ClosedTime
        ),

        MinimumOrderValue: valueOrNull(
          local.MinimumOrderValue
        ),
        CutOffTime: valueOrNull(
          local.CutOffTime
        ),

        RaileatsCustomerDeliveryCharge:
          valueOrNull(
            local.RaileatsCustomerDeliveryCharge
          ),

        RaileatsCustomerDeliveryChargeGSTRate:
          valueOrNull(
            local.RaileatsCustomerDeliveryChargeGSTRate
          ),

        RaileatsCustomerDeliveryChargeGST:
          valueOrNull(
            local.RaileatsCustomerDeliveryChargeGST
          ),

        RaileatsCustomerDeliveryChargeTotalInclGST:
          valueOrNull(
            local.RaileatsCustomerDeliveryChargeTotalInclGST
          ),

        RaileatsOrdersPaymentOptionforCustomer:
          valueOrNull(
            local.RaileatsOrdersPaymentOptionforCustomer
          ),

        IRCTCOrdersPaymentOptionforCustomer:
          valueOrNull(
            local.IRCTCOrdersPaymentOptionforCustomer
          ),

        RestroTypeofDeliveryRailEatsorVendor:
          valueOrNull(
            local.RestroTypeofDeliveryRailEatsorVendor
          ),
      };

      const response = await fetch(
        `/api/restros/${encodeURIComponent(code)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control":
              "no-cache, no-store, must-revalidate",
          },
          cache: "no-store",
          body: JSON.stringify(payload),
        }
      );

      const json = await response
        .json()
        .catch(() => ({}));

      if (
        !response.ok ||
        json?.ok === false
      ) {
        throw new Error(
          json?.error || "Save failed"
        );
      }

      if (json?.row) {
        setLocal((previous) =>
          normalize({
            ...previous,
            ...json.row,

            /*
             * API response mein old OpenTime ho tab bhi
             * submitted latest time form mein bana rahega.
             */
            open_time:
              json.row.open_time ??
              payload.open_time,

            closed_time:
              json.row.closed_time ??
              payload.closed_time,
          })
        );
      } else {
        setLocal((previous) =>
          normalize({
            ...previous,
            open_time: payload.open_time,
            closed_time:
              payload.closed_time,
          })
        );
      }

      setMsg("Saved successfully");

      /*
       * Next server render mein bhi fresh Supabase
       * values fetch hongi.
       */
      router.refresh();

      if (nextHref) {
        router.push(nextHref);
      }
    } catch (error: any) {
      setMsg(
        error?.message || "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Station Settings"
      subtitle={
        mode === "new"
          ? "Add station and order settings for this new restaurant"
          : "Manage station and delivery settings"
      }
      actions={
        <AdminButton
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </AdminButton>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminField label="Station">
          <AdminInput
            value={stationDisplay(local)}
            readOnly
          />
        </AdminField>

        <AdminField label="Station Code">
          <AdminInput
            value={local.StationCode ?? ""}
            readOnly={stationLocked}
            onChange={(event) =>
              updateField(
                "StationCode",
                event.target.value.toUpperCase()
              )
            }
          />
        </AdminField>

        <AdminField label="Station Name">
          <AdminInput
            value={local.StationName ?? ""}
            readOnly={stationLocked}
            onChange={(event) =>
              updateField(
                "StationName",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="State">
          <AdminInput
            value={local.State ?? ""}
            readOnly={stationLocked}
            onChange={(event) =>
              updateField(
                "State",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Raileats Customer Delivery Charge">
          <AdminInput
            value={
              local.RaileatsCustomerDeliveryCharge ??
              ""
            }
            onChange={(event) =>
              updateField(
                "RaileatsCustomerDeliveryCharge",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Weekly Off">
          <AdminSelect
            value={local.WeeklyOff ?? ""}
            onChange={(event) =>
              updateField(
                "WeeklyOff",
                event.target.value
              )
            }
          >
            <option value="">
              -- Select --
            </option>

            {weekDays.map((day) => (
              <option
                key={day.value}
                value={day.value}
              >
                {day.label}
              </option>
            ))}
          </AdminSelect>
        </AdminField>

        <AdminField label="Delivery Charge GST Rate (%)">
          <AdminInput
            value={
              local.RaileatsCustomerDeliveryChargeGSTRate ??
              ""
            }
            onChange={(event) =>
              updateField(
                "RaileatsCustomerDeliveryChargeGSTRate",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Open Time">
          <AdminInput
            type="time"
            value={local.OpenTime ?? ""}
            onChange={(event) =>
              updateField(
                "OpenTime",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Closed Time">
          <AdminInput
            type="time"
            value={local.ClosedTime ?? ""}
            onChange={(event) =>
              updateField(
                "ClosedTime",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Delivery Charge GST (absolute)">
          <AdminInput
            value={
              local.RaileatsCustomerDeliveryChargeGST ??
              ""
            }
            onChange={(event) =>
              updateField(
                "RaileatsCustomerDeliveryChargeGST",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Delivery Charge Total Incl GST">
          <AdminInput
            value={
              local.RaileatsCustomerDeliveryChargeTotalInclGST ??
              ""
            }
            onChange={(event) =>
              updateField(
                "RaileatsCustomerDeliveryChargeTotalInclGST",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Minimum Order Value">
          <AdminInput
            value={
              local.MinimumOrderValue ?? ""
            }
            onChange={(event) =>
              updateField(
                "MinimumOrderValue",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Cut Off Time (mins)">
          <AdminInput
            value={local.CutOffTime ?? ""}
            onChange={(event) =>
              updateField(
                "CutOffTime",
                event.target.value
              )
            }
          />
        </AdminField>

        <AdminField label="Raileats Orders Payment Option">
          <AdminSelect
            value={
              local.RaileatsOrdersPaymentOptionforCustomer ??
              ""
            }
            onChange={(event) =>
              updateField(
                "RaileatsOrdersPaymentOptionforCustomer",
                event.target.value
              )
            }
          >
            <option value="">
              -- Select --
            </option>

            {paymentOptions.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </AdminSelect>
        </AdminField>

        <AdminField label="IRCTC Orders Payment Option">
          <AdminSelect
            value={
              local.IRCTCOrdersPaymentOptionforCustomer ??
              ""
            }
            onChange={(event) =>
              updateField(
                "IRCTCOrdersPaymentOptionforCustomer",
                event.target.value
              )
            }
          >
            <option value="">
              -- Select --
            </option>

            {paymentOptions.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </AdminSelect>
        </AdminField>

        <AdminField label="Restro Type of Delivery">
          <AdminSelect
            value={
              local.RestroTypeofDeliveryRailEatsorVendor ??
              ""
            }
            onChange={(event) =>
              updateField(
                "RestroTypeofDeliveryRailEatsorVendor",
                event.target.value
              )
            }
          >
            <option value="">
              -- Select --
            </option>

            {deliveryTypes.map((option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
      </div>

      {msg ? (
        <div className="mt-4 text-sm font-semibold text-blue-700">
          {msg}
        </div>
      ) : null}
    </AdminCard>
  );
}
