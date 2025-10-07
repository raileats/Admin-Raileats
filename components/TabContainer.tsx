// components/TabContainer.tsx
"use client";

import React from "react";

type TabContainerProps = {
  title?: string;        // center title (bigger)
  kicker?: string;       // small heading above title (optional)
  children?: React.ReactNode;
  className?: string;
};

export default function TabContainer({ title, kicker, children, className = "" }: TabContainerProps) {
  return (
    <div className={`tab-container ${className}`}>
      {(kicker || title) && (
        <div className="tab-heading">
          {kicker && <div className="kicker">{kicker}</div>}
          {title && <div className="title">{title}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
