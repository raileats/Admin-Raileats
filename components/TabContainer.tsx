// components/TabContainer.tsx
import React from "react";

export default function TabContainer({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="restro-tab-container" role="region" aria-label={title ?? "tab"}>
      {title && <div className="restro-tab-heading">{title}</div>}
      <div>{children}</div>
    </div>
  );
}
