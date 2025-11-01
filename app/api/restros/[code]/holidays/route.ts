import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Row = {
  id: number;
  restro_code: string;
  start_at: string;
  end_at: string;
  comment: string | null;
  created_by_id: string | null;
  created_by_name: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
};

function computeStatus(r: Row): "Active" | "Upcoming" | "Expired" | "Deleted" {
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
  const { data, error } = await supabase
    .from<"RestroHolidays", Row>("RestroHolidays" as any)
    .select("*")
    .eq("restro_code", codeStr)
    .order("start_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  const rows = (data ?? []).map((r) => ({ ...r, status: computeStatus(r) }));
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
  const start_at = new Date(body.start_at).toISOString();
  const end_at = new Date(body.end_at).toISOString();
  const comment = (body.comment ?? "").toString().trim();
  const applied_by = (body.applied_by ?? "system").toString();

  // soft-clean: mark overlapping future records inactive? (not needed for soft delete)
  const { error: insErr } = await supabase.from("RestroHolidays").insert({
    restro_code: codeStr,
    start_at,
    end_at,
    comment,
    created_by_id: applied_by,
    created_by_name: applied_by,
  } as any);

  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
