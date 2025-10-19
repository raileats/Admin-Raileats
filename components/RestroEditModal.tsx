// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import BasicInformationTab from "./restro-edit/BasicInformationTab";
import StationSettingsTab from "./restro-edit/StationSettingsTab";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";
import ContactsTab from "./restro-edit/ContactsTab";
import BankTab from "./restro-edit/BankTab";
import FutureClosedTab from "./restro-edit/FutureClosedTab";
import MenuTab from "./restro-edit/MenuTab";

import UI from "@/components/AdminUI";
const { FormField, SubmitButton, AdminForm, Select, Toggle: UIToggle } = UI;

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

/* ---------- helpers ---------- */
function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function buildStationDisplay(obj: any) {
  const sName = (safeGet(obj, "StationName", "station_name", "station", "name") ?? "").toString().trim();
  const sCode = (safeGet(obj, "StationCode", "station_code", "Station_Code", "stationCode") ?? "").toString().trim();
  const state = (safeGet(obj, "State", "state", "state_name", "StateName") ?? "").toString().trim();
  const parts: string[] = [];
  if (sName) parts.push(sName);
  if (sCode) parts.push(`(${sCode})`);
  let left = parts.join(" ");
  if (left && state) left = `${left} - ${state}`;
  else if (!left && state) left = state;
  return left || "—";
}

/* ---------- validators ---------- */
const emailRegex = /^\S+@\S+\.\S+$/;
const tenDigitRegex = /^\d{10}$/;

function validateEmailString(s: string) {
  if (!s) return false;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) {
    if (!emailRegex.test(p)) return false;
  }
  return true;
}

function validatePhoneString(s: string) {
  if (!s) return false;
  const parts = s.split(",").map((p) => p.replace(/\s+/g, "").trim()).filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) {
    if (!tenDigitRegex.test(p)) return false;
  }
  return true;
}

/* ---------- small reusable UI (InputWithIcon + Toggle wrapper) ---------- */
function InputWithIcon({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: {
  name?: string;
  label?: string;
  value: any;
  onChange: (v: any) => void;
  type?: "text" | "email" | "phone" | "whatsapp" | "name";
  placeholder?: string;
}) {
  const [touched, setTouched] = useState(false);
  const v = typeof value === "string" ? value : value ?? "";

  const handleChange = (raw: string) => {
    if (type === "phone" || type === "whatsapp") {
      const cleaned = String(raw).replace(/\D/g, "").slice(0, 10);
      onChange(cleaned);
    } else {
      onChange(raw);
    }
  };

  let valid = true;
  if (type === "email") valid = validateEmailString(String(v));
  else if (type === "phone" || type === "whatsapp") valid = v === "" ? true : validatePhoneString(String(v));
  else if (type === "name") valid = String(v).trim().length > 0;
  else valid = true;

  const showError = touched && !valid;
  const icon = type === "phone" ? "📞" : type === "whatsapp" ? "🟢" : type === "email" ? "✉️" : "👤";

  return (
    <div className="mb-3">
      {label && <div className="text-sm text-gray-600 mb-1 font-medium">{label}</div>}
      <div className="flex items-center gap-3">
        <div style={{ fontSize: 18 }}>{icon}</div>
        <FormField error={showError ? "Invalid input" : null}>
          <input
            aria-label={label ?? name}
            name={name}
            placeholder={placeholder}
            value={v}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => setTouched(true)}
            onFocus={() => setTouched(true)}
            inputMode={type === "phone" || type === "whatsapp" ? "numeric" : "text"}
            maxLength={type === "phone" || type === "whatsapp" ? 10 : undefined}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
          />
        </FormField>
      </div>

      {showError && (
        <div className="text-xs text-red-600 mt-1">
          {type === "email" && "Please enter a valid email (example: name@example.com)."}
          {type === "phone" && "Enter a 10-digit numeric mobile number (no spaces)."}
          {type === "whatsapp" && "Enter a 10-digit numeric WhatsApp number (no spaces)."}
          {type === "name" && "Please enter a name."}
        </div>
      )}
    </div>
  );
}

/* Toggle wrapper that uses AdminUI Toggle visuals where possible */
function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label?: string; id?: string }) {
  return <UIToggle checked={checked} onChange={onChange} label={label} id={id} />;
}

