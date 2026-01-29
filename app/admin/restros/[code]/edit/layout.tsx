import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import { safeGetRestro } from "@/lib/restroService";

type Props = {
  params: { code: string };
  children: React.ReactNode;
};

export default async function RestroEditLayout({ params, children }: Props) {
  const codeNum = Number(params.code);
  const { restro, error } = await safeGetRestro(codeNum);

  const headerCode = restro?.RestroCode ?? params.code;
  const headerName = restro?.RestroName ?? restro?.name ?? "";
  const stationText = restro?.StationName
    ? `${restro.StationName}${restro.StationCode ? ` (${restro.StationCode})` : ""}${
        restro.State ? ` - ${restro.State}` : ""
      }`
    : "";

  return (
    <div className="flex flex-col gap-6">
      {/* ===== HEADER ===== */}
      <Card className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">
            {headerCode}
            {headerName ? ` / ${headerName}` : ""}
          </div>
          {stationText && (
            <div className="mt-1 text-sm font-medium text-sky-700">
              {stationText}
            </div>
          )}
        </div>

        <Link href="/admin/restros">
          <button className="rounded-md bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600">
            ✕
          </button>
        </Link>
      </Card>

      {/* ===== TABS ===== */}
      <Card>
        <Tabs
          tabs={[
            { label: "Basic Information", href: "./basic" },
            { label: "Station Settings", href: "./station-settings" },
            { label: "Address & Documents", href: "./address-docs" },
            { label: "Contacts", href: "./contacts" },
            { label: "Bank", href: "./bank" },
            { label: "Future Closed", href: "./future-closed" },
            { label: "Menu", href: "./menu" },
          ]}
        />

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!error && !restro && (
          <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Restro not found
          </div>
        )}

        {children}
      </Card>
    </div>
  );
}
