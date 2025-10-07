// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useCallback } from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  restroCode?: string;
  InputWithIcon?: any;
  Toggle?: any;
  validators?: {
    validateEmailString?: (s: string) => boolean;
    validatePhoneString?: (s: string) => boolean;
  };
};

export default function ContactsTab({
  local = {},
  updateField,
  InputWithIcon,
  Toggle,
  validators = {},
}: Props) {
  // fallback simple Input (used when parent didn't pass InputWithIcon)
  const Input = InputWithIcon
    ? InputWithIcon
    : ({ label, value, onChange, type = "text", placeholder = "", maxLength }: any) => (
        <div style={{ marginBottom: 12 }}>
          {label && <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{label}</div>}
          <input
            className="restro-input"
            value={value ?? ""}
            placeholder={placeholder ?? ""}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            inputMode={type === "phone" || type === "whatsapp" ? "numeric" : "text"}
            style={{ fontSize: 14 }}
          />
        </div>
      );

  // fallback Toggle (simple button-like) if parent didn't pass a Toggle component
  const ToggleComp = Toggle
    ? Toggle
    : ({ checked, onChange, label }: any) => (
        <div className="restro-toggle">
          <button
            type="button"
            onClick={() => onChange(!checked)}
            style={{
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #e6e6e6",
              background: checked ? "#0ea5e9" : "#fff",
              color: checked ? "#fff" : "#333",
            }}
          >
            {checked ? "ON" : "OFF"}
          </button>
          {label && <span style={{ color: "#666", fontSize: 13 }}>{label}</span>}
        </div>
      );

  // sanitize phone helper — digits only, max 10
  const sanitizePhone = useCallback((raw: any) => {
    if (raw === undefined || raw === null) return "";
    const cleaned = String(raw).replace(/\D/g, "").slice(0, 10);
    return cleaned;
  }, []);

  // toggle handler: stores "ON" / "OFF"
  const handleToggle = useCallback(
    (field: string, checked: boolean) => {
      const val = checked ? "ON" : "OFF";
      // debug log so you can inspect in console
      // eslint-disable-next-line no-console
      console.debug(`[ContactsTab] toggle ${field} => ${val}`);
      updateField(field, val);
    },
    [updateField]
  );

  return (
    <TabContainer title="Contacts — Emails (max 2) & WhatsApp (max 3)">
      <div className="restro-grid">
        {/* ----- Emails (max 2) ----- */}
        <div>
          <label className="restro-label">Name 1</label>
          <Input
            label=""
            value={local.EmailAddressName1 ?? ""}
            onChange={(v: any) => updateField("EmailAddressName1", v)}
            type="name"
            placeholder="Name 1"
          />
        </div>

        <div>
          <label className="restro-label">Email 1</label>
          <Input
            label=""
            value={local.EmailsforOrdersReceiving1 ?? ""}
            onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)}
            type="email"
            placeholder="email1@example.com"
          />
          <div style={{ marginTop: 8 }}>
            <ToggleComp
              checked={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus1", !!c)}
              label={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>
        </div>

        <div>
          <label className="restro-label">Name 2</label>
          <Input
            label=""
            value={local.EmailAddressName2 ?? ""}
            onChange={(v: any) => updateField("EmailAddressName2", v)}
            type="name"
            placeholder="Name 2"
          />
        </div>

        <div>
          <label className="restro-label">Email 2</label>
          <Input
            label=""
            value={local.EmailsforOrdersReceiving2 ?? ""}
            onChange={(v: any) => updateField("EmailsforOrdersReceiving2", v)}
            type="email"
            placeholder="email2@example.com"
          />
          <div style={{ marginTop: 8 }}>
            <ToggleComp
              checked={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus2", !!c)}
              label={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>
        </div>

        {/* separator row */}
        <div className="restro-row-full" style={{ marginTop: 8 }} />

        {/* ----- WhatsApp (max 3) ----- */}
        <div>
          <label className="restro-label">Name 1</label>
          <Input
            label=""
            value={local.WhatsappMobileNumberName1 ?? ""}
            onChange={(v: any) => updateField("WhatsappMobileNumberName1", v)}
            type="text"
            placeholder="Name 1"
          />
        </div>

        <div>
          <label className="restro-label">Mobile 1</label>
          <Input
            label=""
            value={local.WhatsappMobileNumberforOrderDetails1 ?? ""}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))}
            type="phone"
            placeholder="10-digit mobile"
            maxLength={10}
          />
          <div style={{ marginTop: 8 }}>
            <ToggleComp
              checked={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus1", !!c)}
              label={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>
        </div>

        <div>
          <label className="restro-label">Name 2</label>
          <Input
            label=""
            value={local.WhatsappMobileNumberName2 ?? ""}
            onChange={(v: any) => updateField("WhatsappMobileNumberName2", v)}
            type="text"
            placeholder="Name 2"
          />
        </div>

        <div>
          <label className="restro-label">Mobile 2</label>
          <Input
            label=""
            value={local.WhatsappMobileNumberforOrderDetails2 ?? ""}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))}
            type="phone"
            placeholder="10-digit mobile"
            maxLength={10}
          />
          <div style={{ marginTop: 8 }}>
            <ToggleComp
              checked={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus2", !!c)}
              label={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>
        </div>

        <div>
          <label className="restro-label">Name 3</label>
          <Input
            label=""
            value={local.WhatsappMobileNumberName3 ?? ""}
            onChange={(v: any) => updateField("WhatsappMobileNumberName3", v)}
            type="text"
            placeholder="Name 3"
          />
        </div>

        <div>
          <label className="restro-label">Mobile 3</label>
          <Input
            label=""
            value={local.WhatsappMobileNumberforOrderDetails3 ?? ""}
            onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))}
            type="phone"
            placeholder="10-digit mobile"
            maxLength={10}
          />
          <div style={{ marginTop: 8 }}>
            <ToggleComp
              checked={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus3", !!c)}
              label={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </div>
        </div>

        <div className="restro-row-full">
          <div className="restro-note">
            Tip: Only two email contacts (1–2) and three WhatsApp contacts (1–3) are supported.
            Mobile numbers accept digits only and are truncated to 10 digits automatically.
          </div>
        </div>
      </div>
    </TabContainer>
  );
}
