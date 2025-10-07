// components/TabContainer.tsx
"use client";

import React from "react";

type Props = {
  title?: string;      // main centered title shown above the content
  kicker?: string;     // small kicker / subtitle (optional)
  children?: React.ReactNode;
  className?: string;
  maxWidth?: number | string;
};

export default function TabContainer({ title, kicker, children, className, maxWidth = 1200 }: Props) {
  return (
    <div className={`tab-container-root ${className ?? ""}`} style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <div className="tab-container" style={{ maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : String(maxWidth) }}>
        {(kicker || title) && (
          <header className="tab-heading" aria-hidden={false}>
            {kicker ? <div className="kicker">{kicker}</div> : null}
            {title ? <div className="title">{title}</div> : null}
          </header>
        )}

        <section className="tab-body">{children}</section>
      </div>

      <style jsx>{`
        .tab-container {
          padding: 22px;
          background: #ffffff;
          border-radius: 10px;
          border: 1px solid #f3f3f3;
          box-shadow: 0 6px 20px rgba(11, 15, 30, 0.03);
          margin: 10px auto;
        }
        .tab-heading { text-align: center; margin-bottom: 16px; }
        .tab-heading .kicker {
          font-weight: 700;
          font-size: 1rem;
          color: #374151; /* muted dark */
          margin-bottom: 6px;
        }
        .tab-heading .title {
          font-weight: 800;
          font-size: 1.25rem;
          color: #0b1220;
        }
        .tab-body { /* allow inner components to render their own grids */ }

        /* generic form grid helper (reuse in child tabs) */
        :global(.form-grid) {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 1100px) {
          :global(.form-grid) { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 720px) {
          :global(.form-grid) { grid-template-columns: 1fr; }
        }

        /* generic field */
        :global(.field) { display:flex; flex-direction:column; }
        :global(.field .label) {
          font-size: 0.9rem;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 8px;
        }
        :global(.field .input), :global(.field input), :global(.field select), :global(.field textarea) {
          padding: 10px 12px;
          height: 44px;
          border-radius: 8px;
          border: 1px solid #e6e6e6;
          font-size: 14px;
          background: #fff;
          outline: none;
          font-family: inherit;
        }
        :global(.field textarea) { min-height: 80px; height: auto; resize: vertical; padding: 12px; }

        /* readonly */
        :global(.field .readonly) {
          padding: 10px 12px;
          border-radius: 8px;
          background: #fbfdff;
          border: 1px solid #f3f3f3;
        }

        /* smaller width helper for name fields */
        :global(.input-sm) { max-width: 420px; }

      `}</style>
    </div>
  );
}
