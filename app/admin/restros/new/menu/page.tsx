// app/admin/restros/new/menu/page.tsx
"use client";

import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import MenuTab from "@/components/restro-edit/MenuTab";

export default function NewMenuPage() {
  return <NewRestroCodeGate>{(code) => <MenuTab restroCode={code} />}</NewRestroCodeGate>;
}
