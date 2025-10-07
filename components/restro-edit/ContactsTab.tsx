// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useCallback } from "react";
import TabContainer from "@/components/TabContainer";

type CommonProps = {
  local?: any;
  updateField: (k: string, v: any) => void;
  InputWithIcon?: any;
  Toggle?: any;
};

export default function ContactsTab(props: CommonProps) {
  const { local = {}, updateField, InputWithIcon, Toggle } = props;

  const sanitizePhone = useCallback((raw: any) => {
    if (raw === undefined || raw === null) return "";
    const cleaned = String(raw).replace(/\D/g, "").slice(0, 10);
    return cleaned;
  }, []);

  const ToggleComp = Toggle
    ? Toggle
    : ({ checked, onChange }: any) => (
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
        </label>
      );

  const Input = InputWithIcon
    ? InputWithIcon
    : ({ label, value, onChange, placeholder = "", type = "text", maxLength }: any) => (
        <div style={{ marginBottom: 12 }}>
          {label && <div style={{ marginBottom: 6, fontSize: 13, fontWeight: 700 }}>{label}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18, color: "#6b21a8" }}>{type === "phone" ? "📞" : type === "email" ? "✉️" : "👤"}</span>
            <input
              value={value ?? ""}
              placeholder={placeholder ?? ""}
              onChange={(e) => onChange(e.target.value)}
              maxLength={maxLength}
              inputMode={type === "phone" || type === "whatsapp" ? "numeric" : "text"}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #e6e6e6",
                outline: "none",
                fontSize: 14,
              }}
            />
          </div>
        </div>
      );

  return (
    <TabContainer title="Contacts" kicker="Contacts — Emails (max 2) & WhatsApp (max 3)">
      <div style={{ maxWidth: 1100, margin: "0 auto 8px auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
          <div>
            <Input label="Name 1" value={local.EmailAddressName1 ?? ""} onChange={(v: any) => updateField("EmailAddressName1", v)} type="name" />
          </div>

          <div>
            <Input label="Email 1" value={local.EmailsforOrdersReceiving1 ?? ""} onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)} type="email" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ToggleComp checked={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON"} onChange={(c: boolean) => updateField("EmailsforOrdersStatus1", c ? "ON" : "OFF")} />
          </div>

          <div>
            <Input label="Name 2" value={local.EmailAddressName2 ?? ""} onChange={(v: any) => updateField("EmailAddressName2", v)} type="name" />
          </div>

          <div>
            <Input label="Email 2" value={local.EmailsforOrdersReceiving2 ?? ""} onChange={(v: any) => updateField("EmailsforOrdersReceiving2", v)} type="email" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ToggleComp checked={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON"} onChange={(c: boolean) => updateField("EmailsforOrdersStatus2", c ? "ON" : "OFF")} />
          </div>
        </div>

        <hr style={{ margin: "18px 0", borderColor: "#eee" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
          <div>
            <Input label="Name 1" value={local.WhatsappMobileNumberName1 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberName1", v)} />
          </div>

          <div>
            <Input label="Mobile 1" value={local.WhatsappMobileNumberforOrderDetails1 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))} type="phone" maxLength={10} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ToggleComp checked={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON"} onChange={(c: boolean) => updateField("WhatsappMobileNumberStatus1", c ? "ON" : "OFF")} />
          </div>

          <div>
            <Input label="Name 2" value={local.WhatsappMobileNumberName2 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberName2", v)} />
          </div>

          <div>
            <Input label="Mobile 2" value={local.WhatsappMobileNumberforOrderDetails2 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))} type="phone" maxLength={10} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ToggleComp checked={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON"} onChange={(c: boolean) => updateField("WhatsappMobileNumberStatus2", c ? "ON" : "OFF")} />
          </div>

          <div>
            <Input label="Name 3" value={local.WhatsappMobileNumberName3 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberName3", v)} />
          </div>

          <div>
            <Input label="Mobile 3" value={local.WhatsappMobileNumberforOrderDetails3 ?? ""} onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))} type="phone" maxLength={10} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <ToggleComp checked={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON"} onChange={(c: boolean) => updateField("WhatsappMobileNumberStatus3", c ? "ON" : "OFF")} />
          </div>
        </div>

        <div style={{ marginTop: 18, color: "#666", fontSize: 13 }}>
          Tip: click the ON/OFF control — it should immediately toggle and you'll see the change reflected in the form.
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          /* stack grid columns on small screens */
          .tab-container .tab-inner > div { padding: 0 12px; }
        }
      `}</style>
    </TabContainer>
  );
}
