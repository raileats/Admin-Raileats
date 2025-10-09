// path: app/api/restros/[code]/contacts/route.ts
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer"; // use server-side helper

export async function GET(request: Request, { params }: { params: { code: string } }) {
  const code = params?.code ?? "";

  if (!code) {
    return NextResponse.json({ ok: false, error: "Missing restro code" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      console.error("Supabase server client not initialized. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY?");
      return NextResponse.json({ ok: false, error: "server_client_not_initialized" }, { status: 500 });
    }

    // Query emails
    const { data: emails, error: errEmails } = await supabase
      .from("restro_email")
      .select("*")
      .eq("RestroCode", code);

    if (errEmails) {
      console.error("Supabase emails error:", errEmails);
      return NextResponse.json({ ok: false, error: "Failed to query emails", details: String(errEmails) }, { status: 500 });
    }

    // Query whatsapps
    const { data: whats, error: errWhats } = await supabase
      .from("restro_whatsapp")
      .select("*")
      .eq("RestroCode", code);

    if (errWhats) {
      console.error("Supabase whatsapps error:", errWhats);
      return NextResponse.json({ ok: false, error: "Failed to query whatsapps", details: String(errWhats) }, { status: 500 });
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
    return NextResponse.json({ ok: false, error: "Unexpected error", details: String(err) }, { status: 500 });
  }
}
