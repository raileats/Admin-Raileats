// components/restro-edit/ContactsTab.tsx
"use client";

import React from "react";

type Props = {
  local: any;
  updateField: (k: string, v: any) => void;
  InputWithIcon?: any;
  Toggle?: any;
};

export default function ContactsTab({ local = {}, updateField, InputWithIcon, Toggle }: Props) {
  // helper to read/wrap field names with fallbacks
  const val = (k: string, fallback = "") => local?.[k] ?? fallback;

  return (
    <div>
      {/* Use TabContainer inside each tab file (if you used TabContainer in project) */}
      {/* If your TabContainer is available, wrap with it. Otherwise this will still render fine. */}
      {/* We assume the child code already uses a TabContainer, but if not, just keep this wrapper. */}
      <div className="form-wrapper">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Kicker / subtitle row (left aligned small text above inputs) */}
          <div style={{ marginBottom: 10, color: "#374151", fontWeight: 600 }}>Contacts — Emails (max 2) & WhatsApp (max 3)</div>

          {/* Email rows (2) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, fontWeight: 700 }}>Name 1</div>
              {InputWithIcon ? (
                <div className="input-with-icon">
                  <span className="icon">👤</span>
                  <input className="field-input" value={val("EmailAddressName1", "")} onChange={(e) => updateField("EmailAddressName1", e.target.value)} />
                </div>
              ) : (
                <input className="field-input" value={val("EmailAddressName1", "")} onChange={(e) => updateField("EmailAddressName1", e.target.value)} />
              )}
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, fontWeight: 700 }}>Email 1</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  className="field-input"
                  value={val("EmailsforOrdersReceiving1", "")}
                  onChange={(e) => updateField("EmailsforOrdersReceiving1", e.target.value)}
                  placeholder="email@example.com"
                />
                {Toggle ? (
                  <Toggle checked={!!val("EmailsforOrdersReceiving1Enabled", true)} onChange={(v: boolean) => updateField("EmailsforOrdersReceiving1Enabled", v)} />
                ) : (
                  <span style={{ color: "#6b7280" }}>{val("EmailsforOrdersReceiving1Enabled", true) ? "ON" : "OFF"}</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, fontWeight: 700 }}>Name 2</div>
              <input className="field-input" value={val("EmailAddressName2", "")} onChange={(e) => updateField("EmailAddressName2", e.target.value)} />
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, fontWeight: 700 }}>Email 2</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  className="field-input"
                  value={val("EmailsforOrdersReceiving2", "")}
                  onChange={(e) => updateField("EmailsforOrdersReceiving2", e.target.value)}
                  placeholder="email2@example.com"
                />
                {Toggle ? (
                  <Toggle checked={!!val("EmailsforOrdersReceiving2Enabled", false)} onChange={(v: boolean) => updateField("EmailsforOrdersReceiving2Enabled", v)} />
                ) : (
                  <span style={{ color: "#6b7280" }}>{val("EmailsforOrdersReceiving2Enabled", false) ? "ON" : "OFF"}</span>
                )}
              </div>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e6e6e6", margin: "18px 0" }} />

          {/* WhatsApp / Mobile numbers (max 3) */}
          <div style={{ marginBottom: 8, color: "#6b7280" }}>Tip: toggle ON to enable notifications.</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, fontWeight: 700 }}>{`Name ${i}`}</div>
                  <input className="field-input" value={val(`WhatsappName${i}`, "")} onChange={(e) => updateField(`WhatsappName${i}`, e.target.value)} />
                </div>

                <div style={{ width: 320 }}>
                  <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, fontWeight: 700 }}>{`Mobile ${i}`}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input className="field-input" value={val(`WhatsappMobile${i}`, "")} onChange={(e) => updateField(`WhatsappMobile${i}`, e.target.value)} />
                    {Toggle ? (
                      <Toggle checked={!!val(`WhatsappMobile${i}Enabled`, false)} onChange={(v: boolean) => updateField(`WhatsappMobile${i}Enabled`, v)} />
                    ) : (
                      <span style={{ color: "#6b7280" }}>{val(`WhatsappMobile${i}Enabled`, false) ? "ON" : "OFF"}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .field-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e6e6e6;
          border-radius: 8px;
          height: 42px;
          font-size: 14px;
          background: #fff;
        }
        .input-with-icon { display:flex; align-items:center; gap:10px; }
        .input-with-icon .icon { font-size:18px; color: #6b21a8; }
      `}</style>
    </div>
  );
}
