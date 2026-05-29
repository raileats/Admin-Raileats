// components/restro-route-tabs/StationSettingsClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";

type Restro = Record<string, any>;

type Props = {
  initialData?: Restro;
  restroCode?: string | number;
  mode?: "edit" | "new";
};

const paymentOptions = ["Both", "Online", "COD", "Prepaid", "Postpaid", "None"];
const weekDays = ["", "SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const deliveryTypes = ["Raileats", "Vendor", "Both"];

function normalize(row: Restro) {
  return {
    ...row,
    OpenTime: row?.OpenTime ?? row?.open_time ?? "",
    ClosedTime: row?.ClosedTime ?? row?.closed_time ?? "",
  };
}

function stationDisplay(restro: Restro) {
  const name = restro?.StationName ?? "";
  const code = restro?.StationCode ?? "";
  const state = restro?.State ?? "";
  if (!name && !code && !state) return "-";
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`;
}

export default function StationSettingsClient({ initialData = {}, restroCode, mode = "edit" }: Props) {
  const [local, setLocal] = useState<Restro>(() => normalize({ ...initialData, RestroCode: restroCode ?? initialData?.RestroCode }));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const code = useMemo(() => String(restroCode ?? local?.RestroCode ?? ""), [restroCode, local?.RestroCode]);

  function updateField(key: string, value: any) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!code) {
      setMsg("Missing RestroCode. Please save Basic Information first.");
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        StationCode: local.StationCode || null,
        StationName: local.StationName || null,
        State: local.State || null,
        WeeklyOff: local.WeeklyOff || null,
        open_time: local.OpenTime || null,
        closed_time: local.ClosedTime || null,
        MinimumOrderValue: local.MinimumOrderValue || null,
        CutOffTime: local.CutOffTime || null,
        RaileatsCustomerDeliveryCharge: local.RaileatsCustomerDeliveryCharge || null,
        RaileatsCustomerDeliveryChargeGSTRate: local.RaileatsCustomerDeliveryChargeGSTRate || null,
        RaileatsCustomerDeliveryChargeGST: local.RaileatsCustomerDeliveryChargeGST || null,
        RaileatsCustomerDeliveryChargeTotalInclGST: local.RaileatsCustomerDeliveryChargeTotalInclGST || null,
        RaileatsOrdersPaymentOptionforCustomer: local.RaileatsOrdersPaymentOptionforCustomer || null,
        IRCTCOrdersPaymentOptionforCustomer: local.IRCTCOrdersPaymentOptionforCustomer || null,
        RestroTypeofDeliveryRailEatsorVendor: local.RestroTypeofDeliveryRailEatsorVendor || null,
      };

      const res = await fetch(`/api/restros/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Save failed");
      if (json?.row) setLocal(normalize(json.row));
      setMsg("Saved successfully");
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
          <AdminInput value={local.StationCode ?? ""} onChange={(e) => updateField("StationCode", e.target.value.toUpperCase())} />
        </AdminField>
        <AdminField label="Station Name">
          <AdminInput value={local.StationName ?? ""} onChange={(e) => updateField("StationName", e.target.value)} />
        </AdminField>
        <AdminField label="State">
          <AdminInput value={local.State ?? ""} onChange={(e) => updateField("State", e.target.value)} />
        </AdminField>
        <AdminField label="Raileats Customer Delivery Charge">
          <AdminInput value={local.RaileatsCustomerDeliveryCharge ?? ""} onChange={(e) => updateField("RaileatsCustomerDeliveryCharge", e.target.value)} />
        </AdminField>
        <AdminField label="Weekly Off">
          <AdminSelect value={local.WeeklyOff ?? ""} onChange={(e) => updateField("WeeklyOff", e.target.value)}>
            {weekDays.map((d) => <option key={d || "none"} value={d}>{d || "No weekly off"}</option>)}
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
          <AdminSelect value={local.RaileatsOrdersPaymentOptionforCustomer ?? "Both"} onChange={(e) => updateField("RaileatsOrdersPaymentOptionforCustomer", e.target.value)}>
            {paymentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
          </AdminSelect>
        </AdminField>
        <AdminField label="IRCTC Orders Payment Option">
          <AdminSelect value={local.IRCTCOrdersPaymentOptionforCustomer ?? "Both"} onChange={(e) => updateField("IRCTCOrdersPaymentOptionforCustomer", e.target.value)}>
            {paymentOptions.map((x) => <option key={x} value={x}>{x}</option>)}
          </AdminSelect>
        </AdminField>
        <AdminField label="Restro Type of Delivery">
          <AdminSelect value={local.RestroTypeofDeliveryRailEatsorVendor ?? "Raileats"} onChange={(e) => updateField("RestroTypeofDeliveryRailEatsorVendor", e.target.value)}>
            {deliveryTypes.map((x) => <option key={x} value={x}>{x}</option>)}
          </AdminSelect>
        </AdminField>
      </div>
      {msg ? <div className="mt-4 text-sm font-semibold text-blue-700">{msg}</div> : null}
    </AdminCard>
  );
}
