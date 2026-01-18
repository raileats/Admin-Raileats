import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ================= GET : LIST ================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    const { data, error } = await supabase
      .from("RestroFSSAI")
      .select("*")
      .eq("restro_code", code)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, rows: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

/* ================= POST : ADD NEW ================= */
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const form = await req.formData();

    const fssai_number = String(form.get("fssai_number") || "").trim();
    const expiry_date = form.get("expiry_date") || null;

    if (!fssai_number) {
      return NextResponse.json(
        { ok: false, error: "FSSAI number required" },
        { status: 400 }
      );
    }

    /* 🔥 STEP 1: OLD RECORDS INACTIVE */
    await supabase
      .from("RestroFSSAI")
      .update({ status: "inactive" })
      .eq("restro_code", code);

    /* 🔥 STEP 2: INSERT NEW */
    const { error } = await supabase.from("RestroFSSAI").insert({
      restro_code: code,
      fssai_number,
      expiry_date,
      status: "active",
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}

/* ================= PATCH : TOGGLE ================= */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    /* 🔥 MAKE OTHERS INACTIVE */
    if (status === "active") {
      const { data } = await supabase
        .from("RestroFSSAI")
        .select("restro_code")
        .eq("id", id)
        .single();

      if (data?.restro_code) {
        await supabase
          .from("RestroFSSAI")
          .update({ status: "inactive" })
          .eq("restro_code", data.restro_code);
      }
    }

    await supabase
      .from("RestroFSSAI")
      .update({ status })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
