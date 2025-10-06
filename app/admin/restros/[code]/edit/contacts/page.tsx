import ContactsClient from "@/components/tabs/ContactsClient";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function ContactsPage({
  params,
}: {
  params: { code: string };
}) {
  const { data: emailsRaw } = await supabaseServer
    .from("restro_email")
    .select("*")
    .eq("RestroCode", params.code);

  const { data: whatsRaw } = await supabaseServer
    .from("restro_whatsapp")
    .select("*")
    .eq("RestroCode", params.code);

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
      <h2 className="text-xl font-semibold mb-4">Contact</h2>
      <ContactsClient
        restroCode={params.code} // ✅ ये जोड़ा गया
        initialEmails={emails || []}
        initialWhatsapps={whatsapps || []}
      />
    </div>
  );
}
