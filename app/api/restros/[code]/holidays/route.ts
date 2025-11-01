import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase service config missing" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const codeStr = String(params.code ?? "").trim();
    const body = await req.json();

    const startISO = new Date(body?.start_at).toISOString();
    const endISO   = new Date(body?.end_at).toISOString();
    const comment  = (body?.comment ?? "").toString().trim();
    const appliedBy = body?.applied_by ? String(body.applied_by) : null; // client sends this

    if (!codeStr) throw new Error("Missing restro code");
    if (!startISO || !endISO) throw new Error("Start/End datetime required");
    if (new Date(endISO).getTime() <= new Date(startISO).getTime())
      throw new Error("End must be after Start");

    // Try to resolve user's display name (optional)
    let created_by_name: string | null = null;
    if (appliedBy) {
      // adapt to your users table PK / column:
      const { data: u } = await supabase
        .from("users")
        .select("name, full_name, display_name, username")
        .eq("id", appliedBy)
        .maybeSingle();
      created_by_name =
        (u as any)?.name ??
        (u as any)?.full_name ??
        (u as any)?.display_name ??
        (u as any)?.username ??
        null;
    }

    // Insert into your table (plural) with your columns
    const { error: insErr } = await supabase.from("RestroHolidays").insert({
      restro_code: codeStr,
      start_at: startISO,
      end_at: endISO,
      comment,
      created_by_id: appliedBy,
      created_by_name,
    });
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("holiday save api error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
