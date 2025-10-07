// components/TabContainer.tsx
"use client";

import React from "react";

type TabItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
};

type Props = {
  tabs?: TabItem[]; // optional list of tabs (for header nav) - you can pass [] if unused
  activeKey?: string;
  onChange?: (key: string) => void;
  header?: string | null; // preferred prop name for title
  title?: string | null; // alias for backward compatibility
  showDivider?: boolean;
  children?: React.ReactNode;
  compact?: boolean;
};

export default function TabContainer({
  tabs = [],
  activeKey,
  onChange,
  header,
  title,
  showDivider = true,
  children,
  compact = false,
}: Props) {
  const visibleTitle = header ?? title ?? null;

  return (
    <div style={{ width: "100%" }}>
      {/* Top title */}
      {visibleTitle && (
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{visibleTitle}</h3>
        </div>
      )}

      {/* Tabs row (if provided) */}
      {tabs && tabs.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: "8px 12px", overflowX: "auto", alignItems: "center", marginBottom: 12 }}>
          {tabs.map((t) => {
            const active = t.key === activeKey;
            return (
              <button
                key={t.key}
                onClick={() => onChange && onChange(t.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: active ? "2px solid #0ea5e9" : "1px solid #e6e6e6",
                  background: active ? "rgba(14,165,233,0.06)" : "#fff",
                  color: active ? "#0e7ea8" : "#333",
                  cursor: "pointer",
                  fontWeight: active ? 700 : 600,
                  whiteSpace: "nowrap",
                }}
              >
                {t.icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{t.icon}</span>}
                <span style={{ fontSize: compact ? 13 : 14 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* optional divider */}
      {showDivider && <div style={{ height: 1, background: "#f0f0f0", marginBottom: 14 }} />}

      {/* content slot */}
      <div style={{ width: "100%" }}>{children}</div>
    </div>
  );
}
