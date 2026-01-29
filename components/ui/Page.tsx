import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function Page({ title, subtitle, actions, children }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}

      {children}
    </div>
  );
}
