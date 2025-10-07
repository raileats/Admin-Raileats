// components/TabContainer.tsx
import React from "react";

type Props = {
  title?: string;      // centered large title
  kicker?: string;     // small uppercase kicker above title (optional)
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function TabContainer({ title, kicker, children, className = "", style }: Props) {
  return (
    <div className={`tab-container ${className}`} style={style}>
      <div className="tab-heading" aria-hidden={false}>
        {kicker && <div className="kicker">{kicker}</div>}
        {title && <div className="title">{title}</div>}
      </div>

      <div className="tab-body">{children}</div>

      <style jsx>{`
        .tab-container { width:100%; box-sizing:border-box; }
        .tab-heading .kicker { text-transform: none; color: #7b8794; font-weight:700; margin-bottom:6px; font-size:0.95rem; }
        .tab-heading .title { font-size:1.4rem; font-weight:800; color:#0b1220; margin-bottom:16px; }
      `}</style>
    </div>
  );
}
