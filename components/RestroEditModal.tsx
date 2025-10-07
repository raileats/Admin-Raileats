// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase as supabaseBrowser } from "@/lib/supabaseBrowser";

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

type FssaiEntry = {
  id: string; // UI id
  number: string;
  expiry?: string | null; // ISO date string
  active: boolean;
  createdAt?: string;
};

type GstEntry = {
  id: string;
  number: string;
  expiry?: string | null;
  active: boolean;
  createdAt?: string;
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
  basic: <span style={{ display: "inline-block", width: 16 }}>🔹</span>,
  settings: <span style={{ display: "inline-block", width: 16 }}>⚙️</span>,
  docs: <span style={{ display: "inline-block", width: 16 }}>📄</span>,
  contacts: <span style={{ display: "inline-block", width: 16 }}>👥</span>,
  bank: <span style={{ display: "inline-block", width: 16 }}>🏦</span>,
  calendar: <span style={{ display: "inline-block", width: 16 }}>📅</span>,
  menu: <span style={{ display: "inline-block", width: 16 }}>☰</span>,
};

function safeGet(obj: any, ...keys: string[]) {
  for (const k of keys) {
    if (!obj) continue;
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

/* minimal validators */
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

/* InputWithIcon (kept same-ish) */
function InputWithIcon({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  maxLength,
}: any) {
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
          {type === "email" && "Please enter a valid email."}
          {type === "phone" && "Enter a 10-digit mobile number."}
          {type === "whatsapp" && "Enter a 10-digit WhatsApp number."}
          {type === "name" && "Please enter a name."}
        </div>
      )}
    </div>
  );
}

