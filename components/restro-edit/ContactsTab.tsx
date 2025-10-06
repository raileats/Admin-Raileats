// components/restro-edit/ContactsTab.tsx
"use client";
import React from "react";
import Toggle from "@/components/ui/Toggle"; // use the Toggle component I shared earlier or your own
import { InputWithIcon } from "@/components/RestroEditModal"; // if you exported it; otherwise inline similar InputWithIcon

type Props = {
  local?: any;
  updateField?: (k: string, v: any) => void;
  restroCode?: string;
  validators?: any;
  InputWithIcon?: any;
};

export default function ContactsTab({ local = {}, updateField = () => {}, InputWithIcon = null }: Props) {
  // helper to safely read local values
  const g = (k: string) => (local && local[k] !== undefined && local[k] !== null ? local[k] : "");

  // Map of fields we support (only 1..3)
  const emailFields = [
    { nameKey: "EmailAddressName1", emailKey: "EmailsforOrdersReceiving1", enabledKey: "EmailsforOrdersReceiving1Enabled" },
    { nameKey: "EmailAddressName2", emailKey: "EmailsforOrdersReceiving2", enabledKey: "EmailsforOrdersReceiving2Enabled" },
    { nameKey: "EmailAddressName3", emailKey: "EmailsforOrdersReceiving3", enabledKey: "EmailsforOrdersReceiving3Enabled" },
  ];

  const whatsappFields = [
    { nameKey: "WhatsappMobileNumberName1", mobileKey: "WhatsappMobileNumberforOrderDetails1", enabledKey: "WhatsappMobileNumberStatus1" },
    { nameKey: "WhatsappMobileNumberName2", mobileKey: "WhatsappMobileNumberforOrderDetails2", enabledKey: "WhatsappMobileNumberStatus2" },
    { nameKey: "WhatsappMobileNumberName3", mobileKey: "WhatsappMobileNumberforOrderDetails3", enabledKey: "WhatsappMobileNumberStatus3" },
  ];

  return (
    <div style={{ maxWidth: 1100 }}>
      <h3 style={{ marginBottom: 8 }}>Emails</h3>
      <p style={{ marginTop: 0, marginBottom: 12, color: "#666", fontSize: 13 }}>Manage email contacts for order updates. Toggle ON to enable notifications.</p>

      {emailFields.map((f, idx) => (
        <div key={f.emailKey} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            {InputWithIcon ? (
              <InputWithIcon
                name={f.nameKey}
                label={`Name ${idx + 1}`}
                value={g(f.nameKey)}
                onChange={(v: any) => updateField(f.nameKey, v)}
                type="name"
                placeholder={`Name ${idx + 1}`}
              />
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{`Name ${idx + 1}`}</div>
                <input value={g(f.nameKey)} onChange={(e)=>updateField(f.nameKey, e.target.value)} placeholder={`Name ${idx+1}`} style={{ padding: 8, width: "100%", borderRadius: 6, border: "1px solid #e6e6e6"}}/>
              </div>
            )}
          </div>

          <div style={{ flex: 2 }}>
            {InputWithIcon ? (
              <InputWithIcon
                name={f.emailKey}
                label={`Email ${idx + 1}`}
                value={g(f.emailKey)}
                onChange={(v: any) => updateField(f.emailKey, v)}
                type="email"
                placeholder={`email${idx + 1}@example.com`}
              />
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{`Email ${idx + 1}`}</div>
                <input value={g(f.emailKey)} onChange={(e)=>updateField(f.emailKey, e.target.value)} placeholder={`email${idx+1}@example.com`} style={{ padding: 8, width: "100%", borderRadius: 6, border: "1px solid #e6e6e6"}}/>
              </div>
            )}
          </div>

          <div style={{ width: 120, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <Toggle value={Boolean(g(f.enabledKey))} onChange={(v:boolean) => updateField(f.enabledKey, v)} ariaLabel={`Enable email ${idx+1}`} />
          </div>
        </div>
      ))}

      <hr style={{ margin: "18px 0" }} />

      <h3 style={{ marginBottom: 8 }}>WhatsApp numbers</h3>
      <p style={{ marginTop: 0, marginBottom: 12, color: "#666", fontSize: 13 }}>Manage WhatsApp contacts for order updates. Toggle ON to enable notifications.</p>

      {whatsappFields.map((f, idx) => (
        <div key={f.mobileKey} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            {InputWithIcon ? (
              <InputWithIcon
                name={f.nameKey}
                label={`Name ${idx + 1}`}
                value={g(f.nameKey)}
                onChange={(v: any) => updateField(f.nameKey, v)}
                type="name"
                placeholder={`Name ${idx + 1}`}
              />
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{`Name ${idx + 1}`}</div>
                <input value={g(f.nameKey)} onChange={(e)=>updateField(f.nameKey, e.target.value)} placeholder={`Name ${idx+1}`} style={{ padding: 8, width: "100%", borderRadius: 6, border: "1px solid #e6e6e6"}}/>
              </div>
            )}
          </div>

          <div style={{ flex: 2 }}>
            {InputWithIcon ? (
              <InputWithIcon
                name={f.mobileKey}
                label={`Mobile ${idx + 1}`}
                value={g(f.mobileKey)}
                onChange={(v: any) => updateField(f.mobileKey, v)}
                type="whatsapp"
                placeholder={`10-digit number`}
              />
            ) : (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{`Mobile ${idx + 1}`}</div>
                <input value={g(f.mobileKey)} onChange={(e)=>updateField(f.mobileKey, e.target.value)} placeholder={`10-digit number`} style={{ padding: 8, width: "100%", borderRadius: 6, border: "1px solid #e6e6e6"}}/>
              </div>
            )}
          </div>

          <div style={{ width: 120, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <Toggle value={Boolean(g(f.enabledKey))} onChange={(v:boolean) => updateField(f.enabledKey, v)} ariaLabel={`Enable whatsapp ${idx+1}`} />
          </div>
        </div>
      ))}

      <div style={{ marginTop: 6, color: "#666", fontSize: 13 }}>
        Note: Only three Email and three WhatsApp contacts are supported (fields 1–3).
      </div>
    </div>
  );
}
