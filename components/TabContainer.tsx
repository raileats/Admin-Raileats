// components/TabContainer.tsx
"use client";

import React from "react";

type Props = {
  title?: string;
  kicker?: string;
  children?: React.ReactNode;
  maxWidth?: number | string;
};

export default function TabContainer({ title, kicker, children, maxWidth = 1200 }: Props) {
  return (
    <div className="tab-container" style={{ maxWidth }}>
      <div className="tab-heading">
        {kicker && <div className="kicker">{kicker}</div>}
        {title && <div className="title">{title}</div>}
      </div>

      <div>{children}</div>

      <style jsx>{`
        .tab-container {
          padding: 28px;
          background: var(--card-bg);
          border-radius: var(--radius);
          border: 1px solid #f3f3f3;
          box-shadow: 0 6px 20px rgba(11, 15, 30, 0.03);
          margin: 20px auto;
        }
        .tab-heading { text-align: center; margin-bottom: 18px; }
        .tab-heading .kicker { font-weight:700; font-size: 1.05rem; color: var(--muted); margin-bottom:6px; }
        .tab-heading .title { font-weight:800; font-size:1.25rem; color:var(--text); }
      `}</style>
    </div>
  );
}
