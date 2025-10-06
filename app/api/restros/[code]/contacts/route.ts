import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: { code: string } }) {
  try {
    const code = params.code;
    if (!code) {
      return NextResponse.json({ error: "Missing restro code" }, { status: 400 });
    }

    // Try multiple possible table names for emails
    const emailTables = ["restro_email", "restro_emails", "restrocontactemail"];
    let emailsData: any[] | null = null;
    let emailsErr: any = null;

    for (const tbl of emailTables) {
      const { data, error } = await supabaseServer
        .from(tbl)
        .select("id, Name, Email, Active, RestroCode")
        .eq("RestroCode", code);

      if (!error) {
        emailsData = data;
        break;
      } else {
        emailsErr = error;
      }
    }

    if (emailsData === null) {
      console.error("All email table attempts failed:", emailsErr);
      return NextResponse.json({ error: "Failed to query emails" }, { status: 500 });
    }

    // Try multiple possible table names for whatsapps
    const whatsappTables = ["restro_whatsapp", "restro_whatsapps", "restrocontactwhatsapp"];
    let whatsData: any[] | null = null;
    let whatsErr: any = null;

    for (const tbl of whatsappTables) {
      const { data, error } = await supabaseServer
        .from(tbl)
        .select("id, Name, Mobile, Active, RestroCode")
        .eq("RestroCode", code);

      if (!error) {
        whatsData = data;
        break;
      } else {
        whatsErr = error;
      }
    }

    if (whatsData === null) {
      console.error("All whatsapp table attempts failed:", whatsErr);
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
