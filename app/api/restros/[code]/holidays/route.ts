import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** GET: list holidays */
export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");

    const { data, error } = await supabase
      .from("RestroHolidays")
      .select("*")
      .eq("restro_code", codeStr)
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

/** POST: create holiday */
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const body = await req.json();

    const isSystem =
      !body.applied_by ||
      body.applied_by === "system" ||
      body.applied_by === "";

    const insert = {
      restro_code: codeStr,
      start_at: new Date(body.start_at).toISOString(),
      end_at: new Date(body.end_at).toISOString(),
      comment: body.comment || null,

      // ✅ FINAL FIX
      created_by_id: isSystem ? null : String(body.applied_by),
      created_by_name: isSystem ? "system" : String(body.applied_by_name),

      updated_at: new Date().toISOString(),
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

/** DELETE: soft delete */
export async function DELETE(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const { id } = await req.json();

    const { error } = await supabase
      .from("RestroHolidays")
      .update({ deleted_at: new Date().toISOString() })
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
