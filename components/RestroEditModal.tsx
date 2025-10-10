"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase as supabaseBrowser } from "@/lib/supabaseBrowser"; // adjust if your export name diff

import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
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

const Icon = {
  basic: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 2L3 6v6c0 5 3.8 9.2 9 10 5.2-.8 9-5 9-10V6l-9-4z" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2.1-1.6-1.9-3.3-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-6l-.4 3.1a7.6 7.6 0 0 0-1.7 1l-2.5-1L2 11.4l2.1 1.6a7.9 7.9 0 0 0 0 2l-2.1 1.6 1.9 3.3 2.5-1a7.6 7.6 0 0 0 1.7 1L9 21h6l.4-3.1a7.6 7.6 0 0 0 1.7-1l2.5 1 1.9-3.3L19.4 15z" />
    </svg>
  ),
  docs: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </svg>
  ),
  contacts: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 4.9V22h16v-3.1c0-2.7-3.6-4.9-8-4.9z" />
    </svg>
  ),
  bank: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 2L1 6l11 4 11-4-11-4zm0 7v13" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M7 10h5v5H7zM3 4h18v18H3z" />
    </svg>
  ),
  menu: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
    </svg>
  ),
};

function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

/* validators */
const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;
function validateEmailString(s: string) {
  if (!s) return false;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) if (!emailRegex.test(p)) return false;
  return true;
}
function validatePhoneString(s: string) {
  if (!s) return false;
  const parts = s.split(",").map((p) => p.replace(/\s+/g, "").trim()).filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) if (!tenDigitRegex.test(p)) return false;
  return true;
}

/* InputWithIcon (same as you had) */
function InputWithIcon({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  maxLength,
}: {
  name?: string;
  label?: string;
  value: any;
  onChange: (v: any) => void;
  type?: "text" | "email" | "phone" | "whatsapp" | "name";
  placeholder?: string;
  maxLength?: number;
}) {
  const [touched, setTouched] = useState(false);
  const v = typeof value === "string" ? value : value ?? "";

  let valid = true;
  if (type === "email") valid = validateEmailString(String(v));
  else if (type === "phone" || type === "whatsapp") valid = validatePhoneString(String(v));
  else if (type === "name") valid = String(v).trim().length > 0;
  else valid = true;

  const showError = touched && !valid;
  const icon = type === "phone" ? "📞" : type === "whatsapp" ? "🟢" : type === "email" ? "✉️" : "👤";

  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <input
          aria-label={label ?? name}
          name={name}
          placeholder={placeholder}
          value={v}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          onFocus={() => setTouched(true)}
          maxLength={maxLength}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 6,
            border: showError ? "1px solid #ef4444" : "1px solid #e6e6e6",
            outline: "none",
            fontSize: 14,
          }}
        />
      </div>
      {showError && (
        <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>
          {type === "email" && "Please enter a valid email (example: name@example.com)."}
          {type === "phone" && "Enter a 10-digit numeric mobile number (no spaces)."}
          {type === "whatsapp" && "Enter a 10-digit numeric WhatsApp number (no spaces)."}
          {type === "name" && "Please enter a name."}
        </div>
      )}
    </div>
  );
}

/* Toggle component passed down so ContactsTab aligns with parent layout */
function Toggle({ checked, onChange }: { checked?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 14,
          background: checked ? "#06b6d4" : "#e6e6e6",
          position: "relative",
          transition: "background .15s ease",
          display: "inline-block",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            background: "#fff",
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "left .12s ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: "#333", minWidth: 28 }}>{checked ? "ON" : "OFF"}</span>
    </label>
  );
}

