// components/TabContainer.tsx
import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function TabContainer({ children, className = "", style }: Props) {
  return (
    <div className={`tab-container ${className}`} style={style}>
      <div className="tab-body">{children}</div>

      <style jsx>{`
        .tab-container { width:100%; box-sizing:border-box; }
        .tab-body { padding-top: 0; }
      `}</style>
    </div>
  );
}
