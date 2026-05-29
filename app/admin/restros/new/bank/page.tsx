// app/admin/restros/new/bank/page.tsx
"use client";

import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import BankTab from "@/components/restro-edit/BankTab";

export default function NewBankPage() {
  return <NewRestroCodeGate>{(code) => <BankTab restroCode={code} />}</NewRestroCodeGate>;
}
