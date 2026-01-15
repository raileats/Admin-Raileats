"use client";

import React, { useCallback, useMemo } from "react";
import UI from "@/components/AdminUI";
const { FormRow, FormField, Toggle } = UI;

type CommonProps = {
  local: any;
  updateField: (k: string, v: any) => void;
};

export default function ContactsTab({ local = {}, updateField }: CommonProps) {

  /** 🔥 Stable input (NO remount, NO cursor jump) */
  const ForceInput = React.memo(function ForceInput({
    value,
    onChange,
    placeholder,
    maxLength,
    type = "text",
  }: any) {
    return (
      <input
        value={value ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={type === "phone" ? "numeric" : "text"}
        onChange={(e) => onChange(e.target.value)}
        style={{
          all: "unset",
          boxSizing: "border-box",
          width: "100%",
          height: "44px",
          padding: "8px 12px",
          border: "1px solid #cbd5e1",
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          color: "#000000",
          fontSize: "14px",
          display: "block",
          cursor: "text",
        }}
      />
    );
  });

  const sanitizePhone = useCallback((raw: any) => {
    return String(raw ?? "").replace(/\D/g, "").slice(0, 10);
  }, []);

  const handleToggle = useCallback(
    (field: string, checked: boolean) => {
      updateField(field, checked ? "ON" : "OFF");
    },
    [updateField]
  );

  /** 🔒 Stable keys (VERY IMPORTANT) */
  const keys = useMemo(
    () => ({
      name1: "name1",
      email1: "email1",
      status1: "status1",
      name2: "name2",
      email2: "email2",
      waName1: "waName1",
      waMobile1: "waMobile1",
      waName2: "waName2",
      waMobile2: "waMobile2",
    }),
    []
  );

  return (
    <div className="px-4 pb-8 max-w-5xl">

      {/* EMAILS */}
      <h3 className="text-lg font-semibold mb-4">Emails (max 2)</h3>

      <FormRow cols={3} gap={6}>
        <FormField label="Name 1">
          <ForceInput
            key={keys.name1}
            value={local.EmailAddressName1}
            onChange={(v: any) => updateField("EmailAddressName1", v)}
            placeholder="Name 1"
          />
        </FormField>

        <FormField label="Email 1">
          <ForceInput
            key={keys.email1}
            value={local.EmailsforOrdersReceiving1}
            onChange={(v: any) => updateField("EmailsforOrdersReceiving1", v)}
            placeholder="email1@example.com"
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={String(local.EmailsforOrdersStatus1) === "ON"}
            onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus1", c)}
            label={String(local.EmailsforOrdersStatus1) === "ON" ? "ON" : "OFF"}
          />
        </FormField>

        <FormField label="Name 2">
          <ForceInput
            key={keys.name2}
            value={local.EmailAddressName2}
            onChange={(v: any) => updateField("EmailAddressName2", v)}
            placeholder="Name 2"
          />
        </FormField>

        <FormField label="Email 2">
          <ForceInput
            key={keys.email2}
            value={local.EmailsforOrdersReceiving2}
            onChange={(v: any) => updateField("EmailsforOrdersReceiving2", v)}
            placeholder="email2@example.com"
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={String(local.EmailsforOrdersStatus2) === "ON"}
            onChange={(c: boolean) => handleToggle("EmailsforOrdersStatus2", c)}
            label={String(local.EmailsforOrdersStatus2) === "ON" ? "ON" : "OFF"}
          />
        </FormField>
      </FormRow>

      <hr className="my-6" />

      {/* WHATSAPP */}
      <h3 className="text-lg font-semibold mb-4">WhatsApp numbers (max 3)</h3>

      <FormRow cols={3} gap={6}>
        <FormField label="Name 1">
          <ForceInput
            key={keys.waName1}
            value={local.WhatsappMobileNumberName1}
            onChange={(v: any) => updateField("WhatsappMobileNumberName1", v)}
            placeholder="Name 1"
          />
        </FormField>

        <FormField label="Mobile 1">
          <ForceInput
            key={keys.waMobile1}
            value={local.WhatsappMobileNumberforOrderDetails1}
            onChange={(v: any) =>
              updateField(
                "WhatsappMobileNumberforOrderDetails1",
                sanitizePhone(v)
              )
            }
            placeholder="10-digit mobile"
            maxLength={10}
            type="phone"
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={String(local.WhatsappMobileNumberStatus1) === "ON"}
            onChange={(c: boolean) =>
              handleToggle("WhatsappMobileNumberStatus1", c)
            }
            label={String(local.WhatsappMobileNumberStatus1) === "ON" ? "ON" : "OFF"}
          />
        </FormField>

        <FormField label="Name 2">
          <ForceInput
            key={keys.waName2}
            value={local.WhatsappMobileNumberName2}
            onChange={(v: any) => updateField("WhatsappMobileNumberName2", v)}
            placeholder="Name 2"
          />
        </FormField>

        <FormField label="Mobile 2">
          <ForceInput
            key={keys.waMobile2}
            value={local.WhatsappMobileNumberforOrderDetails2}
            onChange={(v: any) =>
              updateField(
                "WhatsappMobileNumberforOrderDetails2",
                sanitizePhone(v)
              )
            }
            placeholder="10-digit mobile"
            maxLength={10}
            type="phone"
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={String(local.WhatsappMobileNumberStatus2) === "ON"}
            onChange={(c: boolean) =>
              handleToggle("WhatsappMobileNumberStatus2", c)
            }
            label={String(local.WhatsappMobileNumberStatus2) === "ON" ? "ON" : "OFF"}
          />
        </FormField>
      </FormRow>
    </div>
  );
}
