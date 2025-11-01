import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ ok: false, error: "Missing Supabase env" }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const codeStr = String(params.code ?? "");
    const body = await req.json();

    const payload = {
      restro_code: codeStr,
      start_at: body.start_at,   // expect ISO or 'yyyy-MM-ddTHH:mm'
      end_at: body.end_at,
      comment: body.comment ?? null,
      created_by_id: body.created_by_id ?? null,
      created_by_name: body.created_by_name ?? null,
    };

    // basic validations
    if (!payload.start_at || !payload.end_at) {
      throw new Error("start_at and end_at required");
    }

    const { error } = await supabase.from("RestroHolidays").insert(payload as any);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("create holiday error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
