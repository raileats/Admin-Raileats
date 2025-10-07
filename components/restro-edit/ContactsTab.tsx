// components/restro-edit/ContactsTab.tsx
"use client";
import React, { useCallback } from "react";
import TabContainer from "@/components/TabContainer";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  InputWithIcon?: any;
  Toggle?: any;
};

export default function ContactsTab({ local = {}, updateField, InputWithIcon, Toggle }: Props) {
  const Input = InputWithIcon ? InputWithIcon : ({ label, value, onChange, placeholder }: any) => (
    <div>
      {label && <div className="label">{label}</div>}
      <div className="input-with-icon">
        <span className="icon">👤</span>
        <input className={`input ${label && label.toLowerCase().includes("name") ? "input-sm" : ""}`} value={value ?? ""} placeholder={placeholder ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );

  const ToggleComp = Toggle ? Toggle : ({ checked, onChange }: any) => (
    <button className={`toggle-pill ${checked ? "on" : "off"}`} onClick={() => onChange(!checked)}>{checked ? "ON" : "OFF"}</button>
  );

  const sanitizePhone = useCallback((raw: any) => (raw ? String(raw).replace(/\D/g, "").slice(0, 10) : ""), []);

  const handleToggle = useCallback((field: string, checked: boolean) => {
    updateField(field, checked ? "ON" : "OFF");
  }, [updateField]);

  return (
    <TabContainer title="Contacts" kicker="">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 12, color: "#444", fontWeight: 700 }}>Contacts — Emails (max 2) & WhatsApp (max 3)</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, alignItems: "center" }}>
          <div>
            <Input label="Name 1" value={local.EmailAddressName1 ?? ""} onChange={(v: any) => updateField("EmailAddressName1", v)} />
          </div>

          <div>
            <Input label="Email 1" value={local.EmailsforOrdersReceiving1 ?? ""} onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)} />
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <ToggleComp checked={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON"} onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus1", c)} />
          </div>

          {/* similar for Email 2, WhatsApp entries... */}
        </div>

        <hr style={{ margin: "18px 0" }} />

        <div style={{ color: "#666", fontSize: 13 }}>
          Tip: toggle ON to enable notifications.
        </div>
      </div>
    </TabContainer>
  );
}
