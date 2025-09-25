// components/TabLayout.tsx
"use client";

import React from "react";
import "@/app/styles/tab-layout.css"; // path project structure ke hisab se adjust karo

type Props = {
  title?: string;
  children: React.ReactNode;
  className?: string; // extra classes if needed
};

export default function TabLayout({ title = "", children, className = "" }: Props) {
  return (
    <div className={`raileats-tab-layout ${className}`}>
      {title ? (
        <div className="raileats-section-header">
          <div className="raileats-section-title">{title}</div>
        </div>
      ) : null}

      <div className="raileats-tab-body">
        {children}
      </div>
    </div>
  );
}
