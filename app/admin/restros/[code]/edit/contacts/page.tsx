import ContactsClient from "@/components/tabs/ContactsClient";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function ContactsPage({ params }: { params: { code: string } }) {
  const code = params.code;
  const { data: emailsRaw } = await supabaseServer.from("restro_email").select("*").eq("RestroCode", code);
  const { data: whatsRaw } = await supabaseServer.from("restro_whatsapp").select("*").eq("RestroCode", code);

  const emails = (emailsRaw || []).map((r: any) => ({
    id: r.id ?? `${r.RestroCode}-email-${Math.random()}`,
    name: r.Name ?? "",
    value: r.Email ?? "",
    active: !!r.Active,
  }));

  const whatsapps = (whatsRaw || []).map((r: any) => ({
    id: r.id ?? `${r.RestroCode}-wa-${Math.random()}`,
    name: r.Name ?? "",
    value: r.Mobile ?? "",
    active: !!r.Active,
  }));

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Contacts</h2>
      {/* @ts-ignore */}
      <ContactsClient restroCode={code} initialEmails={emails} initialWhatsapps={whatsapps} />
    </div>
  );
}
