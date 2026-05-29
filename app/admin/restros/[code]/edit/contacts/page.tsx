// app/admin/restros/[code]/edit/contacts/page.tsx
import ContactsClient from "@/components/tabs/ContactsClient";

export default function ContactsPage({ params }: { params: { code: string } }) {
  return <ContactsClient restroCode={params.code} />;
}
