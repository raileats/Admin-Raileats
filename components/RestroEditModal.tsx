// components/RestroEditModal.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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

/* small Input */
function TextInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{label}</div>}
      <input
        value={value ?? ""}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        inputMode={inputMode}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #e6e6e6",
          outline: "none",
          fontSize: 14,
        }}
      />
    </div>
  );
}

/* Toggle component (simple) */
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
    if (!restro) return;
    setLocal({
      RestroName: safeGet(restro, "RestroName", "restro_name", "name") ?? "",
      RestroCode: safeGet(restro, "RestroCode", "restro_code", "code", "RestroId", "restro_id") ?? "",
      // Emails: only 2
      EmailAddressName1: restro?.EmailAddressName1 ?? "",
      EmailsforOrdersReceiving1: restro?.EmailsforOrdersReceiving1 ?? "",
      EmailsforOrdersStatus1: restro?.EmailsforOrdersStatus1 ?? "OFF",
      EmailAddressName2: restro?.EmailAddressName2 ?? "",
      EmailsforOrdersReceiving2: restro?.EmailsforOrdersReceiving2 ?? "",
      EmailsforOrdersStatus2: restro?.EmailsforOrdersStatus2 ?? "OFF",
      // WhatsApp: 3 entries
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

  const restroCode =
    (local && (local.RestroCode ?? local.restro_code ?? local.id ?? local.code)) ||
    (restro && (restro.RestroCode ?? restro.restro_code ?? restro.RestroId ?? restro.restro_id ?? restro.code)) ||
    "";

  // Validation: only validate populated emails & phones
  function collectValidationErrors(obj: any) {
    const errs: string[] = [];

    for (const key of Object.keys(obj)) {
      const low = key.toLowerCase();
      const val = obj[key];

      if (val === undefined || val === null) continue;
      if (typeof val === "string" && val.trim() === "") continue;

      // skip name fields
      if (low.includes("name")) continue;

      // skip status/enabled fields
      if (low.includes("status") || low.includes("enabled") || low.endsWith("_status") || low.endsWith("_enabled")) continue;

      // email-like keys
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

      // phone/whatsapp keys
      if (low.includes("whatsapp") || low.includes("mobile") || low.includes("phone") || low.includes("contact")) {
        const s = String(val).trim();
        if (s === "") continue;
        if (/\d/.test(s)) {
          // allow only digits and exact 10 digits
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

  // defaultPatch: calls your server-side API (/api/restros/[code]) which should use service_role
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
        throw new Error(json?.error?.message ?? json?.error ?? text || `Update failed (${res.status})`);
      }
      return { ok: true, row: json?.row ?? json?.data ?? json ?? null };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? String(err) };
    }
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
      // Build payload using whitelist (must match server whitelist)
      const allowed = [
        "EmailAddressName1", "EmailsforOrdersReceiving1", "EmailsforOrdersStatus1",
        "EmailAddressName2", "EmailsforOrdersReceiving2", "EmailsforOrdersStatus2",
        "WhatsappMobileNumberName1", "WhatsappMobileNumberforOrderDetails1", "WhatsappMobileNumberStatus1",
        "WhatsappMobileNumberName2", "WhatsappMobileNumberforOrderDetails2", "WhatsappMobileNumberStatus2",
        "WhatsappMobileNumberName3", "WhatsappMobileNumberforOrderDetails3", "WhatsappMobileNumberStatus3",
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

  /* ---------- Contacts panel (internal) ---------- */
  function ContactsPanel() {
    // helpers to sanitize phone to digits and max 10
    const sanitizePhone = (s: any) => {
      if (!s && s !== 0) return "";
      const cleaned = String(s).replace(/\D/g, "").slice(0, 10);
      return cleaned;
    };

    return (
      <div>
        <h3>Emails</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
          {/* Email 1 */}
          <div>
            <TextInput
              label="Name 1"
              value={local.EmailAddressName1 ?? ""}
              onChange={(v) => updateField("EmailAddressName1", v)}
              placeholder="Name 1"
            />
          </div>
          <div>
            <TextInput
              label="Email 1"
              value={local.EmailsforOrdersReceiving1 ?? ""}
              onChange={(v) => updateField("EmailsforOrdersReceiving1", v)}
              placeholder="email1@example.com"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Toggle
              checked={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON"}
              onChange={(v) => updateField("EmailsforOrdersStatus1", v ? "ON" : "OFF")}
              label={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>

          {/* Email 2 */}
          <div>
            <TextInput
              label="Name 2"
              value={local.EmailAddressName2 ?? ""}
              onChange={(v) => updateField("EmailAddressName2", v)}
              placeholder="Name 2"
            />
          </div>
          <div>
            <TextInput
              label="Email 2"
              value={local.EmailsforOrdersReceiving2 ?? ""}
              onChange={(v) => updateField("EmailsforOrdersReceiving2", v)}
              placeholder="email2@example.com"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Toggle
              checked={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON"}
              onChange={(v) => updateField("EmailsforOrdersStatus2", v ? "ON" : "OFF")}
              label={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>
        </div>

        <hr style={{ margin: "18px 0" }} />

        <h3>WhatsApp numbers</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
          {/* WA 1 */}
          <div>
            <TextInput
              label="Name 1"
              value={local.WhatsappMobileNumberName1 ?? ""}
              onChange={(v) => updateField("WhatsappMobileNumberName1", v)}
              placeholder="Name 1"
            />
          </div>
          <div>
            <TextInput
              label="Mobile 1"
              value={local.WhatsappMobileNumberforOrderDetails1 ?? ""}
              onChange={(v) => updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))}
              placeholder="10-digit mobile"
              maxLength={10}
              inputMode="numeric"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Toggle
              checked={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON"}
              onChange={(v) => updateField("WhatsappMobileNumberStatus1", v ? "ON" : "OFF")}
              label={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>

          {/* WA 2 */}
          <div>
            <TextInput
              label="Name 2"
              value={local.WhatsappMobileNumberName2 ?? ""}
              onChange={(v) => updateField("WhatsappMobileNumberName2", v)}
              placeholder="Name 2"
            />
          </div>
          <div>
            <TextInput
              label="Mobile 2"
              value={local.WhatsappMobileNumberforOrderDetails2 ?? ""}
              onChange={(v) => updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))}
              placeholder="10-digit mobile"
              maxLength={10}
              inputMode="numeric"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Toggle
              checked={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON"}
              onChange={(v) => updateField("WhatsappMobileNumberStatus2", v ? "ON" : "OFF")}
              label={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>

          {/* WA 3 */}
          <div>
            <TextInput
              label="Name 3"
              value={local.WhatsappMobileNumberName3 ?? ""}
              onChange={(v) => updateField("WhatsappMobileNumberName3", v)}
              placeholder="Name 3"
            />
          </div>
          <div>
            <TextInput
              label="Mobile 3"
              value={local.WhatsappMobileNumberforOrderDetails3 ?? ""}
              onChange={(v) => updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))}
              placeholder="10-digit mobile"
              maxLength={10}
              inputMode="numeric"
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <Toggle
              checked={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON"}
              onChange={(v) => updateField("WhatsappMobileNumberStatus3", v ? "ON" : "OFF")}
              label={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>
        </div>
      </div>
    );
  }

  // renderTab: we still allow other tabs to be placeholders (child components can be added later)
  const renderTab = () => {
    switch (activeTab) {
      case "Contacts":
        return <ContactsPanel />;
      case "Basic Information":
        return <div>Basic Information tab (not changed)</div>;
      case "Station Settings":
        return <div>Station Settings tab (not changed)</div>;
      case "Address & Documents":
        return <div>Address & Documents tab (not changed)</div>;
      case "Bank":
        return <div>Bank tab (not changed)</div>;
      case "Future Closed":
        return <div>Future Closed tab (not changed)</div>;
      case "Menu":
        return <div>Menu tab (not changed)</div>;
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
      <div style={{ background: "#fff", width: "98%", height: "98%", maxWidth: 1400, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 1200, background: "#fff", borderBottom: "1px solid #e9e9e9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px" }}>
            <div style={{ fontWeight: 700 }}>
              <div style={{ fontSize: 15 }}>
                {String(local.RestroCode ?? restro?.RestroCode ?? "")}
                {(local.RestroName ?? restro?.RestroName) ? " / " : ""}{local.RestroName ?? restro?.RestroName ?? ""}
              </div>
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
    </div>
  );
}
