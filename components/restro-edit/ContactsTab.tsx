// components/restro-edit/ContactsTab.tsx
"use client";

import React, { useEffect, useState } from "react";

type Props = {
  local?: any;
  updateField?: (k: string, v: any) => void;
  restroCode?: string;
  // optional helpers passed from RestroEditModal
  InputWithIcon?: any;
  validators?: {
    validateEmailString?: (s: string) => boolean;
    validatePhoneString?: (s: string) => boolean;
  };
};

// small toggle switch for ON/OFF
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      style={{
        width: 50,
        height: 26,
        borderRadius: 999,
        border: "1px solid #ccc",
        background: value ? "#0ea5e9" : "#f3f4f6",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: value ? "flex-end" : "flex-start",
        padding: 3,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: value ? "#fff" : "#9ca3af",
          transition: "transform 0.15s ease",
        }}
      />
    </button>
  );
}

export default function ContactsTab({
  local = {},
  updateField = () => {},
  restroCode = "",
  InputWithIcon,
  validators,
}: Props) {
  const [emails, setEmails] = useState<{ name: string; receiving: string; status: boolean }[]>([]);
  const [whatsapps, setWhatsapps] = useState<{ name: string; number: string; status: boolean }[]>([]);

  function deriveFromLocal(l: any) {
    const e: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const nameKey = `EmailAddressName${i}`;
      const recvKey = `EmailsforOrdersReceiving${i}`;
      const statusKey = `EmailsforOrdersStatus${i}`;
      const rawStatus = l?.[statusKey];
      const status = rawStatus === "ON" || rawStatus === "on" || rawStatus === "1" || rawStatus === 1 || rawStatus === true;
      e.push({
        name: l?.[nameKey] ?? "",
        receiving: l?.[recvKey] ?? "",
        status,
      });
    }

    const w: any[] = [];
    for (let i = 1; i <= 5; i++) {
      const nameKey = `WhatsappMobileNumberName${i}`;
      const numKey = `WhatsappMobileNumberforOrderDetails${i}`;
      const statusKey = `WhatsappMobileNumberStatus${i}`;
      const rawStatus = l?.[statusKey];
      const status = rawStatus === "ON" || rawStatus === "on" || rawStatus === "1" || rawStatus === 1 || rawStatus === true;
      w.push({
        name: l?.[nameKey] ?? "",
        number: l?.[numKey] ?? "",
        status,
      });
    }

    return { e, w };
  }

  useEffect(() => {
    const { e, w } = deriveFromLocal(local ?? {});
    setEmails(e);
    setWhatsapps(w);
  }, [local]);

  // update functions
  function updateEmailRow(i: number, k: keyof (typeof emails)[number], v: string | boolean) {
    setEmails((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [k]: v };
      return copy;
    });
  }

  function updateWhatsappRow(i: number, k: keyof (typeof whatsapps)[number], v: string | boolean) {
    setWhatsapps((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [k]: v };
      return copy;
    });
  }

  // Whenever email/whatsapp changes, push back to parent via updateField
  useEffect(() => {
    const payload: Record<string, any> = {};

    emails.forEach((r, i) => {
      const idx = i + 1;
      payload[`EmailAddressName${idx}`] = r.name ?? "";
      payload[`EmailsforOrdersReceiving${idx}`] = r.receiving ?? "";
      payload[`EmailsforOrdersStatus${idx}`] = r.status ? "ON" : "OFF";
    });

    whatsapps.forEach((r, i) => {
      const idx = i + 1;
      payload[`WhatsappMobileNumberName${idx}`] = r.name ?? "";
      payload[`WhatsappMobileNumberforOrderDetails${idx}`] = r.number ?? "";
      payload[`WhatsappMobileNumberStatus${idx}`] = r.status ? "ON" : "OFF";
    });

    // propagate each field to parent
    Object.entries(payload).forEach(([k, v]) => updateField(k, v));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emails, whatsapps]);

  // helpers to render an input row either with InputWithIcon (if provided) or fallback to plain input
  function EmailRow({ row, idx }: { row: { name: string; receiving: string; status: boolean }; idx: number }) {
    const i = idx;
    if (InputWithIcon) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px", gap: 12, marginBottom: 8 }}>
          <InputWithIcon
            name={`EmailAddressName${i + 1}`}
            label={`Name ${i + 1}`}
            value={row.name}
            onChange={(v: any) => updateEmailRow(i, "name", v)}
            type="name"
            placeholder={`Name ${i + 1}`}
          />
          <InputWithIcon
            name={`EmailsforOrdersReceiving${i + 1}`}
            label={`Email ${i + 1}`}
            value={row.receiving}
            onChange={(v: any) => updateEmailRow(i, "receiving", v)}
            type="email"
            placeholder={`email${i + 1}@example.com`}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Toggle value={!!row.status} onChange={(v) => updateEmailRow(i, "status", v)} />
            <span style={{ fontSize: 12 }}>{row.status ? "ON" : "OFF"}</span>
          </div>
        </div>
      );
    }

    // fallback
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px", gap: 12, marginBottom: 8 }}>
        <input placeholder={`Name ${i + 1}`} value={row.name} onChange={(e) => updateEmailRow(i, "name", e.target.value)} />
        <input placeholder={`Email ${i + 1}`} value={row.receiving} onChange={(e) => updateEmailRow(i, "receiving", e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Toggle value={!!row.status} onChange={(v) => updateEmailRow(i, "status", v)} />
          <span style={{ fontSize: 12 }}>{row.status ? "ON" : "OFF"}</span>
        </div>
      </div>
    );
  }

  function WhatsappRow({ row, idx }: { row: { name: string; number: string; status: boolean }; idx: number }) {
    const i = idx;
    if (InputWithIcon) {
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px", gap: 12, marginBottom: 8 }}>
          <InputWithIcon
            name={`WhatsappMobileNumberName${i + 1}`}
            label={`Name ${i + 1}`}
            value={row.name}
            onChange={(v: any) => updateWhatsappRow(i, "name", v)}
            type="name"
            placeholder={`Name ${i + 1}`}
          />
          <InputWithIcon
            name={`WhatsappMobileNumberforOrderDetails${i + 1}`}
            label={`Mobile ${i + 1}`}
            value={row.number}
            onChange={(v: any) => updateWhatsappRow(i, "number", v)}
            type="whatsapp"
            placeholder={`10-digit mobile number`}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Toggle value={!!row.status} onChange={(v) => updateWhatsappRow(i, "status", v)} />
            <span style={{ fontSize: 12 }}>{row.status ? "ON" : "OFF"}</span>
          </div>
        </div>
      );
    }

    // fallback
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 90px", gap: 12, marginBottom: 8 }}>
        <input placeholder={`Name ${i + 1}`} value={row.name} onChange={(e) => updateWhatsappRow(i, "name", e.target.value)} />
        <input placeholder={`Mobile ${i + 1}`} value={row.number} onChange={(e) => updateWhatsappRow(i, "number", e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Toggle value={!!row.status} onChange={(v) => updateWhatsappRow(i, "status", v)} />
          <span style={{ fontSize: 12 }}>{row.status ? "ON" : "OFF"}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 18 }}>
      <h3 style={{ marginTop: 0 }}>Contacts</h3>
      <p style={{ color: "#666", marginBottom: 8 }}>
        Manage Email and WhatsApp contacts for order updates. Toggle <strong>ON</strong> to enable order notifications.
      </p>

      <div style={{ maxWidth: 1100 }}>
        {/* Emails Section */}
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Emails</div>
        {emails.map((r, i) => (
          <EmailRow key={i} row={r} idx={i} />
        ))}

        <div style={{ height: 12 }} />

        {/* WhatsApp Section */}
        <div style={{ marginBottom: 8, fontWeight: 600 }}>WhatsApp numbers</div>
        {whatsapps.map((r, i) => (
          <WhatsappRow key={i} row={r} idx={i} />
        ))}
      </div>

      <style jsx>{`
        input {
          width: 100%;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e3e3e3;
          box-sizing: border-box;
        }
        @media (max-width: 720px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
