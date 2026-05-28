"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    <nav className="flex flex-wrap gap-2 text-sm font-semibold">
      {tabs.map((tab) => {
        const active = pathname?.endsWith(tab.href.replace("./", ""));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={[
              "rounded-md border px-3 py-2 transition",
              active
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
