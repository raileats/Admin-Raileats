// components/TabContainer.tsx
"use client";
import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  maxWidth?: number | string;
};

export default function TabContainer({ title, subtitle, children, maxWidth = 1200 }: Props) {
  return (
    <div
      style={{
        padding: "18px 24px",
        maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
        margin: "0 auto",
        // <-- Arial font for this container and all children
        fontFamily: "Arial, sans-serif",
        color: "#0f172a",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    >
      {/* header */}
      {title && (
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h2>
          {subtitle && <div style={{ marginTop: 8, fontSize: 16, color: "#334155", fontWeight: 600 }}>{subtitle}</div>}
        </div>
      )}

      {/* card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
          border: "1px solid #eef2f6",
          padding: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
}
