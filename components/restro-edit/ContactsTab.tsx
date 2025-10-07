// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useCallback } from "react";

type CommonProps = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  restroCode?: string;
  InputWithIcon?: any; // component
  Toggle?: any; // component
  validators?: {
    validateEmailString?: (s: string) => boolean;
    validatePhoneString?: (s: string) => boolean;
  };
};

export default function ContactsTab(props: CommonProps) {
  const {
    local = {},
    updateField,
    InputWithIcon,
    Toggle,
    validators = {},
  } = props;

  const validateEmailString = validators.validateEmailString ?? ((s: string) => {
    if (!s) return false;
    const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return false;
    const re = /^\S+@\S+\.\S+$/;
    return parts.every((p) => re.test(p));
  });

  const validatePhoneString = validators.validatePhoneString ?? ((s: string) => {
    if (!s) return false;
    const parts = s.split(",").map((p) => p.replace(/\s+/g, "").trim()).filter(Boolean);
    if (!parts.length) return false;
    return parts.every((p) => /^\d{10}$/.test(p));
  });

  // fallback InputWithIcon component if parent didn't provide one
  const Input = InputWithIcon
    ? InputWithIcon
    : ({ label, value, onChange, type = "text", placeholder = "", maxLength }: any) => (
        <div style={{ marginBottom: 12 }}>
          {label && <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{label}</div>}
          <input
            value={value ?? ""}
            placeholder={placeholder ?? ""}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            inputMode={type === "phone" || type === "whatsapp" ? "numeric" : "text"}
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

  // fallback Toggle component (simple pill) if parent didn't provide one
  const ToggleComp = Toggle
    ? Toggle
    : ({ checked, onChange }: any) => (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!checked}
            onChange={(e) => onChange(e.target.checked)}
            style={{ width: 20, height: 20 }}
          />
          <span style={{ fontSize: 13 }}>{checked ? "ON" : "OFF"}</span>
        </label>
      );

  // helper: get local value with optional default
  const val = useCallback((k: string, d: any = "") => {
    if (!local) return d;
    if (local[k] === undefined || local[k] === null) return d;
    return local[k];
  }, [local]);

  // sanitize phone input: keep digits only and slice to 10
  const sanitizePhone = useCallback((raw: any) => {
    if (raw === undefined || raw === null) return "";
    const cleaned = String(raw).replace(/\D/g, "").slice(0, 10);
    return cleaned;
  }, []);

  // toggle handler: writes "ON"/"OFF" string for backward compatibility OR boolean if you prefer
  // --> we will store boolean true/false (aligning with Toggle in RestroEditModal)
  const handleToggle = useCallback(
    (field: string, checked: boolean) => {
      updateField(field, checked);
    },
    [updateField]
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Contacts</div>
        <div style={{ color: "#6b7280", fontSize: 13 }}>Manage emails & WhatsApp numbers</div>
      </div>

      <h4 style={{ margin: "12px 0 6px 0", fontSize: 14, fontWeight: 700 }}>Emails (max 2)</h4>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
        {/* Email row 1 */}
        <div>
          <Input
            label="Name 1"
            value={val("EmailAddressName1", "")}
            onChange={(v: any) => updateField("EmailAddressName1", v)}
            type="name"
            placeholder="Name 1"
            maxLength={64}
          />
        </div>

        <div>
          <Input
            label="Email 1"
            value={val("EmailsforOrdersReceiving1", "")}
            onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)}
            type="email"
            placeholder="email1@example.com"
            maxLength={256}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <ToggleComp
            checked={Boolean(val("EmailsforOrdersReceiving1Enabled", val("EmailsforOrdersStatus1", false)))}
            onChange={(c: boolean) => handleToggle("EmailsforOrdersReceiving1Enabled", c)}
          />
        </div>

        {/* Email row 2 */}
        <div>
          <Input
            label="Name 2"
            value={val("EmailAddressName2", "")}
            onChange={(v: any) => updateField("EmailAddressName2", v)}
            type="name"
            placeholder="Name 2"
            maxLength={64}
          />
        </div>

        <div>
          <Input
            label="Email 2"
            value={val("EmailsforOrdersReceiving2", "")}
            onChange={(v: any) => updateField("EmailsforOrdersReceiving2", v)}
            type="email"
            placeholder="email2@example.com"
            maxLength={256}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <ToggleComp
            checked={Boolean(val("EmailsforOrdersReceiving2Enabled", val("EmailsforOrdersStatus2", false)))}
            onChange={(c: boolean) => handleToggle("EmailsforOrdersReceiving2Enabled", c)}
          />
        </div>
      </div>

      <hr style={{ margin: "18px 0", border: "none", borderTop: "1px solid #f1f1f1" }} />

      <h4 style={{ margin: "12px 0 6px 0", fontSize: 14, fontWeight: 700 }}>WhatsApp numbers (max 3)</h4>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
        {/* WA 1 */}
        <div>
          <Input
            label="Name 1"
            value={val("WhatsappMobileNumberName1", "")}
            onChange={(v: any) => updateField("WhatsappMobileNumberName1", v)}
            placeholder="Name 1"
            maxLength={64}
          />
        </div>

        <div>
          <Input
            label="Mobile 1"
            value={val("WhatsappMobileNumberforOrderDetails1", "")}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))}
            placeholder="10-digit mobile"
            type="phone"
            maxLength={10}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <ToggleComp
            checked={Boolean(val("WhatsappMobileNumberStatus1", false))}
            onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus1", c)}
          />
        </div>

        {/* WA 2 */}
        <div>
          <Input
            label="Name 2"
            value={val("WhatsappMobileNumberName2", "")}
            onChange={(v: any) => updateField("WhatsappMobileNumberName2", v)}
            placeholder="Name 2"
            maxLength={64}
          />
        </div>

        <div>
          <Input
            label="Mobile 2"
            value={val("WhatsappMobileNumberforOrderDetails2", "")}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))}
            placeholder="10-digit mobile"
            type="phone"
            maxLength={10}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <ToggleComp
            checked={Boolean(val("WhatsappMobileNumberStatus2", false))}
            onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus2", c)}
          />
        </div>

        {/* WA 3 */}
        <div>
          <Input
            label="Name 3"
            value={val("WhatsappMobileNumberName3", "")}
            onChange={(v: any) => updateField("WhatsappMobileNumberName3", v)}
            placeholder="Name 3"
            maxLength={64}
          />
        </div>

        <div>
          <Input
            label="Mobile 3"
            value={val("WhatsappMobileNumberforOrderDetails3", "")}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))}
            placeholder="10-digit mobile"
            type="phone"
            maxLength={10}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <ToggleComp
            checked={Boolean(val("WhatsappMobileNumberStatus3", false))}
            onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus3", c)}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, color: "#666", fontSize: 13 }}>
        Tip: mobile fields accept only digits and are truncated to 10 digits. Toggle shows ON/OFF immediately.
      </div>
    </div>
  );
}
