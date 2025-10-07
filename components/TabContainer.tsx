// components/TabContainer.tsx
"use client";
import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function TabContainer({ title, subtitle, children }: Props) {
  return (
    <div className="tab-wrap">
      {title && <h2 className="tab-title">{title}</h2>}
      {subtitle && <div className="tab-subtitle">{subtitle}</div>}

      <div className="tab-card">
        {children}
      </div>

      <style jsx>{`
        .tab-wrap { max-width: 1200px; margin: 12px auto 40px; padding: 0 18px; }
        .tab-title { text-align: center; margin: 12px 0 6px; font-size: 20px; font-weight: 700; color: #1f2937; }
        .tab-subtitle { text-align: center; margin-bottom: 14px; color: #374151; font-weight: 600; }
        .tab-card {
          background: #fff;
          border-radius: 8px;
          border: 1px solid #eee;
          padding: 28px 30px;
          box-shadow: 0 1px 0 rgba(0,0,0,0.02);
        }

        /* small helper classes available inside cards */
        :global(.restro-grid) {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px 28px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          :global(.restro-grid) { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 720px) {
          :global(.restro-grid) { grid-template-columns: 1fr; }
        }

        :global(.restro-label) {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }
        :global(.restro-input) {
          width: 100%;
          padding: 8px 10px;
          border-radius: 6px;
          border: 1px solid #e6e6e6;
          font-size: 14px;
        }
        :global(.restro-readonly) {
          padding: 8px 10px;
          background: #fafafa;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
        }

        /* smaller field container for two-column inline forms */
        :global(.field) { margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
