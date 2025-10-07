"use client";

import React from "react";

type TabItem = {
  key: string; // unique string (eg. "Basic Information")
  label: string;
  icon?: React.ReactNode;
};

type Props = {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  // optional header text shown above children (centered)
  header?: string | null;
  // optional thin border under tabs
  showDivider?: boolean;
  // children -> current tab content
  children?: React.ReactNode;
};

const IconSet = {
  basic: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 2L3 6v6c0 5 3.8 9.2 9 10 5.2-.8 9-5 9-10V6l-9-4z" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zM19.4 15a7.9 7.9 0 0 0 .1-1 7.9 7.9 0 0 0-.1-1l2.1-1.6-1.9-3.3-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-6l-.4 3.1a7.6 7.6 0 0 0-1.7 1l-2.5-1L2 11.4l2.1 1.6a7.9 7.9 0 0 0 0 2l-2.1 1.6 1.9 3.3 2.5-1a7.6 7.6 0 0 0 1.7 1L9 21h6l.4-3.1a7.6 7.6 0 0 0 1.7-1l2.5 1 1.9-3.3L19.4 15z" />
    </svg>
  ),
  docs: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    </svg>
  ),
  contacts: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.4 0-8 2.2-8 4.9V22h16v-3.1c0-2.7-3.6-4.9-8-4.9z" />
    </svg>
  ),
  bank: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M12 2L1 6l11 4 11-4-11-4zm0 7v13" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M7 10h5v5H7zM3 4h18v18H3z" />
    </svg>
  ),
  menu: (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ verticalAlign: "middle", marginRight: 8 }}>
      <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
    </svg>
  ),
};

export default function TabContainer({ tabs, activeKey, onChange, header = null, showDivider = true, children }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header area (title + tabs) */}
      <div style={{ position: "sticky", top: 0, zIndex: 1200, background: "#fff", borderBottom: showDivider ? "1px solid #eee" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px" }}>
          <div>
            {/* If header text provided, show it (centered by design in content area). For modal top-left you'd show RestroCode outside. */}
            {header ? <div style={{ fontWeight: 700, fontSize: 15 }}>{header}</div> : null}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* space reserved for any right-side actions (kept empty for now) */}
          </div>
        </div>

        {/* Tabs row */}
        <div style={{ background: "#fafafa" }}>
          <div style={{ display: "flex", gap: 6, padding: "8px 12px", overflowX: "auto", alignItems: "center" }}>
            {tabs.map((t) => {
              const isActive = t.key === activeKey;
              return (
                <button
                  key={t.key}
                  onClick={() => onChange(t.key)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tab-panel-${t.key}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    padding: "10px 14px",
                    border: "none",
                    background: "transparent",
                    borderBottom: isActive ? "3px solid #0ea5e9" : "3px solid transparent",
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? "#0ea5e9" : "#333",
                    whiteSpace: "nowrap",
                    borderRadius: 6,
                    transition: "color .15s ease, border-bottom .15s ease",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", color: isActive ? "#0ea5e9" : "#666" }}>
                    {/* if icon passed use it, else try IconSet mapping by lowercased key */}
                    {t.icon ?? (IconSet[(t.key || "").toLowerCase().includes("basic") ? "basic" : (t.key || "").toLowerCase().includes("station") ? "settings" : (t.key || "").toLowerCase().includes("address") ? "docs" : (t.key || "").toLowerCase().includes("contact") ? "contacts" : (t.key || "").toLowerCase().includes("bank") ? "bank" : (t.key || "").toLowerCase().includes("future") ? "calendar" : (t.key || "").toLowerCase().includes("menu") ? "menu" : "basic"])}
                  </span>
                  <span style={{ fontSize: 14 }}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {/* If header text is provided show centered section header (like Basic Information etc) */}
        {header ? (
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{header}</h3>
          </div>
        ) : null}

        <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>{children}</div>
      </div>

      <style jsx>{`
        /* ensure scrollbars and spacing are pleasant in modal */
        @media (max-width: 900px) {
          div[role="tab"] {
            padding: 8px 10px;
          }
        }
      `}</style>
    </div>
  );
}
