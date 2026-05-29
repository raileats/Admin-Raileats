// app/admin/restros/new/station-settings/page.tsx
"use client";

import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import StationSettingsClient from "@/components/restro-route-tabs/StationSettingsClient";

export default function NewStationSettingsPage() {
  return <NewRestroCodeGate>{(code) => <StationSettingsClient restroCode={code} mode="new" />}</NewRestroCodeGate>;
}
