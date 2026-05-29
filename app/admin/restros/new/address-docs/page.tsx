// app/admin/restros/new/address-docs/page.tsx
"use client";

import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import AddressDocsClient from "@/components/tabs/AddressDocsClient";

function readInitialData(code: string) {
  try {
    const raw = localStorage.getItem("new_restro_basic");
    if (!raw) return { RestroCode: code };
    const parsed = JSON.parse(raw);
    if (String(parsed?.RestroCode ?? "") !== String(code)) return { RestroCode: code };
    return { ...parsed, RestroCode: code };
  } catch {
    return { RestroCode: code };
  }
}

export default function NewAddressDocsPage() {
  return (
    <NewRestroCodeGate>
      {(code) => <AddressDocsClient restroCode={code} initialData={readInitialData(code)} />}
    </NewRestroCodeGate>
  );
}
