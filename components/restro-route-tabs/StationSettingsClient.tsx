// components/restro-route-tabs/StationSettingsClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";

type Restro = Record<string, any>;

type Props = {
  initialData?: Restro;
  restroCode?: string | number;
  mode?: "edit" | "new";
  nextHref?: string;
};

const paymentOptions = ["Both", "Online", "COD", "Postpaid", "None"];
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
const deliveryTypes = ["Raileats", "Vendor", "Both"];

function normalize(row: Restro) {
  const openTime = row?.OpenTime ?? row?.open_time;
  const closedTime = row?.ClosedTime ?? row?.closed_time;

  return {
    ...row,
    OpenTime: openTime === undefined || openTime === null || openTime === "" ? "10:00" : openTime,
    ClosedTime: closedTime === undefined || closedTime === null || closedTime === "" ? "22:00" : closedTime,
  };
}

function stationDisplay(restro: Restro) {
  const name = restro?.StationName ?? "";
  const code = restro?.StationCode ?? "";
  const state = restro?.State ?? "";
  if (!name && !code && !state) return "-";
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`;
}

function valueOrNull(value: any) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).trim();
  return cleaned === "" ? null : cleaned;
}

export default function StationSettingsClient({ initialData = {}, restroCode, mode = "edit", nextHref }: Props) {
  const router = useRouter();
  const [local, setLocal] = useState<Restro>(() => normalize({ ...initialData, RestroCode: restroCode ?? initialData?.RestroCode }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const code = useMemo(() => String(restroCode ?? local?.RestroCode ?? ""), [restroCode, local?.RestroCode]);

  function updateField(key: string, value: any) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  const stationLocked = mode === "new" && !!local.StationCode;

  async function save() {
    if (!code) {
      setMsg("Missing RestroCode. Please save Basic Information first.");
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        StationCode: valueOrNull(local.StationCode),
        StationName: valueOrNull(local.StationName),
        State: valueOrNull(local.State),
        WeeklyOff: valueOrNull(local.WeeklyOff),
        open_time: valueOrNull(local.OpenTime),
        closed_time: valueOrNull(local.ClosedTime),
        MinimumOrderValue: valueOrNull(local.MinimumOrderValue),
        CutOffTime: valueOrNull(local.CutOffTime),
        RaileatsCustomerDeliveryCharge: valueOrNull(local.RaileatsCustomerDeliveryCharge),
        RaileatsCustomerDeliveryChargeGSTRate: valueOrNull(local.RaileatsCustomerDeliveryChargeGSTRate),
        RaileatsCustomerDeliveryChargeGST: valueOrNull(local.RaileatsCustomerDeliveryChargeGST),
        RaileatsCustomerDeliveryChargeTotalInclGST: valueOrNull(local.RaileatsCustomerDeliveryChargeTotalInclGST),
        RaileatsOrdersPaymentOptionforCustomer: valueOrNull(local.RaileatsOrdersPaymentOptionforCustomer),
        IRCTCOrdersPaymentOptionforCustomer: valueOrNull(local.IRCTCOrdersPaymentOptionforCustomer),
        RestroTypeofDeliveryRailEatsorVendor: valueOrNull(local.RestroTypeofDeliveryRailEatsorVendor),
      };

      const res = await fetch(`/api/restros/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Save failed");
      if (json?.row) {
        setLocal((prev) => normalize({ ...prev, ...json.row }));
      }
      setMsg("Saved successfully");
      if (nextHref) {
        router.push(nextHref);
      }
    } catch (error: any) {
      setMsg(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminCard
      title="Station Settings"
      subtitle={mode === "new" ? "Add station and order settings for this new restaurant" : "Manage station and delivery settings"}
      actions={<AdminButton onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</AdminButton>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AdminField label="Station">
          <AdminInput value={stationDisplay(local)} readOnly />
        </AdminField>
        <AdminField label="Station Code">
          <AdminInput value={local.StationCode ?? ""} readOnly={stationLocked} onChange={(e) => updateField("StationCode", e.target.value.toUpperCase())} />
        </AdminField>
        <AdminField label="Station Name">
          <AdminInput value={local.StationName ?? ""} readOnly={stationLocked} onChange={(e) => updateField("StationName", e.target.value)} />
        </AdminField>
        <AdminField label="State">
          <AdminInput value={local.State ?? ""} readOnly={stationLocked} onChange={(e) => updateField("State", e.target.value)} />
        </AdminField>
        <AdminField label="Raileats Customer Delivery Charge">
          <AdminInput value={local.RaileatsCustomerDeliveryCharge ?? ""} onChange={(e) => updateField("RaileatsCustomerDeliveryCharge", e.target.value)} />
        </AdminField>
        <AdminField label="Weekly Off">
          <AdminSelect value={local.WeeklyOff ?? ""} onChange={(e) => updateField("WeeklyOff", e.target.value)}>
            <option value="">-- Select --</option>
            {weekDays.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </AdminSelect>
        </AdminField>
        <AdminField label="Delivery Charge GST Rate (%)">
          <AdminInput value={local.RaileatsCustomerDeliveryChargeGSTRate ?? ""} onChange={(e) => updateField("RaileatsCustomerDeliveryChargeGSTRate", e.target.value)} />
        </AdminField>
        <AdminField label="Open Time">
          <AdminInput type="time" value={local.OpenTime ?? ""} onChange={(e) => updateField("OpenTime", e.target.value)} />
        </AdminField>
        <AdminField label="Closed Time">
          <AdminInput type="time" value={local.ClosedTime ?? ""} onChange={(e) => updateField("ClosedTime", e.target.value)} />
        </AdminField>
        <AdminField label="Delivery Charge GST (absolute)">
          <AdminInput value={local.RaileatsCustomerDeliveryChargeGST ?? ""} onChange={(e) => updateField("RaileatsCustomerDeliveryChargeGST", e.target.value)} />
        </AdminField>
        <AdminField label="Delivery Charge Total Incl GST">
          <AdminInput value={local.RaileatsCustomerDeliveryChargeTotalInclGST ?? ""} onChange={(e) => updateField("RaileatsCustomerDeliveryChargeTotalInclGST", e.target.value)} />
        </AdminField>
        <AdminField label="Minimum Order Value">
          <AdminInput value={local.MinimumOrderValue ?? ""} onChange={(e) => updateField("MinimumOrderValue", e.target.value)} />
        </AdminField>
        <AdminField label="Cut Off Time (mins)">
          <AdminInput value={local.CutOffTime ?? ""} onChange={(e) => updateField("CutOffTime", e.target.value)} />
        </AdminField>
        <AdminField label="Raileats Orders Payment Option">
          <AdminSelect value={local.RaileatsOrdersPaymentOptionforCustomer ?? ""} onChange={(e) => updateField("RaileatsOrdersPaymentOptionforCustomer", e.target.value)}>
            <option value="">-- Select --</option>
            {paymentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
          </AdminSelect>
        </AdminField>
        <AdminField label="IRCTC Orders Payment Option">
          <AdminSelect value={local.IRCTCOrdersPaymentOptionforCustomer ?? ""} onChange={(e) => updateField("IRCTCOrdersPaymentOptionforCustomer", e.target.value)}>
            <option value="">-- Select --</option>
            {paymentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
          </AdminSelect>
        </AdminField>
        <AdminField label="Restro Type of Delivery">
          <AdminSelect value={local.RestroTypeofDeliveryRailEatsorVendor ?? ""} onChange={(e) => updateField("RestroTypeofDeliveryRailEatsorVendor", e.target.value)}>
            <option value="">-- Select --</option>
            {deliveryTypes.map((x) => <option key={x} value={x}>{x}</option>)}
          </AdminSelect>
        </AdminField>
      </div>
      {msg ? <div className="mt-4 text-sm font-semibold text-blue-700">{msg}</div> : null}
    </AdminCard>
  );
}
