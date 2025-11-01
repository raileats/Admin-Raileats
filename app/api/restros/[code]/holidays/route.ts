import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Row = {
  id: number;
  restro_code: string;
  start_at: string;   // timestamptz
  end_at: string;     // timestamptz
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
  return createClient(url, key);
}

/** GET: list holidays for a restro (newest first) */
export async function GET(_: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const { data, error } = await supabase
      .from<Row>("RestroHolidays" as any)
      .select("*")
      .eq("restro_code", codeStr)
      .order("start_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}

/** POST: create holiday */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const body = await req.json();

    const insert = {
      restro_code: codeStr,
      start_at: new Date(body.start_at).toISOString(),
      end_at: new Date(body.end_at).toISOString(),
      comment: (body.comment ?? "").toString(),
      created_by_id: body.applied_by ?? null,
      created_by_name: body.applied_by_name ?? null,
    };

    const { error } = await supabase.from("RestroHolidays").insert(insert as any);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}

/** DELETE: soft-delete by id { "id": number } */
export async function DELETE(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const { id } = await req.json();

    if (!id) throw new Error("Missing holiday id");

    const { error } = await supabase
      .from("RestroHolidays")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("restro_code", codeStr)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
