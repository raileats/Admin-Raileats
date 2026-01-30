import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function srv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = params.code;
    if (!restroCode) {
      return NextResponse.json(
        { ok: false, error: "Missing restro code" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const raileatsStatus = Number(body?.raileatsStatus);

    if (![0, 1].includes(raileatsStatus)) {
      return NextResponse.json(
        { ok: false, error: "Invalid raileatsStatus value" },
        { status: 400 }
      );
    }

    const supabase = srv();

    /**
     * 🔴 IMPORTANT
     * Column name MUST be exactly same as DB
     * Mostly it is: RaileatsStatus
     */
    const { error } = await supabase
      .from("RestroMaster")
      .update({
        RaileatsStatus: raileatsStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("RestroCode", restroCode);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PATCH /status failed:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
