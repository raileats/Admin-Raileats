import { getSupabaseServer } from "@/lib/supabaseServer";

export default async function ContactsPage({ params }: { params: { code: string } }) {
  const code = params.code;
  const supabase = getSupabaseServer();

  const { data: emailsRaw } = await supabase
    .from("restro_email")
    .select("*")
    .eq("RestroCode", code);

  const { data: whatsRaw } = await supabase
    .from("restro_whatsapp")
    .select("*")
    .eq("RestroCode", code);

  const emails = (emailsRaw || []).map((r: any) => ({
    name: r.Name,
    email: r.Email,
    status: !!r.Status,
  }));

  const whats = (whatsRaw || []).map((r: any) => ({
    name: r.Name,
    number: r.Number,
    status: !!r.Status,
  }));

  return (
    <div>
      {/* आपका React / JSX render यहाँ — पहले जैसा रखें */}
    </div>
  );
}