/* Toggle component */
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

  // FSSAI / GST UI lists
  const [fssaiList, setFssaiList] = useState<FssaiEntry[]>([]);
  const [gstList, setGstList] = useState<GstEntry[]>([]);

  // add modal
  const [addModalType, setAddModalType] = useState<null | "fssai" | "gst">(null);
  const [newNumber, setNewNumber] = useState("");
  const [newExpiry, setNewExpiry] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (restroProp) setRestro(restroProp);
  }, [restroProp]);

  // hydrate local and fssai/gst lists from restro when restro changes
  useEffect(() => {
    if (!restro) return;

    // populate local fields (existing code)
    const baseLocal = {
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
      OwnerName: safeGet(restro, "OwnerName", "owner_name") ?? "",
      OwnerPhone: safeGet(restro, "OwnerPhone", "owner_phone") ?? "",
      RestroDisplayPhoto: safeGet(restro, "RestroDisplayPhoto", "restro_display_photo") ?? "",
      BrandName: safeGet(restro, "BrandName", "brand_name") ?? "",
      RestroEmail: safeGet(restro, "RestroEmail", "restro_email") ?? "",
      RestroPhone: safeGet(restro, "RestroPhone", "restro_phone") ?? "",
      // keep any existing fields
      ...restro,
    };

    setLocal(baseLocal);

    // Try to read pre-stored history fields that your DB might have (common names)
    // If no history exists, create single-entry lists from common single fields
    try {
      const maybeFssaiHistory =
        restro?.FSSAIHistory ||
        restro?.fssai_history ||
        restro?.fssai_list ||
        restro?.FSSAIList ||
        null;

      if (Array.isArray(maybeFssaiHistory) && maybeFssaiHistory.length) {
        const mapped = maybeFssaiHistory.map((x: any, idx: number) => ({
          id: String(x.id ?? idx),
          number: String(x.number ?? x.fssai_no ?? x.FSSAI ?? ""),
          expiry: x.expiry ?? x.expiry_at ?? x.expiry_date ?? null,
          active: !!x.active,
          createdAt: x.createdAt ?? x.created_at ?? undefined,
        }));
        setFssaiList(mapped);
      } else {
        // fallback: single fields
        const singleNumber =
          safeGet(restro, "FSSAINo", "FSSAINumber", "fssai_no", "fssai_number") ??
          safeGet(restro, "FSSAI_Number", "FSSAI");
        const singleExpiry = safeGet(restro, "FSSAIExpiry", "fssai_expiry", "FSSAI_Expiry", "fssai_expiry_date") ?? null;
        if (singleNumber) {
          setFssaiList([
            {
              id: "f1",
              number: String(singleNumber),
              expiry: singleExpiry ?? null,
              active: true,
              createdAt: undefined,
            },
          ]);
        } else {
          setFssaiList([]);
        }
      }
    } catch (e) {
      setFssaiList([]);
    }

    // GST list - attempt similar hydrate
    try {
      const maybeGstHistory = restro?.GSTHistory || restro?.gst_history || restro?.gst_list || null;
      if (Array.isArray(maybeGstHistory) && maybeGstHistory.length) {
        const mapped = maybeGstHistory.map((x: any, idx: number) => ({
          id: String(x.id ?? idx),
          number: String(x.number ?? x.gst_no ?? x.GST ?? ""),
          expiry: x.expiry ?? x.expiry_at ?? x.expiry_date ?? null,
          active: !!x.active,
          createdAt: x.createdAt ?? x.created_at ?? undefined,
        }));
        setGstList(mapped);
      } else {
        const singleGst =
          safeGet(restro, "GSTNo", "GSTNumber", "gst_no", "gst_number") ??
          safeGet(restro, "GST_Number", "GST");
        const singleGstExpiry = safeGet(restro, "GSTExpiry", "gst_expiry") ?? null;
        if (singleGst) {
          setGstList([
            {
              id: "g1",
              number: String(singleGst),
              expiry: singleGstExpiry ?? null,
              active: true,
              createdAt: undefined,
            },
          ]);
        } else {
          setGstList([]);
        }
      }
    } catch (e) {
      setGstList([]);
    }
  }, [restro]);

  const saving = parentSaving ?? savingInternal;

  const updateField = useCallback((key: string, value: any) => {
    setLocal((s: any) => ({ ...s, [key]: value }));
    setError(null);
    setNotification(null);
  }, []);

  // small helper to generate ids
  function makeId(prefix = "") {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Add new fssai / gst handlers (UI-level)
  function openAddModal(type: "fssai" | "gst") {
    setNewNumber("");
    setNewExpiry(null);
    setAddModalType(type);
  }
  function closeAddModal() {
    setAddModalType(null);
    setNewNumber("");
    setNewExpiry(null);
  }

  function saveNewFssai() {
    if (!newNumber || newNumber.trim() === "") {
      setNotification({ type: "error", text: "Enter FSSAI number" });
      return;
    }
    // mark existing active as inactive
    const updated = fssaiList.map((f) => ({ ...f, active: false }));
    const entry: FssaiEntry = {
      id: makeId("fssai_"),
      number: newNumber.trim(),
      expiry: newExpiry ?? null,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setFssaiList([...updated, entry]);

    // update local so handleSave sends this active FSSAI fields to backend
    updateField("FSSAINumber", entry.number);
    updateField("FSSAIExpiry", entry.expiry ?? "");

    setNotification({ type: "success", text: "New FSSAI added (local)." });
    closeAddModal();
  }

  function saveNewGst() {
    if (!newNumber || newNumber.trim() === "") {
      setNotification({ type: "error", text: "Enter GST number" });
      return;
    }
    const updated = gstList.map((g) => ({ ...g, active: false }));
    const entry: GstEntry = {
      id: makeId("gst_"),
      number: newNumber.trim(),
      expiry: newExpiry ?? null,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setGstList([...updated, entry]);

    updateField("GSTNumber", entry.number);
    updateField("GSTExpiry", entry.expiry ?? "");

    setNotification({ type: "success", text: "New GST added (local)." });
    closeAddModal();
  }

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

      let text = "";
      try {
        text = await res.text();
      } catch (e) {
        text = "";
      }

      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      const possibleError = json?.error?.message ?? json?.error ?? text;
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

      // include active fssai/gst values explicitly so backend can store them
      const activeF = fssaiList.find((f) => f.active);
      if (activeF) {
        payload.FSSAINumber = activeF.number;
        payload.FSSAIExpiry = activeF.expiry ?? null;
      }
      const activeG = gstList.find((g) => g.active);
      if (activeG) {
        payload.GSTNumber = activeG.number;
        payload.GSTExpiry = activeG.expiry ?? null;
      }

      // OPTIONAL: add the whole history arrays as JSON fields so backend can persist
      try {
        payload.FSSAIHistory = JSON.stringify(fssaiList);
      } catch {}
      try {
        payload.GSTHistory = JSON.stringify(gstList);
      } catch {}

      // remove nested objects from payload for safety
      for (const k of Object.keys(payload)) {
        if (typeof payload[k] === "object" && payload[k] !== null) delete payload[k];
      }

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
    // pass fssai/gst UI state & helpers to child tabs if they want to consume
    fssaiList,
    gstList,
    openAddModal,
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
        // wrap AddressDocsClient with FSSAI/GST listing UI and add-button
        return (
          <div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
              {/* FSSAI card */}
              <div style={{ flex: 1, background: "#fff", border: "1px solid #f1f1f1", borderRadius: 8, padding: 14, boxShadow: "0 6px 18px rgba(11,15,30,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700 }}>FSSAI</div>
                  <button onClick={() => openAddModal("fssai")} style={{ background: "#06b6d4", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
                    Add New FSSAI
                  </button>
                </div>
                {fssaiList.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>No FSSAI on record</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {fssaiList.map((f) => (
                      <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{f.number}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{f.expiry ? `Expiry: ${f.expiry}` : "No expiry"}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 12, color: f.active ? "#065f46" : "#6b7280", fontWeight: 700 }}>{f.active ? "Active" : "Inactive"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* GST card */}
              <div style={{ flex: 1, background: "#fff", border: "1px solid #f1f1f1", borderRadius: 8, padding: 14, boxShadow: "0 6px 18px rgba(11,15,30,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700 }}>GST</div>
                  <button onClick={() => openAddModal("gst")} style={{ background: "#06b6d4", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}>
                    Add New GST
                  </button>
                </div>
                {gstList.length === 0 ? (
                  <div style={{ color: "#6b7280" }}>No GST on record</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {gstList.map((g) => (
                      <div key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{g.number}</div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>{g.expiry ? `Expiry: ${g.expiry}` : "No expiry"}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 12, color: g.active ? "#065f46" : "#6b7280", fontWeight: 700 }}>{g.active ? "Active" : "Inactive"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* actual AddressDocs component */}
            <AddressDocsClient initialData={restro} imagePrefix={process.env.NEXT_PUBLIC_IMAGE_PREFIX ?? ""} />
          </div>
        );
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

  // active FSSAI & GST summary for Basic Information tab
  const activeFssai = fssaiList.find((f) => f.active);
  const activeGst = gstList.find((g) => g.active);

  return (
    <div
      className="restro-modal-root"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        zIndex: 1100,
        fontFamily: "Arial, Helvetica, sans-serif",
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
          {/* When Basic Information is active show small non-editable summary of active FSSAI/GST */}
          {activeTab === "Basic Information" && (
            <div style={{ maxWidth: 1200, margin: "0 auto 18px", display: "flex", gap: 12 }}>
              <div style={{ flex: 1, background: "#fff", border: "1px solid #f3f3f3", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Current FSSAI</div>
                {activeFssai ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 700 }}>{activeFssai.number}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>{activeFssai.expiry ? `Expiry: ${activeFssai.expiry}` : "No expiry"}</div>
                  </div>
                ) : (
                  <div style={{ color: "#6b7280", marginTop: 6 }}>No FSSAI set</div>
                )}
              </div>
              <div style={{ flex: 1, background: "#fff", border: "1px solid #f3f3f3", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Current GST</div>
                {activeGst ? (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 700 }}>{activeGst.number}</div>
                    <div style={{ color: "#6b7280", fontSize: 13 }}>{activeGst.expiry ? `Expiry: ${activeGst.expiry}` : "No expiry"}</div>
                  </div>
                ) : (
                  <div style={{ color: "#6b7280", marginTop: 6 }}>No GST set</div>
                )}
              </div>
            </div>
          )}

          <div className="tab-content" style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
            {renderTab()}
          </div>
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

      {/* Add FSSAI / GST modal (simple) */}
      {addModalType && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={closeAddModal} />
          <div style={{ background: "#fff", padding: 18, width: 480, borderRadius: 8, boxShadow: "0 10px 40px rgba(0,0,0,0.15)", zIndex: 1301 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{addModalType === "fssai" ? "Add New FSSAI" : "Add New GST"}</div>
              <button onClick={closeAddModal} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#374151" }}>{addModalType === "fssai" ? "FSSAI Number" : "GST Number"}</label>
              <input value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="Enter number" style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e6e6e6" }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#374151" }}>Expiry date (optional)</label>
              <input type="date" value={newExpiry ?? ""} onChange={(e) => setNewExpiry(e.target.value || null)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #e6e6e6" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={closeAddModal} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #e6e6e6", background: "#fff" }}>Cancel</button>
              <button
                onClick={() => {
                  if (addModalType === "fssai") saveNewFssai();
                  else saveNewGst();
                }}
                style={{ padding: "8px 12px", borderRadius: 6, border: "none", background: "#0ea5e9", color: "#fff" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .restro-modal-root { font-family: Arial, Helvetica, sans-serif; }
        .tab-content { box-sizing: border-box; padding: 6px; }
        input, select, textarea, button { font-family: inherit; font-size: 14px; }
      `}</style>
    </div>
  );
}
