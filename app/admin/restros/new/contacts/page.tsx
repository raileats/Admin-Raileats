// app/admin/restros/new/contacts/page.tsx
import ContactsClient from "@/components/tabs/ContactsClient";
import NewRestroCodeGate from "@/components/restro-route-tabs/NewRestroCodeGate";

export default function NewContactsPage() {
  return (
    <NewRestroCodeGate>
      {(code) => <ContactsClient restroCode={code} />}
    </NewRestroCodeGate>
  );
}
