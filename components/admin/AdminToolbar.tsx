import React from "react";

type Props = {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export default function AdminToolbar({ children, actions, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      <div className="flex flex-1 flex-wrap items-center gap-3">{children}</div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
