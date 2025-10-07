// components/TabContainer.tsx
"use client";

import React from "react";

type Props = {
  title?: string;        // centered big title shown once
  kicker?: string;       // small label above title (optional)
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function TabContainer({ title, kicker, children, className, style }: Props) {
  return (
    <div className={`tab-container ${className ?? ""}`} style={style}>
      <div className="tab-heading" aria-hidden={title ? "false" : "true"}>
        {kicker ? <div className="kicker">{kicker}</div> : null}
        {title ? <div className="title">{title}</div> : null}
      </div>

      <div className="tab-inner">{children}</div>

      <style jsx>{`
        .tab-container {
          padding: 28px;
          background: var(--card-bg, #fff);
          border-radius: var(--radius, 10px);
          border: 1px solid #f3f3f3;
          box-shadow: 0 6px 20px rgba(11, 15, 30, 0.03);
          margin: 20px auto;
          max-width: 1200px;
        }
        .tab-heading { text-align: center; margin: 0 0 16px 0; }
        .tab-heading .kicker {
          font-weight: 700;
          font-size: 1.0rem;
          color: var(--muted, #6b7280);
          margin-bottom: 6px;
          text-transform: none;
        }
        .tab-heading .title {
          font-weight: 700;
          font-size: 1.4rem;
          color: var(--text, #0f1724);
        }
        .tab-inner { margin-top: 8px; }
      `}</style>
    </div>
  );
}
