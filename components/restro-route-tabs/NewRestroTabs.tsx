// components/restro-route-tabs/NewRestroTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Tab = {
  label: string;
  href: string;
  requiresCode?: boolean;
};

const tabs: Tab[] = [
  { label: "Basic Information", href: "/admin/restros/new/basic" },
  { label: "Station Settings", href: "/admin/restros/new/station-settings", requiresCode: true },
  { label: "Address & Documents", href: "/admin/restros/new/address-docs", requiresCode: true },
  { label: "Contacts", href: "/admin/restros/new/contacts", requiresCode: true },
  { label: "Bank", href: "/admin/restros/new/bank", requiresCode: true },
  { label: "Future Closed", href: "/admin/restros/new/future-closed", requiresCode: true },
  { label: "Menu", href: "/admin/restros/new/menu", requiresCode: true },
  { label: "Restro User & Password", href: "/admin/restros/new/restro-user-password", requiresCode: true },
];

function readCode() {
  try {
    return localStorage.getItem("new_restro_code") || "";
  } catch {
    return "";
  }
}

export default function NewRestroTabs() {
  const pathname = usePathname();
  const [code, setCode] = useState("");

  useEffect(() => {
    setCode(readCode());

    function refresh() {
      setCode(readCode());
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("new-restro-code-changed", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("new-restro-code-changed", refresh);
    };
  }, []);

  useEffect(() => {
    setCode(readCode());
  }, [pathname]);

  const activePath = useMemo(() => pathname || "", [pathname]);

  return (
    <div>
      <nav className="flex flex-wrap gap-2 text-sm font-semibold">
        {tabs.map((tab) => {
          const locked = tab.requiresCode && !code;
          const active = activePath === tab.href || activePath.endsWith(tab.href.replace("/admin/restros/new/", ""));
          const className = [
            "rounded-md border px-3 py-2 transition",
            active
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950",
            locked ? "cursor-not-allowed opacity-45 hover:border-transparent hover:bg-transparent hover:text-slate-600" : "",
          ].join(" ");

          if (locked) {
            return (
              <button
                key={tab.href}
                type="button"
                className={className}
                title="Save Basic Information first"
                onClick={() => alert("Please save Basic Information first. RestroCode create hone ke baad ye tab open hoga.")}
              >
                {tab.label}
              </button>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} className={className}>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {!code ? (
        <p className="mt-3 text-xs font-semibold text-amber-700">
          Basic Information save karne ke baad baaki tabs unlock honge.
        </p>
      ) : (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          New RestroCode: {code}. Baaki tabs ab available hain.
        </p>
      )}
    </div>
  );
}
