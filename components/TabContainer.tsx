// components/TabContainer.tsx
import React from "react";

type Props = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Simple wrapper used by tab components.
 * IMPORTANT: Tab components should NOT render their own centered headings.
 */
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
