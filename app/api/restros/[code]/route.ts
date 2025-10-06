// app/api/restros/[code]/contacts/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const restroCode = params.code;
    if (!restroCode) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const { data: emails, error: e1 } = await supabaseServer
      .from("restro_email")
      .select("*")
      .eq("RestroCode", restroCode);

    const { data: whats, error: e2 } = await supabaseServer
      .from("restro_whatsapp")
      .select("*")
      .eq("RestroCode", restroCode);

    if (e1 || e2) {
      console.error("supabase fetch errors", e1, e2);
      return NextResponse.json({ error: (e1 || e2).message || "Supabase error" }, { status: 500 });
    }

    // normalize keys for client (optional)
    const emailsNorm = (emails || []).map((r: any) => ({
      id: r.id,
      name: r.Name ?? "",
      value: r.Email ?? "",
      active: !!r.Active,
    }));
    const whatsNorm = (whats || []).map((r: any) => ({
      id: r.id,
      name: r.Name ?? "",
      value: r.Mobile ?? "",
      active: !!r.Active,
    }));

    return NextResponse.json({ emails: emailsNorm, whatsapps: whatsNorm });
  } catch (err: any) {
    console.error("contacts GET unexpected:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const restroCode = params.code;
    const body = await req.json();
    const emails: Array<{ name: string; value: string; active: boolean }> = body.emails || [];
    const whatsapps: Array<{ name: string; value: string; active: boolean }> = body.whatsapps || [];

    if (!restroCode) {
      return NextResponse.json({ error: "Missing restro code" }, { status: 400 });
    }

    // delete existing rows for this restro (simple approach)
    let { error: delE } = await supabaseServer.from("restro_email").delete().eq("RestroCode", restroCode);
    if (delE) {
      console.error("delete restro_email error:", delE);
      return NextResponse.json({ error: delE.message }, { status: 500 });
    }

    let { error: delW } = await supabaseServer.from("restro_whatsapp").delete().eq("RestroCode", restroCode);
    if (delW) {
      console.error("delete restro_whatsapp error:", delW);
      return NextResponse.json({ error: delW.message }, { status: 500 });
    }

    const emailRows = emails
      .filter((e) => (e.value || "").toString().trim() !== "")
      .map((e) => ({
        RestroCode: restroCode,
        Name: e.name ?? "",
        Email: e.value ?? "",
        Active: e.active ? true : false,
        CreatedAt: new Date().toISOString(),
      }));

    if (emailRows.length > 0) {
      const { error: insE } = await supabaseServer.from("restro_email").insert(emailRows);
      if (insE) {
        console.error("insert restro_email error:", insE);
        return NextResponse.json({ error: insE.message }, { status: 500 });
      }
    }

    const whatsappRows = whatsapps
      .filter((w) => (w.value || "").toString().trim() !== "")
      .map((w) => ({
        RestroCode: restroCode,
        Name: w.name ?? "",
        Mobile: w.value ?? "",
        Active: w.active ? true : false,
        CreatedAt: new Date().toISOString(),
      }));

    if (whatsappRows.length > 0) {
      const { error: insW } = await supabaseServer.from("restro_whatsapp").insert(whatsappRows);
      if (insW) {
        console.error("insert restro_whatsapp error:", insW);
        return NextResponse.json({ error: insW.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("contacts POST unexpected:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
