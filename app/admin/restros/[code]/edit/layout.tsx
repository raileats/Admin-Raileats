// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import Tabs from "@/components/ui/Tabs";
import { safeGetRestro } from "@/lib/restroService";

type Props = {
  params: { code: string };
  children: React.ReactNode;
};

const tabs = [
  { label: "Basic Information", href: "./basic" },
  { label: "Station Settings", href: "./station-settings" },
  { label: "Address & Documents", href: "./address-docs" },
  { label: "Contacts", href: "./contacts" },
  { label: "Bank", href: "./bank" },
  { label: "Future Closed", href: "./future-closed" },
  { label: "Menu", href: "./menu" },
  { label: "Restro User & Password", href: "./restro-user-password" },
];

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  const headerCode = restro?.RestroCode ?? params.code;
  const headerName = restro?.RestroName ?? restro?.name ?? "";
  const stationText = restro?.StationName
    ? `${restro.StationName}${restro.StationCode ? ` (${restro.StationCode})` : ""}${restro.State ? ` - ${restro.State}` : ""}`
    : "";

  return (
    <div className="space-y-5">
      <AdminCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              {headerCode}{headerName ? ` / ${headerName}` : ""}
            </h1>
            {stationText ? <p className="mt-1 text-sm font-semibold text-slate-600">{stationText}</p> : null}
          </div>
          <Link href="/admin/restros">
            <AdminButton variant="secondary">Close</AdminButton>
          </Link>
        </div>
      </AdminCard>

      <AdminCard>
        <Tabs tabs={tabs} />
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Error: {error}
          </div>
        ) : null}
        <div className="mt-5">{children}</div>
      </AdminCard>
    </div>
  );
}
