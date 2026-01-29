import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Tab = {
  label: string;
  href: string;
};

type Props = {
  tabs: Tab[];
};

export default function Tabs({ tabs }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 border-b pb-2 mb-4">
      {tabs.map((t) => {
        const active = pathname?.includes(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "px-3 py-2 rounded text-sm font-medium",
              active
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
