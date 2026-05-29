// app/admin/restros/new/future-closed/page.tsx
"use client";

import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import FutureClosedTab from "@/components/restro-edit/FutureClosedTab";

export default function NewFutureClosedPage() {
  return <NewRestroCodeGate>{(code) => <FutureClosedTab restroCode={code} />}</NewRestroCodeGate>;
}
