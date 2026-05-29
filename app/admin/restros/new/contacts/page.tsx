// app/admin/restros/new/contacts/page.tsx
"use client";

import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";
import ContactsClient from "@/components/tabs/ContactsClient";

export default function NewContactsPage() {
  return (
    <NewRestroCodeGate>
      {(code) => <ContactsClient restroCode={code} />}
    </NewRestroCodeGate>
  );
}
