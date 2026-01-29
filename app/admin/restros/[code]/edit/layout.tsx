// app/admin/restros/[code]/edit/layout.tsx
import React from "react";
import Link from "next/link";
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

 "";

  return (
    <div className="flex flex-col gap-4">
      {/* ===== PAGE HEADER ===== */}
      <div className="rounded-xl border bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">
            {headerCode}
            {headerName ? ` / ${headerName}` : ""}
          </div>

          {stationText && (
            <div className="mt-1 text-sm text-sky-700 font-medium">
              {stationText}
            </div>
          )}
        </div>

        <Link href="/admin/restros">
          <button
            type="button"
            className="rounded-md bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
            title="Close"
          >
            ✕
          </button>
        </Link>
      </div>

      {/* ===== TABS ===== */}
      <div className="rounded-xl border bg-white px-4">
        <nav className="flex flex-wrap gap-2 border-b py-3 text-sm font-medium">
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="./basic">
            Basic Information
          </Link>
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="./station-settings">
            Station Settings
          </Link>
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="./address-docs">
            Address & Documents
          </Link>
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="./contacts">
            Contacts
          </Link>
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="./bank">
            Bank
          </Link>
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="./future-closed">
            Future Closed
          </Link>
          <Link className="px-3 py-2 rounded hover:bg-gray-100" href="./menu">
            Menu
          </Link>
        </nav>

        {/* ===== CONTENT ===== */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <strong>Error:</strong> {error}
              <div className="mt-1 text-xs text-red-600">
                (Check Supabase table <code>RestroMaster</code> for RestroCode{" "}
                {params.code})
              </div>
            </div>
          )}

          {!error && !restro && (
            <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Restro not found
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
