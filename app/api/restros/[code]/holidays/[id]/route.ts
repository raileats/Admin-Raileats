import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Soft delete a single holiday by path id
export async function DELETE(
  _req: Request,
  { params }: { params: { code: string; id: string } }
) {
  try {
    const supabase = srv();
    const codeStr = String(params.code ?? "");
    const idNum = Number(params.id);
    if (!idNum) throw new Error("Invalid id");

    const { error } = await supabase
      .from("RestroHolidays" as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", idNum)
      .eq("restro_code", codeStr);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 }
    );
  }
}
