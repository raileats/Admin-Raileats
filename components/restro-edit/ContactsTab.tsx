"use client";

import React, { useState, useEffect, useCallback } from "react";
import UI from "@/components/AdminUI";
const { FormRow, FormField, Toggle } = UI;

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
};

/** ✅ UNCONTROLLED INPUT (NO CURSOR JUMP) */
function StableInput({
  defaultValue,
  placeholder,
  maxLength,
  type = "text",
  onCommit,
}: {
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  type?: string;
  onCommit: (v: string) => void;
}) {
  const [val, setVal] = useState(defaultValue ?? "");

  useEffect(() => {
    setVal(defaultValue ?? "");
  }, [defaultValue]);

  return (
    <input
      value={val}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={type === "phone" ? "numeric" : "text"}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onCommit(val)}
      style={{
        all: "unset",
        boxSizing: "border-box",
        width: "100%",
        height: "44px",
        padding: "8px 12px",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        backgroundColor: "#fff",
        color: "#000",
        fontSize: "14px",
        display: "block",
        cursor: "text",
      }}
    />
  );
}

export default function ContactsTab({ local = {}, updateField }: Props) {
  const sanitizePhone = useCallback(
    (v: string) => v.replace(/\D/g, "").slice(0, 10),
    []
  );

  const toggle = (k: string, c: boolean) =>
    updateField(k, c ? "ON" : "OFF");

  return (
    <div className="px-4 pb-8 max-w-5xl">
      <h3 className="text-lg font-semibold mb-4">Emails (max 2)</h3>

      <FormRow cols={3} gap={6}>
        <FormField label="Name 1">
          <StableInput
            defaultValue={local.EmailAddressName1}
            placeholder="Name 1"
            onCommit={(v) => updateField("EmailAddressName1", v)}
          />
        </FormField>

        <FormField label="Email 1">
          <StableInput
            defaultValue={local.EmailsforOrdersReceiving1}
            placeholder="email1@example.com"
            onCommit={(v) => updateField("EmailsforOrdersReceiving1", v)}
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={local.EmailsforOrdersStatus1 === "ON"}
            onChange={(c: boolean) =>
              toggle("EmailsforOrdersStatus1", c)
            }
            label={local.EmailsforOrdersStatus1 === "ON" ? "ON" : "OFF"}
          />
        </FormField>

        <FormField label="Name 2">
          <StableInput
            defaultValue={local.EmailAddressName2}
            placeholder="Name 2"
            onCommit={(v) => updateField("EmailAddressName2", v)}
          />
        </FormField>

        <FormField label="Email 2">
          <StableInput
            defaultValue={local.EmailsforOrdersReceiving2}
            placeholder="email2@example.com"
            onCommit={(v) => updateField("EmailsforOrdersReceiving2", v)}
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={local.EmailsforOrdersStatus2 === "ON"}
            onChange={(c: boolean) =>
              toggle("EmailsforOrdersStatus2", c)
            }
            label={local.EmailsforOrdersStatus2 === "ON" ? "ON" : "OFF"}
          />
        </FormField>
      </FormRow>

      <hr className="my-6" />

      <h3 className="text-lg font-semibold mb-4">
        WhatsApp numbers (max 3)
      </h3>

      <FormRow cols={3} gap={6}>
        <FormField label="Name 1">
          <StableInput
            defaultValue={local.WhatsappMobileNumberName1}
            placeholder="Name 1"
            onCommit={(v) =>
              updateField("WhatsappMobileNumberName1", v)
            }
          />
        </FormField>

        <FormField label="Mobile 1">
          <StableInput
            defaultValue={local.WhatsappMobileNumberforOrderDetails1}
            placeholder="10-digit mobile"
            type="phone"
            maxLength={10}
            onCommit={(v) =>
              updateField(
                "WhatsappMobileNumberforOrderDetails1",
                sanitizePhone(v)
              )
            }
          />
        </FormField>

        <FormField label="Status">
          <Toggle
            checked={local.WhatsappMobileNumberStatus1 === "ON"}
            onChange={(c: boolean) =>
              toggle("WhatsappMobileNumberStatus1", c)
            }
            label={local.WhatsappMobileNumberStatus1 === "ON" ? "ON" : "OFF"}
          />
        </FormField>
      </FormRow>
    </div>
  );
}
