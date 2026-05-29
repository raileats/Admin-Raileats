// app/admin/restros/new/restro-user-password/page.tsx
"use client";

import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import RestroUserPasswordClient from "@/components/restro-route-tabs/RestroUserPasswordClient";

export default function NewRestroUserPasswordPage() {
  return <NewRestroCodeGate>{(code) => <RestroUserPasswordClient restroCode={code} />}</NewRestroCodeGate>;
}
