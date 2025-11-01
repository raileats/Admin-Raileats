import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const HOLIDAYS_TABLE = "RestroHolidays"; // <-- set your real table name here
const USERS_TABLE = "Users";             // <-- set your real users table name here
const USERS_ID_COL = "UserId";           // e.g. Users.UserId
const USERS_NAME_COL = "UserName";       // e.g. Users.UserName

function statusFromNow(startISO: string, endISO: string): "active" | "upcoming" | "expired" {
  const now = new Date().toISOString();
  if (startISO <= now && now <= endISO) return "active";
  if (now < startISO) return "upcoming";
  return "expired";
}

// GET /api/restros/[code]/holidays
export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Supabase server config missing" }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const codeStr = String(params.code ?? "");

    // 1) fetch holidays for this restro
    const { data, error } = await supabase
      .from(HOLIDAYS_TABLE)
      .select("*")
      .eq("restro_code", codeStr)
      .order("start_at", { ascending: false });

    if (error) throw error;

    const holidays = (data ?? []) as any[];

    // 2) collect user ids to map names
    const ids = Array.from(
      new Set(
        holidays
          .map((h) => (h.applied_by ? String(h.applied_by) : null))
          .filter(Boolean)
      )
    ) as string[];

    let userMap: Record<string, string> = {};
    if (ids.length) {
      const { data: users, error: uErr } = await supabase
        .from(USERS_TABLE)
        .select(`${USERS_ID_COL}, ${USERS_NAME_COL}`)
        .in(USERS_ID_COL, ids);
      if (uErr) throw uErr;

      userMap = (users ?? []).reduce((acc: any, u: any) => {
        acc[String(u[USERS_ID_COL])] = u[USERS_NAME_COL];
        return acc;
      }, {});
    }

    const rows = holidays.map((h: any) => {
      const start = h.start_at;
      const end = h.end_at;
      return {
        id: h.id,
        restro_code: String(h.restro_code ?? codeStr),
        start_at: start,
        end_at: end,
        comment: h.comment ?? "",
        applied_by: h.applied_by ?? null,
        applied_by_name: h.applied_by ? userMap[String(h.applied_by)] ?? null : null,
        status_calc: start && end ? statusFromNow(start, end) : "expired",
        created_at: h.created_at ?? null,
      };
    });

    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    console.error("holidays GET error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}

// POST /api/restros/[code]/holidays
export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: "Supabase server config missing" }, { status: 500 });
  }
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const codeStr = String(params.code ?? "");
    const body = await req.json();

    const row = {
      restro_code: codeStr,
      start_at: body.start_at,
      end_at: body.end_at,
      comment: (body.comment ?? "").trim(),
      applied_by: body.applied_by ?? null,
    };

    // simple insert
    const { error: insErr } = await supabase.from(HOLIDAYS_TABLE).insert(row);
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("holidays POST error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
