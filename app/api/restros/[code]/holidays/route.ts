import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const code = String(params.code ?? "").trim();
    const body = await req.json();

    const start_at = new Date(body.start_at);
    const end_at   = new Date(body.end_at);

    if (isNaN(+start_at) || isNaN(+end_at)) {
      throw new Error("Invalid start/end date");
    }
    if (end_at <= start_at) {
      throw new Error("End date must be after start date");
    }

    // optional info from client (logged-in admin)
    const created_by_id   = body.created_by_id ?? null;
    const created_by_name = body.created_by_name ?? null;

    const { error } = await supabase
      .from("RestroHolidays")
      .insert({
        restro_code: code,
        start_at: start_at.toISOString(),
        end_at:   end_at.toISOString(),
        comment:  body.comment ?? null,
        created_by_id,
        created_by_name,
      });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("holiday create error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 });
  }
}
