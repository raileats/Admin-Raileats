import React from "react";

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export default function AdminCard({
  children,
  title,
  subtitle,
  actions,
  className = "",
  bodyClassName = "",
}: Props) {
  return (
    <section className={`rounded-md border border-slate-200 bg-white ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <h2 className="text-base font-bold text-slate-900">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      )}

      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
