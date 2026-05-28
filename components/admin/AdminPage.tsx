import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function AdminPage({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: Props) {
  return (
    <section className={`space-y-5 ${className}`}>
      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {children}
    </section>
  );
}
