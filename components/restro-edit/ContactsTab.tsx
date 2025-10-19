// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useCallback } from "react";
import UI from "@/components/AdminUI";
const { FormRow, FormField, Toggle } = UI;

type CommonProps = {
  local: any;
  updateField: (k: string, v: any) => void;
  stationDisplay?: string;
  stations?: { label: string; value: string }[];
  loadingStations?: boolean;
  restroCode?: string;
  InputWithIcon?: any; // optional input component passed from parent
  Toggle?: any; // optionally override Toggle (but we use AdminUI's Toggle by default)
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
    validators = {},
  } = props;

  // Fallback input component (if parent didn't pass InputWithIcon)
  const SimpleInput = ({ label, value, onChange, type = "text", placeholder = "", maxLength }: any) => (
    <div>
      {label && <div className="mb-2 font-semibold text-sm text-slate-700">{label}</div>}
      <input
        value={value ?? ""}
        placeholder={placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        inputMode={type === "phone" || type === "whatsapp" ? "numeric" : "text"}
        className="w-full p-2 rounded border border-slate-200"
      />
    </div>
  );

  const Input = InputWithIcon ?? SimpleInput;

  // sanitize phone helper — accept any input, return digits-only (max 10)
  const sanitizePhone = useCallback((raw: any) => {
    if (raw === undefined || raw === null) return "";
    const cleaned = String(raw).replace(/\D/g, "").slice(0, 10);
    return cleaned;
  }, []);

  // convert boolean toggle -> backend ON/OFF string
  const handleToggle = useCallback(
    (field: string, checked: boolean) => {
      const val = checked ? "ON" : "OFF";
      updateField(field, val);
    },
    [updateField]
  );

  return (
    <div className="px-4 pb-8">
      {/* Emails (max 2) */}
      <h3 className="text-lg font-semibold mb-4">Emails (max 2)</h3>

      <div className="max-w-5xl">
        <FormRow cols={3} gap={6}>
          {/* Email 1 */}
          <FormField label="Name 1">
            <Input
              label={null}
              value={local.EmailAddressName1 ?? ""}
              onChange={(v: any) => updateField("EmailAddressName1", v)}
              type="name"
              placeholder="Name 1"
            />
          </FormField>

          <FormField label="Email 1">
            <Input
              label={null}
              value={local.EmailsforOrdersReceiving1 ?? ""}
              onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)}
              type="email"
              placeholder="email1@example.com"
            />
          </FormField>

          <FormField label="Status">
            <Toggle
              checked={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus1", c)}
              label={String(local.EmailsforOrdersStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </FormField>

          {/* Email 2 */}
          <FormField label="Name 2">
            <Input
              label={null}
              value={local.EmailAddressName2 ?? ""}
              onChange={(v: any) => updateField("EmailAddressName2", v)}
              type="name"
              placeholder="Name 2"
            />
          </FormField>

          <FormField label="Email 2">
            <Input
              label={null}
              value={local.EmailsforOrdersReceiving2 ?? ""}
              onChange={(v: any) => updateField("EmailsforOrdersReceiving2", v)}
              type="email"
              placeholder="email2@example.com"
            />
          </FormField>

          <FormField label="Status">
            <Toggle
              checked={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus2", c)}
              label={String(local.EmailsforOrdersStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </FormField>
        </FormRow>

        <hr className="my-6 border-slate-100" />

        {/* WhatsApp numbers (max 3) */}
        <h3 className="text-lg font-semibold mb-4">WhatsApp numbers (max 3)</h3>

        <FormRow cols={3} gap={6}>
          {/* WA 1 */}
          <FormField label="Name 1">
            <Input
              label={null}
              value={local.WhatsappMobileNumberName1 ?? ""}
              onChange={(v: any) => updateField("WhatsappMobileNumberName1", v)}
              placeholder="Name 1"
            />
          </FormField>

          <FormField label="Mobile 1">
            <Input
              label={null}
              value={local.WhatsappMobileNumberforOrderDetails1 ?? ""}
              onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails1", sanitizePhone(v))}
              placeholder="10-digit mobile"
              type="phone"
              maxLength={10}
            />
          </FormField>

          <FormField label="Status">
            <Toggle
              checked={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus1", c)}
              label={String(local.WhatsappMobileNumberStatus1 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </FormField>

          {/* WA 2 */}
          <FormField label="Name 2">
            <Input
              label={null}
              value={local.WhatsappMobileNumberName2 ?? ""}
              onChange={(v: any) => updateField("WhatsappMobileNumberName2", v)}
              placeholder="Name 2"
            />
          </FormField>

          <FormField label="Mobile 2">
            <Input
              label={null}
              value={local.WhatsappMobileNumberforOrderDetails2 ?? ""}
              onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails2", sanitizePhone(v))}
              placeholder="10-digit mobile"
              type="phone"
              maxLength={10}
            />
          </FormField>

          <FormField label="Status">
            <Toggle
              checked={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus2", c)}
              label={String(local.WhatsappMobileNumberStatus2 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </FormField>

          {/* WA 3 */}
          <FormField label="Name 3">
            <Input
              label={null}
              value={local.WhatsappMobileNumberName3 ?? ""}
              onChange={(v: any) => updateField("WhatsappMobileNumberName3", v)}
              placeholder="Name 3"
            />
          </FormField>

          <FormField label="Mobile 3">
            <Input
              label={null}
              value={local.WhatsappMobileNumberforOrderDetails3 ?? ""}
              onChange={(v: any) => updateField("WhatsappMobileNumberforOrderDetails3", sanitizePhone(v))}
              placeholder="10-digit mobile"
              type="phone"
              maxLength={10}
            />
          </FormField>

          <FormField label="Status">
            <Toggle
              checked={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON"}
              onChange={(c: boolean) => handleToggle("WhatsappMobileNumberStatus3", c)}
              label={String(local.WhatsappMobileNumberStatus3 ?? "OFF") === "ON" ? "ON" : "OFF"}
            />
          </FormField>
        </FormRow>

        <div className="mt-4 text-sm text-slate-600">
          Tip: provide at least one valid primary contact (Email1 or Mobile1) so Save is enabled.
        </div>
      </div>
    </div>
  );
}
