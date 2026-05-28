// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
import AdminButton from "@/components/admin/AdminButton";
import AdminCard from "@/components/admin/AdminCard";
import AdminPage from "@/components/admin/AdminPage";
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
    ? `${restro.StationName}${
        restro.StationCode ? ` (${restro.StationCode})` : ""
      }${restro.State ? ` - ${restro.State}` : ""}`
    : "";

  return (
    <AdminPage
      title={`${headerCode}${headerName ? ` / ${headerName}` : ""}`}
      subtitle={stationText || "Restaurant outlet configuration"}
      actions={
        <Link href="/admin/restros">
          <AdminButton variant="secondary">Close</AdminButton>
        </Link>
      }
    >
      <AdminCard bodyClassName="p-0">
        <div className="border-b border-slate-200 px-5 pt-4">
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
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!error && !restro && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Restro not found
            </div>
          )}

          {children}
        </div>
      </AdminCard>
    </AdminPage>
  );
}
