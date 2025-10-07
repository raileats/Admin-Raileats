// app/api/restros/[code]/route.ts   (Next.js app router)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // runtime check — helpful during local dev/build
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  // use admin client
});

const WHITELIST = [
  "EmailAddressName1", "EmailsforOrdersReceiving1", "EmailsforOrdersStatus1",
  "EmailAddressName2", "EmailsforOrdersReceiving2", "EmailsforOrdersStatus2",
  "WhatsappMobileNumberName1", "WhatsappMobileNumberforOrderDetails1", "WhatsappMobileNumberStatus1",
  "WhatsappMobileNumberName2", "WhatsappMobileNumberforOrderDetails2", "WhatsappMobileNumberStatus2",
  "WhatsappMobileNumberName3", "WhatsappMobileNumberforOrderDetails3", "WhatsappMobileNumberStatus3",
  // add other columns you want to allow updating
];

export async function PATCH(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const code = params.code;
    if (!code) return NextResponse.json({ ok: false, error: "Missing RestroCode" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const payload: any = {};
    for (const k of WHITELIST) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        const v = body[k];
        if (v === null || v === undefined) continue;
        // if string and empty -> skip (avoid overwriting with empty)
        if (typeof v === "string" && v.trim() === "") continue;
        payload[k] = v;
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: true, message: "No updatable fields provided", data: null });
    }

    // Update RestroMaster table by RestroCode
    const { data, error, status } = await supabaseAdmin
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", code)
      .select()
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message ?? error }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ ok: false, error: "No rows updated. Check RestroCode or RLS." }, { status: 200 });
    }

    return NextResponse.json({ ok: true, row: data[0] });
  } catch (err: any) {
    console.error("PATCH /api/restros/:code error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
