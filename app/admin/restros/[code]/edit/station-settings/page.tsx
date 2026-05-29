// app/admin/restros/[code]/edit/station-settings/page.tsx
import React from "react";
import StationSettingsClient from "@/components/restro-route-tabs/StationSettingsClient";
import { getRestroById } from "@/lib/restroService";

type Props = { params: { code: string } };

export default async function StationSettingsPage({ params }: Props) {
  const code = Number(params.code);
  if (Number.isNaN(code)) return <div className="p-5">Invalid Restro Code</div>;
  const restro = await getRestroById(code);
  if (!restro) return <div className="p-5">Restro not found</div>;
  return <StationSettingsClient initialData={restro} restroCode={code} />;
}
