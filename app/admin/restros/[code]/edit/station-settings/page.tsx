// app/admin/restros/[code]/edit/station-settings/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import { AdminField, AdminInput, AdminSelect } from "@/components/admin/AdminField";

type Restro = Record<string, any>;

function buildStationDisplay(restro: Restro) {
  const name = restro?.StationName ?? "";
  const code = restro?.StationCode ?? "";
  const state = restro?.State ?? "";

  if (!name && !code && !state) return "-";
  return `${name}${code ? ` (${code})` : ""}${state ? ` - ${state}` : ""}`;
}

function normalizeRestro(row: any) {
  return {
    ...row,
    OpenTime: row?.OpenTime ?? row?.open_time ?? "",
    ClosedTime: row?.ClosedTime ?? row?.closed_time ?? "",
  };
}

export default function StationSettingsPage() {
  const router = useRouter();
  const params = useParams() as { code?: string | string[] };
  const code = Array.isArray(params.code) ? params.code[0] : params.code || "";

  const [local, setLocal] = useState<Restro>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    let mounted = true;

    async function loadRestro() {
      setLoading(true);
      setErr(null);

      try {
        const res = await fetch(`/api/restros/${encodeURIComponent(code)}?t=${Date.now()}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Failed to load station settings");
        }

        const row = json?.row ?? json?.data ?? json;
        if (mounted) setLocal(normalizeRestro(row || {}));
      } catch (error: any) {
        console.error(error);
        if (mounted) setErr(error?.message || "Failed to load station settings");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadRestro();

    return () => {
      mounted = false;
    };
  }, [code]);

  function updateField(key: string, value: any) {
    setLocal((prev) => ({
      ...prev,
      [key]: value,
    }));
    setMsg(null);
    setErr(null);
  }

  async function save() {
    if (!code) return;

    setSaving(true);
    setMsg(null);
    setErr(null);

    try {
      const payload = {
        WeeklyOff: local.WeeklyOff,
        open_time: local.OpenTime,
        closed_time: local.ClosedTime,
        MinimumOrderValue: local.MinimumOrderValue,
        CutOffTime: local.CutOffTime,
        RaileatsCustomerDeliveryCharge: local.RaileatsCustomerDeliveryCharge,
        RaileatsCustomerDeliveryChargeGSTRate: local.RaileatsCustomerDeliveryChargeGSTRate,
        RaileatsCustomerDeliveryChargeGST: local.RaileatsCustomerDeliveryChargeGST,
        RaileatsCustomerDeliveryChargeTotalInclGST: local.RaileatsCustomerDeliveryChargeTotalInclGST,
        RaileatsOrdersPaymentOptionforCustomer: local.RaileatsOrdersPaymentOptionforCustomer,
        IRCTCOrdersPaymentOptionforCustomer: local.IRCTCOrdersPaymentOptionforCustomer,
        RestroTypeofDeliveryRailEatsorVendor: local.RestroTypeofDeliveryRailEatsorVendor,
      };

      const res = await fetch(`/api/restros/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Save failed");
      }

      const row = json?.row ?? json?.data ?? null;
      if (row) setLocal((prev) => ({ ...prev, ...normalizeRestro(row) }));
      setMsg("Saved successfully");
    } catch (error: any) {
      console.error(error);
      setErr(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminCard title="Station Settings">
        <p className="text-sm font-medium text-slate-500">Loading station settings...</p>
      </AdminCard>
    );
  }

  return (
    <AdminCard
      title="Station Settings"
      actions={
        <div className="flex gap-2">
          <AdminButton variant="secondary" onClick={() => router.back()}>
            Cancel
          </AdminButton>
          <AdminButton onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </AdminButton>
        </div>
      }
    >
      {err && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminField label="Station">
          <div className="flex h-10 items-center rounded-md bg-slate-100 px-3 text-sm font-semibold text-slate-700">
            {buildStationDisplay(local)}
          </div>
        </AdminField>

        <AdminField label="Raileats Customer Delivery Charge">
          <AdminInput
            type="number"
            value={local?.RaileatsCustomerDeliveryCharge ?? 0}
            onChange={(e) => updateField("RaileatsCustomerDeliveryCharge", Number(e.target.value || 0))}
          />
        </AdminField>

        <AdminField label="Weekly Off">
          <AdminSelect
            value={local?.WeeklyOff ?? "SUN"}
            onChange={(e) => updateField("WeeklyOff", e.target.value)}
          >
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </AdminSelect>
        </AdminField>

        <AdminField label="Delivery Charge GST Rate (%)">
          <AdminInput
            type="number"
            value={local?.RaileatsCustomerDeliveryChargeGSTRate ?? ""}
            onChange={(e) => updateField("RaileatsCustomerDeliveryChargeGSTRate", e.target.value)}
          />
        </AdminField>

        <AdminField label="Open Time">
          <AdminInput
            type="time"
            value={local?.OpenTime ?? ""}
            onChange={(e) => updateField("OpenTime", e.target.value)}
          />
        </AdminField>

        <AdminField label="Closed Time">
          <AdminInput
            type="time"
            value={local?.ClosedTime ?? ""}
            onChange={(e) => updateField("ClosedTime", e.target.value)}
          />
        </AdminField>

        <AdminField label="Delivery Charge GST (absolute)">
          <AdminInput
            type="number"
            value={local?.RaileatsCustomerDeliveryChargeGST ?? ""}
            onChange={(e) => updateField("RaileatsCustomerDeliveryChargeGST", e.target.value)}
          />
        </AdminField>

        <AdminField label="Delivery Charge Total Incl GST">
          <AdminInput
            type="number"
            value={local?.RaileatsCustomerDeliveryChargeTotalInclGST ?? ""}
            onChange={(e) => updateField("RaileatsCustomerDeliveryChargeTotalInclGST", e.target.value)}
          />
        </AdminField>

        <AdminField label="Minimum Order Value">
          <AdminInput
            type="number"
            value={local?.MinimumOrderValue ?? ""}
            onChange={(e) => updateField("MinimumOrderValue", Number(e.target.value || 0))}
          />
        </AdminField>

        <AdminField label="Cut Off Time (mins)">
          <AdminInput
            type="number"
            value={local?.CutOffTime ?? ""}
            onChange={(e) => updateField("CutOffTime", Number(e.target.value || 0))}
          />
        </AdminField>

        <AdminField label="Raileats Orders Payment Option">
          <AdminSelect
            value={local?.RaileatsOrdersPaymentOptionforCustomer ?? "BOTH"}
            onChange={(e) => updateField("RaileatsOrdersPaymentOptionforCustomer", e.target.value)}
          >
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid</option>
            <option value="COD">COD</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="IRCTC Orders Payment Option">
          <AdminSelect
            value={local?.IRCTCOrdersPaymentOptionforCustomer ?? "BOTH"}
            onChange={(e) => updateField("IRCTCOrdersPaymentOptionforCustomer", e.target.value)}
          >
            <option value="BOTH">Both</option>
            <option value="PREPAID">Prepaid</option>
            <option value="COD">COD</option>
          </AdminSelect>
        </AdminField>

        <AdminField label="Restro Type of Delivery">
          <AdminSelect
            value={local?.RestroTypeofDeliveryRailEatsorVendor ?? "RAILEATS"}
            onChange={(e) => updateField("RestroTypeofDeliveryRailEatsorVendor", e.target.value)}
          >
            <option value="RAILEATS">Raileats</option>
            <option value="VENDOR">Vendor</option>
          </AdminSelect>
        </AdminField>
      </div>

      {msg && <div className="mt-4 text-sm font-semibold text-green-700">{msg}</div>}
    </AdminCard>
  );
}
