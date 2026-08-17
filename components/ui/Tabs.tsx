"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminUser } from "@/components/admin/AdminUserContext";
import { isSupportUser } from "@/lib/adminAccess";

type Tab = {
  label: string;
  href: string;
};

type Props = {
  tabs: Tab[];
  supportHiddenLabels?: readonly string[];
};

export default function Tabs({ tabs, supportHiddenLabels = [] }: Props) {
  const pathname = usePathname();
  const adminUser = useAdminUser();
  const visibleTabs = isSupportUser(adminUser?.user_type)
    ? tabs.filter((tab) => !supportHiddenLabels.includes(tab.label))
    : tabs;

  return (
    <nav className="flex flex-wrap gap-2 text-sm font-semibold">
      {visibleTabs.map((tab) => {
        const active = pathname?.endsWith(tab.href.replace("./", ""));
        const hiddenForSupport = supportHiddenLabels.includes(tab.label);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            data-support-hidden={hiddenForSupport ? "true" : undefined}
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
