import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type HolidayRow = {
  id: number;
  restro_code: string;
  start_at: string;
  end_at: string;
  comment: string | null;
  created_by_id: string | null;
  created_by_name: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Supabase service configuration missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** GET: list holidays for a restro (newest first) */
export async function GET(_: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");

    const { data, error } = await supabase
      .from("RestroHolidays" as any) // no generics to avoid TS error
      .select("*")
      .eq("restro_code", codeStr)
      .order("start_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, rows: (data ?? []) as HolidayRow[] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}

/** POST: create holiday */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const body = (await req.json().catch(() => ({}))) as any;

    const insert = {
      restro_code: codeStr,
      start_at: new Date(body.start_at).toISOString(),
      end_at: new Date(body.end_at).toISOString(),
      comment: (body.comment ?? "").toString() || null,
      created_by_id: body.applied_by ?? null,
      created_by_name: body.applied_by_name ?? null,
    };

    const { error } = await supabase
      .from("RestroHolidays" as any)
      .insert(insert)
      .select("*");

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}

/** DELETE (bulk via body): soft-delete by id { "id": number } */
export async function DELETE(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const { id } = (await req.json().catch(() => ({}))) as { id?: number };

    if (!id) throw new Error("Missing holiday id");

    const { error } = await supabase
      .from("RestroHolidays" as any)
      .update({ deleted_at: new Date().toISOString() })
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
