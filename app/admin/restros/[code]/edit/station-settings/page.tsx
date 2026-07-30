// app/admin/restros/[code]/edit/station-settings/page.tsx

import React from "react";
import { unstable_noStore as noStore } from "next/cache";
import StationSettingsClient from "@/components/restro-route-tabs/StationSettingsClient";
import { getRestroById } from "@/lib/restroService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: {
    code: string;
  };
};

export default async function StationSettingsPage({ params }: Props) {
  noStore();

  const code = Number(params.code);

  if (!Number.isFinite(code) || code <= 0) {
    return <div className="p-5">Invalid Restro Code</div>;
  }

  const restro = await getRestroById(code);

  if (!restro) {
    return <div className="p-5">Restro not found</div>;
  }

  return (
    <StationSettingsClient
      initialData={restro}
      restroCode={code}
    />
  );
}
