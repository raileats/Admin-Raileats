import ContactsClient from "@/components/tabs/ContactsClient";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function ContactsPage({
  params,
}: {
  params: { code: string };
}) {
  const { data: emails } = await supabaseServer
    .from("restro_email")
    .select("*")
    .eq("RestroCode", params.code);

  const { data: whatsapps } = await supabaseServer
    .from("restro_whatsapp")
    .select("*")
    .eq("RestroCode", params.code);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Contact</h2>
      <ContactsClient
        initialEmails={emails || []}
        initialWhatsapps={whatsapps || []}
      />
    </div>
  );
}
