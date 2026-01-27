import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type HolidayRow = {
  id: number;
  restro_code: string;
  start_at: string;
  end_at: string;
  comment: string | null;
  created_by_id: number | null;
  created_by_name: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase service configuration missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET: list holidays for a restro
 * - joins users table to get created_by_name
 * - returns updated_at for UI
 */
export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");

    const { data, error } = await supabase
      .from("RestroHolidays")
      .select(
        `
        id,
        restro_code,
        start_at,
        end_at,
        comment,
        created_by_id,
        updated_at,
        deleted_at,
        users (
          name
        )
      `
      )
      .eq("restro_code", codeStr)
      .order("start_at", { ascending: false });

    if (error) throw error;

    const rows: HolidayRow[] =
      (data ?? []).map((r: any) => ({
        id: r.id,
        restro_code: r.restro_code,
        start_at: r.start_at,
        end_at: r.end_at,
        comment: r.comment,
        created_by_id: r.created_by_id,
        created_by_name: r.users?.name ?? null,
        updated_at: r.updated_at ?? null,
        deleted_at: r.deleted_at ?? null,
      })) ?? [];

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}

/**
 * POST: create holiday
 * - saves created_by_id
 * - sets updated_at
 */
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const body = (await req.json().catch(() => ({}))) as any;

    if (!body.start_at || !body.end_at) {
      throw new Error("Missing start_at or end_at");
    }

    const insert = {
      restro_code: codeStr,
      start_at: new Date(body.start_at).toISOString(),
      end_at: new Date(body.end_at).toISOString(),
      comment: (body.comment ?? "").toString() || null,
      created_by_id:
        body.applied_by && body.applied_by !== "system"
          ? Number(body.applied_by)
          : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("RestroHolidays")
      .insert(insert);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}

/**
 * DELETE: soft delete holiday by id
 * - updates deleted_at + updated_at
 */
export async function DELETE(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const { id } = (await req.json().catch(() => ({}))) as { id?: number };

    if (!id) throw new Error("Missing holiday id");

    const { error } = await supabase
      .from("RestroHolidays")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("restro_code", codeStr)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}
