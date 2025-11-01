import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * TABLE expected (create if missing):
 *   public.RestroHolidays (
 *     id bigserial primary key,
 *     restro_code text not null,
 *     holiday_start timestamptz not null,
 *     holiday_end   timestamptz not null,
 *     holiday_comment text,
 *     created_by_email text,
 *     created_at timestamptz not null default now()
 *   );
 *
 * Optional: a public.users table with (email text, name text)
 * (If different, adjust join below.)
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const HOLIDAY_TABLE = "RestroHolidays";

function svc() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Supabase service configuration missing");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

// ---------- GET: list holidays for a restro ----------
export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = svc();
    const codeStr = String(params.code ?? "");

    // pull holidays
    const { data, error } = await supabase
      .from(HOLIDAY_TABLE)
      .select("*")
      .eq("restro_code", codeStr)
      .order("holiday_start", { ascending: false });

    if (error) throw error;

    // best-effort: enrich with user name by email if users table exists
    // We'll try to fetch unique emails & map names.
    const emails = Array.from(
      new Set((data || []).map((r) => r.created_by_email).filter(Boolean))
    ) as string[];

    let namesByEmail: Record<string, string> = {};
    if (emails.length > 0) {
      const { data: users, error: uErr } = await supabase
        .from("users")
        .select("email, name")
        .in("email", emails);
      if (!uErr && users) {
        users.forEach((u: any) => {
          if (u?.email) namesByEmail[u.email] = u?.name ?? null;
        });
      }
    }

    const items = (data || []).map((r: any) => ({
      id: r.id,
      restro_code: r.restro_code,
      holiday_start: r.holiday_start,
      holiday_end: r.holiday_end,
      holiday_comment: r.holiday_comment,
      created_by_email: r.created_by_email,
      created_by_name: r.created_by_email ? namesByEmail[r.created_by_email] ?? null : null,
      created_at: r.created_at,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("holidays GET error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed" },
      { status: 400 }
    );
  }
}

// ---------- POST: add holiday ----------
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = svc();
    const codeStr = String(params.code ?? "");

    const body = await req.json();
    const startIso: string = body?.start_iso;
    const endIso: string = body?.end_iso;
    const comment: string | null = body?.comment ?? null;
    const createdByEmail: string | null = body?.created_by_email ?? null;

    if (!startIso || !endIso) throw new Error("start_iso and end_iso required");
    const s = new Date(startIso);
    const e = new Date(endIso);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()))
      throw new Error("Invalid date/time");
    if (s >= e) throw new Error("End must be after start");

    const { error } = await supabase.from(HOLIDAY_TABLE).insert({
      restro_code: codeStr,
      holiday_start: s.toISOString(),
      holiday_end: e.toISOString(),
      holiday_comment: comment,
      created_by_email: createdByEmail,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("holidays POST error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Failed" },
      { status: 400 }
    );
  }
}
