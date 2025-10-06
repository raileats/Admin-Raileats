// path: app/api/restros/[code]/contacts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // use your server-side supabase helper

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const code = params?.code ?? "";

  if (!code) {
    return NextResponse.json({ error: "Missing restro code" }, { status: 400 });
  }

  try {
    // Query emails
    const { data: emails, error: errEmails } = await supabaseServer
      .from("restro_email")
      .select("*")
      .eq("RestroCode", code);

    if (errEmails) {
      console.error("Supabase emails error:", errEmails);
      return NextResponse.json({ error: "Failed to query emails", details: errEmails }, { status: 500 });
    }

    // Query whatsapps
    const { data: whats, error: errWhats } = await supabaseServer
      .from("restro_whatsapp")
      .select("*")
      .eq("RestroCode", code);

    if (errWhats) {
      console.error("Supabase whatsapps error:", errWhats);
      return NextResponse.json({ error: "Failed to query whatsapps", details: errWhats }, { status: 500 });
    }

    // Normalize shape for client
    const mapEmail = (r: any) => ({
      id: r.id ?? `${r.RestroCode}-email-${Math.random()}`,
      name: r.Name ?? "",
      value: r.Email ?? "",
      active: !!r.Active,
      raw: r,
    });

    const mapWhats = (r: any) => ({
      id: r.id ?? `${r.RestroCode}-wa-${Math.random()}`,
      name: r.Name ?? "",
      value: r.Mobile ?? "",
      active: !!r.Active,
      raw: r,
    });

    return NextResponse.json({
      ok: true,
      emails: (emails || []).map(mapEmail),
      whatsapps: (whats || []).map(mapWhats),
    });
  } catch (err: any) {
    console.error("Contacts route unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error", details: String(err) }, { status: 500 });
  }
}
