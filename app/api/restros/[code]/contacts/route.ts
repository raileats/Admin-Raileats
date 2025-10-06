// app/api/restros/[code]/contacts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const code = params.code;
    if (!code) {
      return NextResponse.json({ error: "Missing restro code" }, { status: 400 });
    }

    // Fetch emails
    const { data: emailsData, error: emailsErr } = await supabaseServer
      .from("restro_email")
      .select("id, Name, Email, Active, RestroCode")
      .eq("RestroCode", code);

    if (emailsErr) {
      console.error("supabase restro_email error:", emailsErr);
      return NextResponse.json({ error: "Failed to query emails" }, { status: 500 });
    }

    // Fetch whatsapps
    const { data: whatsData, error: whatsErr } = await supabaseServer
      .from("restro_whatsapp")
      .select("id, Name, Mobile, Active, RestroCode")
      .eq("RestroCode", code);

    if (whatsErr) {
      console.error("supabase restro_whatsapp error:", whatsErr);
      return NextResponse.json({ error: "Failed to query whatsapps" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      emails: emailsData ?? [],
      whatsapps: whatsData ?? [],
    });
  } catch (err) {
    console.error("contacts route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
