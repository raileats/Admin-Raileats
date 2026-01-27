import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** GET: list holidays */
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

/** POST: create holiday (USER RESOLVED FROM users TABLE) */
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const body = await req.json();

    let createdById: string | null = null;
    let createdByName = "system";

    // 🔥 MAIN FIX: resolve user from users table
    if (body.applied_by) {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, name")
        .eq("id", body.applied_by)
        .single();

      if (!userError && user) {
        createdById = String(user.id);
        createdByName = user.name;
      }
    }

    const { error } = await supabase.from("RestroHolidays").insert({
      restro_code: String(params.code),
      start_at: new Date(body.start_at).toISOString(),
      end_at: new Date(body.end_at).toISOString(),
      comment: body.comment || null,

      created_by_id: createdById,
      created_by_name: createdByName,

      updated_at: new Date().toISOString(),
    });

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
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
