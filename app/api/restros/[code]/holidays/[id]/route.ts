import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(
  _req: Request,
  { params }: { params: { code: string; id: string } }
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key);

  const codeStr = String(params.code ?? "");
  const idNum = Number(params.id);

  const { error } = await supabase
    .from("RestroHolidays")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq("id", idNum)
    .eq("restro_code", codeStr);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
