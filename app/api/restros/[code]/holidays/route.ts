import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const HOLIDAYS_TABLE = "RestroHolidays";
const USERS_TABLE = "Users"; // change if your table name is different

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { ok: false, error: "Supabase service configuration missing" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const codeStr = String(params.code ?? "");

    // fetch all holidays for this restro
    const { data: holidays, error: hErr } = await supabase
      .from(HOLIDAYS_TABLE)
      .select("*")
      .eq("restro_code", codeStr)
      .order("start_at", { ascending: false });

    if (hErr) throw hErr;

    // collect unique applied_by ids
    const ids = Array.from(
      new Set(
        (holidays ?? [])
          .map((r) => r.applied_by)
          .filter((v: any) => v !== null && v !== undefined && String(v).trim() !== "")
          .map((v: any) => String(v))
      )
    );

    let nameMap = new Map<string, string>();
    if (ids.length > 0) {
      const { data: users, error: uErr } = await supabase
        .from(USERS_TABLE)
        .select("id, name")
        .in("id", ids);
      if (uErr) throw uErr;
      (users ?? []).forEach((u: any) => nameMap.set(String(u.id), u.name ?? ""));
    }

    const items = (holidays ?? []).map((r: any) => ({
      id: r.id,
      restro_code: String(r.restro_code ?? codeStr),
      start_at: r.start_at,
      end_at: r.end_at,
      comment: r.comment ?? "",
      applied_by: r.applied_by ?? null,
      applied_by_name: r.applied_by ? nameMap.get(String(r.applied_by)) ?? null : null,
      created_at: r.created_at ?? null,
      updated_at: r.updated_at ?? null,
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    console.error("holidays GET error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { code: string } }
) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { ok: false, error: "Supabase service configuration missing" },
      { status: 500 }
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const codeStr = String(params.code ?? "");
    const body = await req.json();

    const payload = {
      restro_code: codeStr,
      start_at: body?.start_at ?? null, // ISO string
      end_at: body?.end_at ?? null,     // ISO string
      comment: (body?.comment ?? "").trim(),
      applied_by: body?.applied_by ? String(body.applied_by) : null,
    };

    if (!payload.start_at || !payload.end_at) {
      throw new Error("start_at and end_at are required");
    }

    const { error: insErr } = await supabase.from(HOLIDAYS_TABLE).insert(payload);
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("holidays POST error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 400 });
  }
}
