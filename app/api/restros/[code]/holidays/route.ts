import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

/* ================= GET ================= */
export async function GET(_: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();

    const { data, error } = await supabase
      .from("RestroHolidays")
      .select(`
        id,
        restro_code,
        start_at,
        end_at,
        comment,
        created_at,
        updated_at,
        deleted_at,
        created_by_id,
        created_by_name
      `)
      .eq("restro_code", params.code)
      .order("start_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ ok: true, rows: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}

/* ================= POST ================= */
export async function POST(req: Request, { params }: { params: { code: string } }) {
  try {
    const supabase = srv();
    const body = await req.json();

    /* 🔐 get logged-in user from Supabase auth */
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let createdById: number | null = null;
    let createdByName = "System";

    if (user?.id) {
      const { data: u } = await supabase
        .from("users")
        .select("id, name")
        .eq("id", user.id)
        .single();

      if (u) {
        createdById = u.id;
        createdByName = u.name;
      }
    }

    const { error } = await supabase.from("RestroHolidays").insert({
      restro_code: params.code,
      start_at: body.start_at,
      end_at: body.end_at,
      comment: body.comment || null,
      created_by_id: createdById,
      created_by_name: createdByName,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
