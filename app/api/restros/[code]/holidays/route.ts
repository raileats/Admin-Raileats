import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Row = {
  id: number;
  restro_code: string;
  start_at: string;
  end_at: string;
  comment?: string | null;
  created_by_id?: string | null;
  created_by_name?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
};

function statusOf(r: Row): "Active" | "Upcoming" | "Expired" | "Deleted" {
  if (r.is_deleted) return "Deleted";
  const now = new Date().toISOString();
  if (now >= r.start_at && now <= r.end_at) return "Active";
  if (now < r.start_at) return "Upcoming";
  return "Expired";
}

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const codeStr = String(params.code ?? "");

  // ❌ no generics here — avoids “excessively deep” TS error
  const { data, error } = await supabase
    .from("RestroHolidays")
    .select("*")
    .eq("restro_code", codeStr)
    .order("start_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const rows = ((data ?? []) as Row[]).map((r) => ({ ...r, status: statusOf(r) }));
  return NextResponse.json({ ok: true, rows });
}

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const codeStr = String(params.code ?? "");
  const body = await req.json().catch(() => ({}));

  const payload = {
    restro_code: codeStr,
    start_at: new Date(body.start_at).toISOString(),
    end_at: new Date(body.end_at).toISOString(),
    comment: (body.comment ?? "").toString().trim(),
    created_by_id: (body.applied_by ?? "system").toString(),
    created_by_name: (body.applied_by ?? "system").toString(),
  };

  const { error } = await supabase.from("RestroHolidays").insert(payload as any);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