/* main component */
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
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (restroProp) setRestro(restroProp);
  }, [restroProp]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Esc") doClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restro]);

  useEffect(() => {
    if (stations && stations.length) return;
    (async () => {
      setLoadingStations(true);
      try {
        const res = await fetch("/api/stations");
        if (!res.ok) {
          setLoadingStations(false);
          return;
        }
        const json = await res.json().catch(() => null);
        const rows = json?.rows ?? json?.data ?? json ?? [];
        const opts = (rows || []).map((r: any) => {
          const label = `${(r.StationName ?? r.station_name ?? r.name ?? "").toString().trim()} ${(r.StationCode ?? r.station_code) ? `(${r.StationCode ?? r.station_code})` : ""}${r.State ? ` - ${r.State}` : ""}`.trim();
          return { label, value: (r.StationCode ?? r.station_code ?? "").toString() };
        });
        if (opts.length) setStations(opts);
      } catch (err) {
        console.warn("stations fetch failed", err);
      } finally {
        setLoadingStations(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!restro) return;
    setLocal({
      RestroName: safeGet(restro, "RestroName", "restro_name", "name") ?? "",
      RestroCode: safeGet(restro, "RestroCode", "restro_code", "code", "RestroId", "restro_id") ?? "",
      StationCode: safeGet(restro, "StationCode", "station_code", "Station_Code", "stationCode") ?? "",
      StationName: safeGet(restro, "StationName", "station_name", "station") ?? "",
      State: safeGet(restro, "State", "state", "state_name", "StateName") ?? "",
      WeeklyOff: safeGet(restro, "WeeklyOff", "weekly_off") ?? "SUN",
      OpenTime: safeGet(restro, "OpenTime", "open_time") ?? "10:00",
      ClosedTime: safeGet(restro, "ClosedTime", "closed_time") ?? "23:00",
      MinimumOrderValue: Number(safeGet(restro, "MinimumOrderValue", "minimum_order_value") ?? 0),
      CutOffTime: Number(safeGet(restro, "CutOffTime", "cut_off_time") ?? 0),
      RaileatsDeliveryCharge: Number(safeGet(restro, "RaileatsDeliveryCharge", "raileats_delivery_charge") ?? 0),
      RaileatsDeliveryChargeGSTRate: Number(safeGet(restro, "RaileatsDeliveryChargeGSTRate", "raileats_delivery_charge_gst_rate") ?? 0),
      RaileatsDeliveryChargeGST: Number(safeGet(restro, "RaileatsDeliveryChargeGST", "raileats_delivery_charge_gst") ?? 0),
      RaileatsDeliveryChargeTotalInclGST: Number(safeGet(restro, "RaileatsDeliveryChargeTotalInclGST", "raileats_delivery_charge_total_incl_gst") ?? 0),
      OrdersPaymentOptionForCustomer: safeGet(restro, "OrdersPaymentOptionForCustomer", "orders_payment_option_for_customer") ?? "BOTH",
      IRCTCOrdersPaymentOptionForCustomer: safeGet(restro, "IRCTCOrdersPaymentOptionForCustomer", "irctc_orders_payment_option") ?? "BOTH",
      RestroTypeOfDelivery: safeGet(restro, "RestroTypeOfDelivery", "restro_type_of_delivery") ?? "RAILEATS",
      OwnerName: safeGet(restro, "OwnerName", "owner_name") ?? "",
      OwnerPhone: safeGet(restro, "OwnerPhone", "owner_phone") ?? "",
      RestroDisplayPhoto: safeGet(restro, "RestroDisplayPhoto", "restro_display_photo") ?? "",
      BrandName: safeGet(restro, "BrandName", "brand_name") ?? "",
      RestroEmail: safeGet(restro, "RestroEmail", "restro_email") ?? "",
      RestroPhone: safeGet(restro, "RestroPhone", "restro_phone") ?? "",
      // contacts-like fields
      EmailAddressName1: restro?.EmailAddressName1 ?? "",
      EmailsforOrdersReceiving1: restro?.EmailsforOrdersReceiving1 ?? "",
      EmailsforOrdersStatus1: restro?.EmailsforOrdersStatus1 ?? 0,
      WhatsappMobileNumberName1: restro?.WhatsappMobileNumberName1 ?? "",
      WhatsappMobileNumberforOrderDetails1: restro?.WhatsappMobileNumberforOrderDetails1 ?? "",
      WhatsappMobileNumberStatus1: restro?.WhatsappMobileNumberStatus1 ?? 0,
      ...restro,
    });
  }, [restro]);

  const saving = parentSaving ?? savingInternal;

  const updateField = useCallback((key: string, value: any) => {
    setLocal((s: any) => ({ ...s, [key]: value }));
    setError(null);
    setNotification(null);
  }, []);

  async function defaultPatch(payload: any) {
    try {
      const code =
        restro?.RestroCode ?? restro?.restro_code ?? restro?.RestroId ?? restro?.restro_id ?? restro?.code ?? local?.RestroCode;
      if (!code) throw new Error("Missing RestroCode for update");

      const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // read text safely
      let text = "";
      try {
        text = await res.text();
      } catch (e) {
        text = "";
      }

      // try parse JSON if possible
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      // compute human-friendly message using parentheses to avoid mixing ?? and ||
      const possibleError = (json?.error?.message ?? json?.error ?? text);
      if (!res.ok) {
        throw new Error(possibleError || `Update failed (${res.status})`);
      }

      return { ok: true, row: json?.row ?? json?.data ?? json ?? null };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
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

  const stationDisplay = `${String(local.StationName ?? restro?.StationName ?? "")}${local.State ? " - " + local.State : ""}`;

  const restroCode =
    (local && (local.RestroCode ?? local.restro_code ?? local.id ?? local.code)) ||
    (restro && (restro.RestroCode ?? restro.restro_code ?? restro.RestroId ?? restro.restro_id ?? restro.code)) ||
    "";

  function collectValidationErrors(obj: any) {
    const errs: string[] = [];
    for (const key of Object.keys(obj)) {
      const low = key.toLowerCase();
      const val = obj[key];
      if (!val || (typeof val === "string" && val.trim() === "")) continue;

      if (low.includes("email") || low.includes("emailsfor") || low.includes("emailaddress")) {
        if (typeof val !== "string") errs.push(`${key}: expected text (email), got ${typeof val}`);
        else if (!validateEmailString(String(val))) errs.push(`${key}: invalid email(s) => "${String(val)}"`);
      }

      if (low.includes("whatsapp") || low.includes("mobile") || low.includes("phone") || low.includes("contact")) {
        const text = String(val).trim();
        if (/\d/.test(text)) {
          if (!validatePhoneString(text)) {
            errs.push(`${key}: invalid phone number(s) => "${text}". Expect 10-digit numeric numbers.`);
          }
        }
      }
    }
    return errs;
  }

  // use the supabase instance exported from your lib
  const supabase = supabaseBrowser;

  async function handleSave() {
    setNotification(null);
    setError(null);

    const validationErrors = collectValidationErrors(local);
    if (validationErrors.length) {
      setNotification({ type: "error", text: `Validation failed:\n• ${validationErrors.join("\n• ")}` });
      return;
    }

    if (!restroCode) {
      setNotification({ type: "error", text: "Missing RestroCode — cannot save." });
      return;
    }

    setSavingInternal(true);
    try {
      const payload: any = { ...local };

      // remove nested objects
      for (const k of Object.keys(payload)) {
        if (typeof payload[k] === "object" && payload[k] !== null) delete payload[k];
      }

      // update using supabase client
      const { error: supError } = await (supabase as any).from("RestroMaster").update(payload).eq("RestroCode", restroCode);

      if (supError) throw supError;

      setNotification({ type: "success", text: "Changes saved successfully ✅" });

      setTimeout(() => {
        if ((router as any).refresh) router.refresh();
        else window.location.reload();
      }, 700);
    } catch (err: any) {
      console.error("Save error:", err);
      setNotification({ type: "error", text: `Save failed: ${err?.message ?? String(err)}` });
    } finally {
      setSavingInternal(false);
      setTimeout(() => setNotification(null), 6000);
    }
  }

  const common = {
    local,
    updateField,
    stationDisplay,
    stations,
    loadingStations,
    restroCode,
    InputWithIcon,
    Toggle,
    validators: {
      validateEmailString,
      validatePhoneString,
    },
  };

  function tabIcon(t: string | undefined | null) {
    switch (t) {
      case "Basic Information":
        return Icon.basic;
      case "Station Settings":
        return Icon.settings;
      case "Address & Documents":
        return Icon.docs;
      case "Contacts":
        return Icon.contacts;
      case "Bank":
        return Icon.bank;
      case "Future Closed":
        return Icon.calendar;
      case "Menu":
        return Icon.menu;
      default:
        return null;
    }
  }

  const renderTab = () => {
    switch (activeTab) {
      case "Basic Information":
        return <BasicInformationTab {...common} />;
      case "Station Settings":
        return <StationSettingsTab {...common} />;
      case "Address & Documents":
        return <AddressDocsClient initialData={restro} imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""} />;
      case "Contacts":
        return <ContactsTab {...common} />;
      case "Bank":
        return <BankTab {...common} />;
      case "Future Closed":
        return <FutureClosedTab {...common} />;
      case "Menu":
        return <MenuTab {...common} />;
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
        <div style={{ position: "sticky", top: 0, zIndex: 1200, background: "#fff", borderBottom: "1px solid #e9e9e9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
            <div style={{ fontWeight: 700 }}>
              <div style={{ fontSize: 15 }}>
                {String(local.RestroCode ?? restro?.RestroCode ?? "")}
                {(local.RestroName ?? restro?.RestroName) ? " / " : ""}{local.RestroName ?? restro?.RestroName ?? ""}
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#0b7285", marginTop: 4 }}>{stationDisplay}</div>
            </div>

            <div>
              <button
                onClick={doClose}
                aria-label="Close"
                title="Close (Esc)"
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: 8,
                  borderRadius: 6,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", gap: 6, padding: "8px 12px", overflowX: "auto", alignItems: "center" }}>
              {TAB_NAMES.map((t) => {
                const active = activeTab === t;
                return (
                  <div
                    key={t}
                    onClick={() => setActiveTab(t)}
                    role="button"
                    aria-pressed={active}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: active ? "3px solid #0ea5e9" : "3px solid transparent",
                      fontWeight: active ? 800 : 600,
                      color: active ? "#0ea5e9" : "#333",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                      borderRadius: 6,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", color: active ? "#0ea5e9" : "#666" }}>{tabIcon(t)}</span>
                    <span style={{ fontSize: 14 }}>{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {notification && (
          <div
            style={{
              padding: 10,
              textAlign: "center",
              background: notification.type === "success" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              color: notification.type === "success" ? "#065f46" : "#991b1b",
              fontWeight: 600,
              whiteSpace: "pre-wrap",
            }}
          >
            {notification.text}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {/* centered section header for each tab */}
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{activeTab}</h3>
          </div>

          <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>{renderTab()}</div>
        </div>

        <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 8, background: "#fff" }}>
          <div />
          <div>
            {error && <div style={{ color: "red", marginRight: 12, display: "inline-block" }}>{error}</div>}
            <button onClick={doClose} style={{ background: "#fff", color: "#333", border: "1px solid #e3e3e3", padding: "8px 12px", borderRadius: 6, marginRight: 8 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700 }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* shared small tweaks to make tabs/forms consistent */
        h3 { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial; }
        input[type="text"], input[type="number"], input[type="date"], input[type="time"], select, textarea {
          font-size: 14px;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
}
