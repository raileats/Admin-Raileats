import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function PATCH(req: NextRequest, { params }: { params: { code: string; id: string } }) {
  try {
    const supabase = adminClient();
    const id = Number(params.id);
    if (!id) throw new Error("Missing id");

    const b = await req.json().catch(() => ({}));
    const updates: any = {};

    for (const k of [
      "item_code","item_name","item_description","item_category","item_cuisine",
      "start_time","end_time","restro_price","base_price","gst_percent","selling_price","status"
    ]) {
      if (b[k] !== undefined) updates[k] = b[k];
    }

    if (updates.base_price != null || updates.gst_percent != null) {
      const base = Number(updates.base_price ?? 0);
      const gst = Number(updates.gst_percent ?? 0);
      if (!Number.isNaN(base)) {
        updates.selling_price = Math.round(base * (1 + gst/100) * 100) / 100;
      }
    }
    if (typeof updates.start_time === "string" && updates.start_time.length === 5) {
      updates.start_time = updates.start_time + ":00";
    }
    if (typeof updates.end_time === "string" && updates.end_time.length === 5) {
      updates.end_time = updates.end_time + ":00";
    }

    const { data, error } = await supabase
      .from("RestroMenuItems")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, row: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "failed" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { code: string; id: string } }) {
  try {
    const supabase = adminClient();
    const id = Number(params.id);
    if (!id) throw new Error("Missing id");

    // soft delete → mark as DELETED
    const { data, error } = await supabase
      .from("RestroMenuItems")
      .update({ status: "DELETED" })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, row: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? "failed" }, { status: 400 });
  }
}
