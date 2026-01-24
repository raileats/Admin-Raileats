"use client";

import React from "react";

type Props = {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminSection({ title, action, children }: Props) {
  return (
    <div className="border rounded-md p-4 bg-sky-50 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-sm">{title}</h4>
        {action}
      </div>

      {children}
    </div>
  );
}