/* ---------- component ---------- */
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

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" || e.key === "Esc") doClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [restro]);

  // If no restro prop, try to fetch by parsing URL /restros/:code/edit
  useEffect(() => {
    async function fetchRestro(code: string) {
      try {
        const res = await fetch(`/api/restros/${encodeURIComponent(String(code))}`);
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Fetch failed (${res.status})`);
        }
        const json = await res.json().catch(() => null);
        const row = json?.row ?? json ?? null;
        if (row) setRestro(row);
      } catch (err) {
        console.warn("Restro fetch error", err);
        setError("Failed to load outlet data.");
      }
    }

    if (!restro) {
      try {
        const path = typeof window !== "undefined" ? window.location.pathname : "";
        const match = path.match(/\/restros\/([^\/]+)\/edit/);
        if (match && match[1]) fetchRestro(decodeURIComponent(match[1]));
      } catch (e) {
        // ignore
      }
    }
  }, [restro]);

  // Load stations if not provided
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

  // Populate local state from restro
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
      EmailAddressName1: restro?.EmailAddressName1 ?? "",
      EmailsforOrdersReceiving1: restro?.EmailsforOrdersReceiving1 ?? "",
      EmailsforOrdersStatus1: restro?.EmailsforOrdersStatus1 ?? "OFF",
      EmailAddressName2: restro?.EmailAddressName2 ?? "",
      EmailsforOrdersReceiving2: restro?.EmailsforOrdersReceiving2 ?? "",
      EmailsforOrdersStatus2: restro?.EmailsforOrdersStatus2 ?? "OFF",
      WhatsappMobileNumberName1: restro?.WhatsappMobileNumberName1 ?? "",
      WhatsappMobileNumberforOrderDetails1: restro?.WhatsappMobileNumberforOrderDetails1 ?? "",
      WhatsappMobileNumberStatus1: restro?.WhatsappMobileNumberStatus1 ?? "OFF",
      WhatsappMobileNumberName2: restro?.WhatsappMobileNumberName2 ?? "",
      WhatsappMobileNumberforOrderDetails2: restro?.WhatsappMobileNumberforOrderDetails2 ?? "",
      WhatsappMobileNumberStatus2: restro?.WhatsappMobileNumberStatus2 ?? "OFF",
      WhatsappMobileNumberName3: restro?.WhatsappMobileNumberName3 ?? "",
      WhatsappMobileNumberforOrderDetails3: restro?.WhatsappMobileNumberforOrderDetails3 ?? "",
      WhatsappMobileNumberStatus3: restro?.WhatsappMobileNumberStatus3 ?? "OFF",
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

      const text = await res.text().catch(() => "");
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (!res.ok) {
        throw new Error((json?.error?.message ?? json?.error ?? text) || `Update failed (${res.status})`);
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

  const stationDisplay = buildStationDisplay({ ...restro, ...local });

  const restroCode =
    (local && (local.RestroCode ?? local.restro_code ?? local.id ?? local.code)) ||
    (restro && (restro.RestroCode ?? restro.restro_code ?? restro.RestroId ?? restro.restro_id ?? restro.code)) ||
    "";

  function collectValidationErrors(obj: any) {
    const errs: string[] = [];

    for (const key of Object.keys(obj)) {
      const low = key.toLowerCase();
      const val = obj[key];

      if (val === undefined || val === null) continue;
      if (typeof val === "string" && val.trim() === "") continue;

      if (low.includes("name")) continue;
      if (low.includes("status") || low.includes("enabled") || low.endsWith("_status") || low.endsWith("_enabled")) continue;

      if (low.includes("email") || low.includes("emailsfor") || low.includes("emailaddress")) {
        if (typeof val !== "string") {
          errs.push(`${key}: expected text (email), got ${typeof val}`);
          continue;
        }
        const s = val.trim();
        if (s === "") continue;
        if (!validateEmailString(s)) {
          errs.push(`${key}: invalid email(s) => "${s}"`);
        }
        continue;
      }

      if (low.includes("whatsapp") || low.includes("mobile") || low.includes("phone") || low.includes("contact")) {
        const s = String(val).trim();
        if (s === "") continue;
        if (/\d/.test(s)) {
          const cleaned = s.replace(/\D/g, "");
          if (!tenDigitRegex.test(cleaned)) {
            errs.push(`${key}: invalid phone number(s) => "${s}". Expect 10-digit numeric.`);
          }
        }
        continue;
      }
    }

    return errs;
  }

  const validationErrors = useMemo(() => collectValidationErrors(local), [local]);

  const primaryContactValid = useMemo(() => {
    const email1 = (local.EmailsforOrdersReceiving1 ?? "").toString().trim();
    const mobile1 = (local.WhatsappMobileNumberforOrderDetails1 ?? "").toString().replace(/\D/g, "");
    return (email1 && validateEmailString(email1)) || (mobile1 && tenDigitRegex.test(mobile1));
  }, [local]);

  const saveDisabled = saving || validationErrors.length > 0 || !primaryContactValid;

  async function handleSave() {
    setNotification(null);
    setError(null);

    const validationErrorsNow = collectValidationErrors(local);
    if (validationErrorsNow.length) {
      setNotification({ type: "error", text: `Validation failed:\n• ${validationErrorsNow.join("\n• ")}` });
      return;
    }

    if (!primaryContactValid) {
      setNotification({ type: "error", text: `Please provide a valid Email 1 or a 10-digit Mobile 1 before saving.` });
      return;
    }

    if (!restroCode) {
      setNotification({ type: "error", text: "Missing RestroCode — cannot save." });
      return;
    }

    setSavingInternal(true);
    try {
      const allowed = [
        "EmailAddressName1", "EmailsforOrdersReceiving1", "EmailsforOrdersStatus1",
        "EmailAddressName2", "EmailsforOrdersReceiving2", "EmailsforOrdersStatus2",
        "WhatsappMobileNumberName1", "WhatsappMobileNumberforOrderDetails1", "WhatsappMobileNumberStatus1",
        "WhatsappMobileNumberName2", "WhatsappMobileNumberforOrderDetails2", "WhatsappMobileNumberStatus2",
        "WhatsappMobileNumberName3", "WhatsappMobileNumberforOrderDetails3", "WhatsappMobileNumberStatus3",
      ];

      const payload: any = {};
      for (const k of allowed) {
        let v = local && local[k];
        if (v === undefined || v === null) continue;
        if (typeof v === "string") {
          v = v.trim();
          if (v === "") continue;
        }
        if (k.toLowerCase().includes("whatsapp") && k.toLowerCase().includes("orderdetails")) {
          v = String(v).replace(/\D/g, "").slice(0, 10);
          if (v === "") continue;
        }
        payload[k] = v;
      }

      if (Object.keys(payload).length === 0) {
        setNotification({ type: "success", text: "Save completed (no changes applied)." });
        setSavingInternal(false);
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      const result = await defaultPatch(payload);

      if (!result.ok) {
        throw new Error(result.error ?? "Update failed");
      }

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

  // common props passed to child tabs
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
        {/* Header */}
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

          {/* Tabs row */}
          <div style={{ background: "#fafafa", borderBottom: "1px solid #eee" }}>
            <div style={{ display: "flex", gap: 6, padding: "8px 12px", overflowX: "auto" }}>
              {TAB_NAMES.map((t) => (
                <div
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    borderBottom: activeTab === t ? "3px solid #0ea5e9" : "3px solid transparent",
                    fontWeight: activeTab === t ? 700 : 500,
                    color: activeTab === t ? "#0ea5e9" : "#333",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", color: activeTab === t ? "#0ea5e9" : "#666" }} />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notification */}
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

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>{renderTab()}</div>

        {/* Footer */}
        <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 8, background: "#fff", alignItems: "center" }}>
          <div style={{ color: "#666", fontSize: 13 }}>
            {validationErrors.length > 0 && <div style={{ color: "#b91c1c" }}>Validation: {validationErrors[0]}{validationErrors.length>1?` (+${validationErrors.length-1} more)`: ""}</div>}
            {!primaryContactValid && <div style={{ color: "#b91c1c" }}>Provide a valid Email 1 or a 10-digit Mobile 1 to enable Save.</div>}
          </div>

          <div>
            {error && <div style={{ color: "red", marginRight: 12, display: "inline-block" }}>{error}</div>}
            <button onClick={doClose} className="px-3 py-2 border rounded mr-2" style={{ background: "#fff", color: "#333", border: "1px solid #e3e3e3" }}>
              Cancel
            </button>

            <SubmitButton onClick={handleSave} disabled={saveDisabled as boolean}>
              {saving ? "Saving..." : "Save"}
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  );
}
