// components/ui/KeyValueGrid.tsx
import React from "react";

type Row = [string, React.ReactNode];

export default function KeyValueGrid({ rows }: { rows: Row[] }) {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12, textAlign: "center", fontSize: 18 }}>
        Basic Information
      </h3>

      <dl className="kv-grid">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt>{k}</dt>
            <dd>{v ?? <span style={{ color: "#888" }}>—</span>}</dd>
          </React.Fragment>
        ))}
      </dl>

      <style jsx>{`
        .kv-grid {
          display: grid;
          grid-template-columns: 220px 1fr;
          column-gap: 24px;
          row-gap: 12px;
          align-items: start;
          max-width: 980px;
          margin: 0 auto;
        }
        dt {
          margin: 0;
          text-align: right;
          color: #333;
          font-weight: 600;
          padding-top: 6px;
          font-size: 13px;
        }
        dd {
          margin: 0;
          padding: 8px 12px;
          border: 1px solid #e6e6e6;
          border-radius: 6px;
          background: #fff;
          color: #111;
          font-size: 13px;
        }

        @media (max-width: 820px) {
          .kv-grid {
            grid-template-columns: 1fr;
          }
          dt {
            text-align: left;
            padding-right: 0;
          }
        }
      `}</style>
    </div>
  );
}
