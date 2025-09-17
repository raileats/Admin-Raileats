// components/ui/KeyValueGrid.tsx
import React from "react";

export type KVRow = {
  keyLabel: string;
  value: React.ReactNode;
  // optional: small hint for label or custom className for value cell
  hint?: string | null;
  valueClassName?: string;
};

type Props = {
  rows: KVRow[];
  labelWidth?: number; // px, default 220
  maxWidth?: number; // px, default 980
};

export default function KeyValueGrid({ rows, labelWidth = 220, maxWidth = 980 }: Props) {
  return (
    <div className="kv-wrap">
      <div className="kv-grid" style={{ gridTemplateColumns: `${labelWidth}px 1fr`, maxWidth: `${maxWidth}px` }}>
        {rows.map((r, i) => (
          <React.Fragment key={`${r.keyLabel}-${i}`}>
            <div className="kv-label">{r.keyLabel}</div>
            <div className={`kv-field ${r.valueClassName ?? ""}`}>
              {r.value}
              {r.hint ? <div className="kv-hint">{r.hint}</div> : null}
            </div>
          </React.Fragment>
        ))}
      </div>

      <style jsx>{`
        .kv-wrap {
          padding: 12px 0 28px;
        }
        .kv-grid {
          display: grid;
          gap: 12px 18px;
          align-items: start;
          margin: 0 auto;
        }
        .kv-label {
          text-align: right;
          padding-top: 8px;
          color: #333;
          font-weight: 600;
          font-size: 13px;
        }
        .kv-field {
          display: block;
        }
        .kv-field .kv-hint {
          margin-top: 6px;
          color: #666;
          font-size: 12px;
        }
        /* default input/read-only boxes - you can override by passing valueClassName */
        .kv-field input,
        .kv-field select,
        .kv-field textarea {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e0e0e0;
          font-size: 13px;
          box-sizing: border-box;
          background: #fff;
        }
        .kv-field .readonly-value {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #f0f0f0;
          background: #fafafa;
          color: #222;
          font-size: 13px;
        }
        .kv-field img.preview-img {
          height: 96px;
          object-fit: cover;
          border-radius: 6px;
          border: 1px solid #eee;
          display: inline-block;
        }

        @media (max-width: 820px) {
          .kv-grid {
            grid-template-columns: 1fr !important;
            gap: 10px 0;
          }
          .kv-label {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
