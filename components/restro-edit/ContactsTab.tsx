"use client";

import React, { useCallback } from "react";
import UI from "@/components/AdminUI";
const { FormRow, FormField, Toggle } = UI;

/* ================================
   INPUT (must be outside component)
================================ */
function ForceInput({
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
}

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
};

export default function ContactsTab({ local = {}, updateField }: Props) {
  const sanitizePhone = useCallback((raw: any) => {
    return String(raw ?? "").replace(/\D/g, "").slice(0, 10);
  }, []);

  const handleToggle = useCallback(
    (field: string, checked: boolean) => {
      updateField(field, checked ? "ON" : "OFF");
    },
    [updateField]
  );

  return (
    <div className="px-4 pb-8 max-w-5xl">

      {/* ================= EMAILS ================= */}
      <h3 className="text-lg font-semibold mb-4">Emails (max 2)</h3>

      <FormRow cols={3} gap={6}>
        <FormField label="Name 1">
          <ForceInput
            value={local.EmailAddressName1}
            onChange={(v: any) => updateField("EmailAddressName1", v)}
            placeholder="Name 1"
          />
        </FormField>

        <FormField label="Email 1">
          <ForceInput
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
            value={local.EmailAddressName2}
            onChange={(v: any) => updateField("EmailAddressName2", v)}
            placeholder="Name 2"
          />
        </FormField>

        <FormField label="Email 2">
          <ForceInput
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

      {/* ================= WHATSAPP ================= */}
      <h3 className="text-lg font-semibold mb-4">WhatsApp numbers (max 3)</h3>

      <FormRow cols={3} gap={6}>
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <FormField label={`Name ${i}`}>
              <ForceInput
                value={local[`WhatsappMobileNumberName${i}`]}
                onChange={(v: any) =>
                  updateField(`WhatsappMobileNumberName${i}`, v)
                }
                placeholder={`Name ${i}`}
              />
            </FormField>

            <FormField label={`Mobile ${i}`}>
              <ForceInput
                value={local[`WhatsappMobileNumberforOrderDetails${i}`]}
                onChange={(v: any) =>
                  updateField(
                    `WhatsappMobileNumberforOrderDetails${i}`,
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
                checked={
                  String(local[`WhatsappMobileNumberStatus${i}`]) === "ON"
                }
                onChange={(c: boolean) =>
                  handleToggle(`WhatsappMobileNumberStatus${i}`, c)
                }
                label={
                  String(local[`WhatsappMobileNumberStatus${i}`]) === "ON"
                    ? "ON"
                    : "OFF"
                }
              />
            </FormField>
          </React.Fragment>
        ))}
      </FormRow>
    </div>
  );
}
