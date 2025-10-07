// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// your existing tab components (ensure these files exist)
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

/* ---------- small reusable UI (Input, Toggle) ---------- */
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
          {type === "phone" && "Enter a 10-digit numeric mobile number (no spaces). For multiple, separate with commas."}
          {type === "whatsapp" && "Enter a 10-digit numeric WhatsApp number (no spaces). For multiple, separate with commas."}
          {type === "name" && "Please enter a name."}
        </div>
      )}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: "none",
          background: checked ? "#06b6d4" : "#e6e6e6",
          cursor: "pointer",
          position: "relative",
          padding: 2,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: checked ? 22 : 2,
            top: 2,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: "#fff",
            transition: "left 120ms ease",
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          }}
        />
      </button>
      {label && <div style={{ fontSize: 13, color: "#444" }}>{label}</div>}
    </div>
  );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restro]);

  // If no restro prop, try to fetch by parsing URL /restros/:code/edit (keeps compatibility)
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
      // emails (only 2 supported in DB)
      EmailAddressName1: restro?.EmailAddressName1 ?? "",
      EmailsforOrdersReceiving1: restro?.EmailsforOrdersReceiving1 ?? "",
      EmailsforOrdersStatus1: restro?.EmailsforOrdersStatus1 ?? "OFF",
      EmailAddressName2: restro?.EmailAddressName2 ?? "",
      EmailsforOrdersReceiving2: restro?.EmailsforOrdersReceiving2 ?? "",
      EmailsforOrdersStatus2: restro?.EmailsforOrdersStatus2 ?? "OFF",
      // whatsapp (up to 3)
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

  // validation: validate only populated email/phone fields
  function collectValidationErrors(obj: any) {
    const errs: string[] = [];

    for (const key of Object.keys(obj)) {
      const low = key.toLowerCase();
      const val = obj[key];

      if (val === undefined || val === null) continue;
      if (typeof val === "string" && val.trim() === "") continue;

      // skip name and status fields
      if (low.includes("name")) continue;
      if (low.includes("status") || low.includes("enabled")) continue;

      // emails
      if (low.includes("email") || low.includes("emailsfor") || low.includes("emailaddress")) {
        if (typeof val !== "string") {
          errs.push(`${key}: expected text (email), got ${typeof val}`);
        } else {
          const s = val.trim();
          if (s && !validateEmailString(s)) errs.push(`${key}: invalid email(s) => "${s}"`);
        }
        continue;
      }

      // phones/whatsapp
      if (low.includes("whatsapp") || low.includes("mobile") || low.includes("phone") || low.includes("contact")) {
        const s = String(val).trim();
        if (s && /\d/.test(s)) {
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
      // Build payload: whitelist only fields that are updatable and present in local
      const allowed = [
        "EmailAddressName1", "EmailsforOrdersReceiving1", "EmailsforOrdersStatus1",
        "EmailAddressName2", "EmailsforOrdersReceiving2", "EmailsforOrdersStatus2",
        "WhatsappMobileNumberName1", "WhatsappMobileNumberforOrderDetails1", "WhatsappMobileNumberStatus1",
        "WhatsappMobileNumberName2", "WhatsappMobileNumberforOrderDetails2", "WhatsappMobileNumberStatus2",
        "WhatsappMobileNumberName3", "WhatsappMobileNumberforOrderDetails3", "WhatsappMobileNumberStatus3",
        // add any more columns you permit
      ];

      const payload: any = {};
      for (const k of allowed) {
        const v = local && local[k];
        if (v === undefined || v === null) continue;
        if (typeof v === "string") {
          if (v.trim() === "") continue;
          payload[k] = v.trim();
        } else {
          payload[k] = v;
        }
      }

      console.log("DEBUG: update payload:", payload);

      if (Object.keys(payload).length === 0) {
        setNotification({ type: "success", text: "Save completed (no changes applied)." });
        setSavingInternal(false);
        setTimeout(() => setNotification(null), 4000);
        return;
      }

      const result = await defaultPatch(payload);
      console.log("DEBUG defaultPatch result:", result);

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
    validators: {
      validateEmailString,
      validatePhoneString,
    },
  };

  // render tab mapping — returns original tab components (child files must exist)
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
                  <span style={{ display: "inline-flex", alignItems: "center", color: activeTab === t ? "#0ea5e9" : "#666" }}>{/* icon could go here */}</span>
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
        <div style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", gap: 8, background: "#fff" }}>
          <div />
          <div>
            {error && <div style={{ color: "red", marginRight: 12, display: "inline-block" }}>{error}</div>}
            <button onClick={doClose} style={{ background: "#fff", color: "#333", border: "1px solid #e3e3e3", padding: "8px 12px", borderRadius: 6, marginRight: 8 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#7fcfe9" : "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600 }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* minimal shared styles (tab components should style their own forms) */
      `}</style>
    </div>
  );
}
