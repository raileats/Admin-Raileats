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
    <nav className="flex flex-wrap gap-2 border-b pb-3 mb-6 text-sm font-medium">
      {tabs.map((t) => {
        const active = pathname?.endsWith(t.href.replace("./", ""));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 rounded-md transition ${
              active
                ? "bg-sky-100 text-sky-700 font-semibold"
                : "hover:bg-gray-100 text-gray-700"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
