// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocumentsTab from "./restro-edit/AddressDocumentsTab";
import ContactsTab from "./restro-edit/ContactsTab";
import BankTab from "./restro-edit/BankTab";
import FutureClosedTab from "./restro-edit/FutureClosedTab";
import MenuTab from "./restro-edit/MenuTab";

type Props = {
  restro?: any;
  onClose?: () => void;
  onSave?: (payload: any) => Promise<{ ok: boolean; row?: any; error?: any }>;
  saving?: boolean;
  stationsOptions?: { label: string; value: string }[];
  initialTab?: string;
};

const TAB_NAMES = [
  "Basic Information",
  "Station Settings",
  "Address & Documents",
  "Contacts",
  "Bank",
  "Future Closed",
  "Menu",
];

function get(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function getStationDisplayFrom(obj: any) {
  const sName = (get(obj, "StationName", "station_name", "station", "name") ?? "").toString().trim();
  const sCode = (get(obj, "StationCode", "station_code", "station.code", "code") ?? "").toString().trim();
  const state = (get(obj, "State", "state", "state_name") ?? "").toString().trim();
  const parts: string[] = [];
  if (sName) parts.push(sName);
  if (sCode) parts.push(`(${sCode})`);
  let left = parts.join(" ");
  if (left && state) left = `${left} - ${state}`;
  else if (!left && state) left = state;
  return left || "—";
}

export default function RestroEditModal({
  restro: restroProp,
  onClose,
  onSave,
  saving: parentSaving,
  stationsOptions = [],
  initialTab,
}: Props) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>(initialTab ?? TAB_NAMES[0]);
  const [restro, setRestro] = useState<any | undefined>(restroProp);
  const [local, setLocal] = useState<any>({});
  const [stations, setStations] = useState<{ label: string; value: string }[]>(stationsOptions ?? []);
  const [loadingStations, setLoadingStations] = useState(false);
  const [savingInternal, setSavingInternal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (restroProp) setRestro(restroProp);
  }, [restroProp]);

  // fill local from restro whenever it arrives
  useEffect(() => {
    if (!restro) return;
    setLocal({
      RestroName: get(restro, "RestroName", "restro_name", "name") ?? "",
      RestroCode: get(restro, "RestroCode", "restro_code", "code", "RestroId", "restro_id") ?? "",
      StationCode: get(restro, "StationCode", "station_code") ?? "",
      StationName: get(restro, "StationName", "station_name") ?? "",
      State: get(restro, "State", "state", "state_name") ?? "",

      WeeklyOff: get(restro, "WeeklyOff", "weekly_off") ?? "SUN",
      OpenTime: get(restro, "OpenTime", "open_time") ?? "10:00",
      ClosedTime: get(restro, "ClosedTime", "closed_time") ?? "23:00",
      MinimumOrderValue: Number(get(restro, "MinimumOrderValue", "minimum_order_value") ?? 0),
      CutOffTime: Number(get(restro, "CutOffTime", "cut_off_time") ?? 0),

      RaileatsDeliveryCharge: Number(get(restro, "RaileatsDeliveryCharge", "raileats_delivery_charge") ?? 0),
      RaileatsDeliveryChargeGSTRate: Number(get(restro, "RaileatsDeliveryChargeGSTRate", "raileats_delivery_charge_gst_rate") ?? 0),
      RaileatsDeliveryChargeGST: Number(get(restro, "RaileatsDeliveryChargeGST", "raileats_delivery_charge_gst") ?? 0),
      RaileatsDeliveryChargeTotalInclGST: Number(get(restro, "RaileatsDeliveryChargeTotalInclGST", "raileats_delivery_charge_total_incl_gst") ?? 0),

      OrdersPaymentOptionForCustomer: get(restro, "OrdersPaymentOptionForCustomer", "orders_payment_option_for_customer") ?? "BOTH",
      IRCTCOrdersPaymentOptionForCustomer: get(restro, "IRCTCOrdersPaymentOptionForCustomer", "irctc_orders_payment_option") ?? "BOTH",
      RestroTypeOfDelivery: get(restro, "RestroTypeOfDelivery", "restro_type_of_delivery") ?? "RAILEATS",

      OwnerName: get(restro, "OwnerName", "owner_name") ?? "",
      OwnerPhone: get(restro, "OwnerPhone", "owner_phone") ?? "",
      RestroDisplayPhoto: get(restro, "RestroDisplayPhoto", "restro_display_photo") ?? "",
      BrandName: get(restro, "BrandName", "brand_name") ?? "",
      RestroEmail: get(restro, "RestroEmail", "restro_email") ?? "",
      RestroPhone: get(restro, "RestroPhone", "restro_phone") ?? "",

      ...restro,
    });
  }, [restro]);

  // try to fetch restro if not passed in props (parses code from url)
  useEffect(() => {
    async function fetchRestro(code: string) {
      try {
        const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`);
        if (!res.ok) return;
        const json = await res.json();
        const row = json?.row ?? json ?? null;
        if (row) setRestro(row);
      } catch (err) {
        console.warn("fetchRestro failed", err);
      }
    }
    if (!restro) {
      const p = typeof window !== "undefined" ? window.location.pathname : "";
      const m = p.match(/\/restros\/([^\/]+)\/edit/);
      if (m && m[1]) fetchRestro(decodeURIComponent(m[1]));
    }
  }, [restro]);

  // load stations list (optional)
  useEffect(() => {
    if (stations && stations.length) return;
    (async () => {
      setLoadingStations(true);
      try {
        const res = await fetch("/api/stations");
        if (!res.ok) return;
        const json = await res.json();
        const rows = json?.rows ?? json?.data ?? json ?? [];
        const opts = (rows || []).map((r: any) => {
          const label = `${(r.StationName ?? r.station_name ?? r.name ?? "").toString().trim()} ${(r.StationCode || r.station_code) ? `(${r.StationCode ?? r.station_code})` : ""}${r.State ? ` - ${r.State}` : ""}`.trim();
          return { label, value: (r.StationCode ?? r.station_code ?? "").toString() };
        });
        if (opts.length) setStations(opts);
      } catch (err) {
        console.warn(err);
      } finally {
        setLoadingStations(false);
      }
    })();
  }, []);

  // generic updater used by tabs
  function updateField(key: string, value: any) {
    setLocal((s: any) => ({ ...s, [key]: value }));
    setError(null);
  }

  const saving = parentSaving ?? savingInternal;

  async function handleSave() {
    setError(null);
    const payload = { ...local }; // you can filter only allowed fields if you want
    try {
      if (onSave) {
        if (parentSaving === undefined) setSavingInternal(true);
        const result = await onSave(payload);
        if (!result || !result.ok) throw new Error(result?.error ?? "Save failed");
      } else {
        // default patch
        const code = local.RestroCode ?? local.restro_code ?? restro?.RestroCode ?? restro?.restro_code;
        if (!code) throw new Error("Missing restro code");
        const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Update failed (${res.status})`);
        }
      }
      // on success close
      doClose();
    } catch (err: any) {
      console.error(err);
      setError(String(err?.message || err));
    } finally {
      if (parentSaving === undefined) setSavingInternal(false);
    }
  }

  function doClose() {
    if (onClose) {
      try {
        onClose();
      } catch {
        router.push("/admin/restros");
      }
    } else {
      router.push("/admin/restros");
    }
  }

  const stationDisplay = getStationDisplayFrom({ ...restro, ...local });

  // mapping tab -> component
  const renderActiveTab = () => {
    const commonProps = { local, updateField, stationDisplay, stations, loadingStations };
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...commonProps} />;
      case "Station Settings":
        return <StationSettingsTab {...commonProps} />;
      case "Address & Documents":
        return <AddressDocumentsTab {...commonProps} />;
      case "Contacts":
        return <ContactsTab {...commonProps} />;
      case "Bank":
        return <BankTab {...commonProps} />;
      case "Future Closed":
        return <FutureClosedTab {...commonProps} />;
      case "Menu":
        return <MenuTab {...commonProps} />;
      default:
        return <div>Unknown tab</div>;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 1100,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div style={{ background: "#fff", width: "98%", height: "98%", maxWidth: 1700, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* header */}
        <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 12, borderBottom: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
            <div style={{ fontWeight: 700 }}>
              <div style={{ fontSize: 15 }}>
                {String(local.RestroCode ?? restro?.RestroCode ?? "")}
                {(local.RestroName ?? restro?.RestroName) ? " / " : ""}{local.RestroName ?? restro?.RestroName ?? ""}
              </div>
              <div style={{ fontWeight: 600, color: "#0b7285", marginTop: 4 }}>{stationDisplay}</div>
            </div>

            <div>
              <button onClick={doClose} title="Close (Esc)" aria-label="Close" style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 10px", borderRadius: 6, cursor: "pointer" }}>
                ✕
              </button>
            </div>
          </div>

          {/* tabs */}
          <div style={{ background: "#fafafa", borderTop: "1px solid #fff", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", gap: 6, padding: "8px 12px" }}>
              {TAB_NAMES.map((t) => (
                <div
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: activeTab === t ? "3px solid #0ea5e9" : "3px solid transparent",
                    fontWeight: activeTab === t ? 600 : 500,
                    color: activeTab === t ? "#0ea5e9" : "#333",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>{renderActiveTab()}</div>

        {/* footer */}
        <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", background: "#fff" }}>
          <div>
            <button onClick={doClose} style={{ background: "#fff", border: "1px solid #e3e3e3", padding: "8px 12px", borderRadius: 6 }}>
              Cancel
            </button>
          </div>
          <div>
            {error && <span style={{ color: "red", marginRight: 12 }}>{error}</span>}
            <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
