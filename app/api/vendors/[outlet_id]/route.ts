// app/api/vendors/[outlet_id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
);

export async function PATCH(
  req: Request,
  { params }: { params: { outlet_id: string } }
) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from("vendors")
      .update(body)
      .eq("outlet_id", params.outlet_id);

    if (error) throw error;

    // data may be null — use fallback to empty array to safely get length
    const updatedCount = (data ?? []).length;

    return NextResponse.json({ updated: updatedCount });
  } catch (err: any) {
    console.error("PATCH error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
