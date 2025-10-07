// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useCallback } from "react";
import TabContainer from "@/components/TabContainer";

type CommonProps = {
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

function defaultInput({ label, value, onChange, placeholder, type = "text", maxLength }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 600 }}>{label}</div>}
      <input
        value={value ?? ""}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid #e6e6e6",
          outline: "none",
          fontSize: 14,
          height: 40,
        }}
      />
    </div>
  );
}

export default function ContactsTab(props: CommonProps) {
  const {
    local = {},
    updateField,
    InputWithIcon,
    Toggle,
    validators = {},
  } = props;

  const Input = InputWithIcon ? InputWithIcon : defaultInput;

  const ToggleComp = Toggle
    ? Toggle
    : ({ checked, onChange, label }: any) => (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 20, height: 20 }} />
          {label && <span style={{ fontSize: 13 }}>{label}</span>}
        </label>
      );

  const sanitizePhone = useCallback((raw: any) => {
    if (raw === undefined || raw === null) return "";
    const cleaned = String(raw).replace(/\D/g, "").slice(0, 10);
    return cleaned;
  }, []);

  const handleToggle = useCallback(
    (field: string, checked: boolean) => {
      const val = checked ? "ON" : "OFF";
      console.debug(`[ContactsTab] toggle ${field} => ${val}`);
      updateField(field, val);
    },
    [updateField]
  );

  return (
    <TabContainer title="Contacts" kicker="Contacts — Emails (max 2) & WhatsApp (max 3)">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ borderBottom: "1px solid #eee", paddingBottom: 14, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
            {/* Email 1 */}
            <div>
              <Input label="Name 1" value={local.EmailAddressName1 ?? ""} onChange={(v: any) => updateField("EmailAddressName1", v)} placeholder="Name 1" />
            </div>
            <div>
              <Input label="Email 1" value={local.EmailsforOrdersReceiving1 ?? ""} onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)} type="email" placeholder="email1@example.com" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <ToggleComp checked={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON"} onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus1", c)} label={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"} />
            </div>

            {/* Email 2 */}
            <div>
              <Input label="Name 2" value={local.EmailAddressName2 ?? ""} onChange={(v: any) => updateField("EmailAddressName2", v)} placeholder="Name 2" />
            </div>
            <div>
              <Input label="Email 2" value={local.EmailsforOrdersReceiving2 ?? ""} onChange={(v: any) => updateField("EmailsforOrdersReceiving2", v)} type="email" placeholder="email2@example.com" />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <ToggleComp checked={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON"} onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus2", c)} label={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"} />
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 8, color: "#666", fontSize: 13 }}>Manage WhatsApp contacts for order updates. Toggle ON to enable notifications.</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center", marginTop: 8 }}>
            {/* WA 1 */}
            <div>
              <Input label="Name 1" value={local.WhatsappMobileNumberName1 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberName1", v)} placeholder="Name 1" />
            </div>
            <div>
              <Input label="Mobile 1" value={local.WhatsappMobileNumberforOrderDetails1 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))} placeholder="10-digit mobile" type="phone" maxLength={10} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <ToggleComp checked={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON"} onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus1", c)} label={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"} />
            </div>

            {/* WA 2 */}
            <div>
              <Input label="Name 2" value={local.WhatsappMobileNumberName2 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberName2", v)} placeholder="Name 2" />
            </div>
            <div>
              <Input label="Mobile 2" value={local.WhatsappMobileNumberforOrderDetails2 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))} placeholder="10-digit mobile" type="phone" maxLength={10} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <ToggleComp checked={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON"} onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus2", c)} label={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"} />
            </div>

            {/* WA 3 */}
            <div>
              <Input label="Name 3" value={local.WhatsappMobileNumberName3 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberName3", v)} placeholder="Name 3" />
            </div>
            <div>
              <Input label="Mobile 3" value={local.WhatsappMobileNumberforOrderDetails3 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))} placeholder="10-digit mobile" type="phone" maxLength={10} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <ToggleComp checked={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON"} onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus3", c)} label={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON" ? "ON" : "OFF"} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* small helper grid adjustments */
        @media (max-width:900px) {
          div[style*="grid-template-columns: 1fr 1fr 120px"] { grid-template-columns: 1fr 140px !important; }
        }
      `}</style>
    </TabContainer>
  );
}
