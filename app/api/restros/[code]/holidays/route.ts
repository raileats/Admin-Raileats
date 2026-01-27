import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/* ================= GET ================= */
export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();

    const { data, error } = await supabase
      .from("RestroHolidays")
      .select("*")
      .eq("restro_code", String(params.code))
      .eq("is_deleted", false)
      .order("start_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 400 }
    );
  }
}

/* ================= POST ================= */
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const body = await req.json();

    const insert = {
      restro_code: String(params.code),
      start_at: new Date(body.start_at).toISOString(),
      end_at: new Date(body.end_at).toISOString(),
      comment: body.comment || null,

      // 🔥 REAL FIX
      created_by_id: body.created_by_id ?? null,
      created_by_name: body.created_by_name ?? "system",

      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("RestroHolidays")
      .insert(insert);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 400 }
    );
  }
}

/* ================= DELETE (soft) ================= */
export async function DELETE(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const { id } = await req.json();

    const { error } = await supabase
      .from("RestroHolidays")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("restro_code", String(params.code));

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 400 }
    );
  }
}
