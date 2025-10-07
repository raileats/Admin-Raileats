// components/TabContainer.tsx
"use client";

import React from "react";

/**
 * TabContainer — सभी Restro Edit Tabs के लिए Common Wrapper
 * -----------------------------------------------------------
 * - हर tab का title समान font, size और margin में दिखेगा
 * - अंदर का content grid layout में auto adjust होगा
 * - consistent padding, border-radius और shadow के साथ
 */

export default function TabContainer({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="tab-container">
      <h2 className="tab-title">{title}</h2>
      <div className="tab-content">{children}</div>

      <style jsx>{`
        .tab-container {
          background: #ffffff;
          border-radius: 10px;
          padding: 24px 28px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          margin: 0 auto;
          max-width: 1300px;
          color: #222;
          font-family: "Inter", "Segoe UI", sans-serif;
        }

        .tab-title {
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 20px;
          color: #1e293b;
          text-transform: capitalize;
        }

        .tab-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 20px 24px;
          align-items: flex-start;
        }

        @media (max-width: 1024px) {
          .tab-container {
            padding: 20px;
          }
          .tab-content {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 640px) {
          .tab-container {
            padding: 16px;
          }
          .tab-title {
            font-size: 16px;
          }
          .tab-content {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
}
