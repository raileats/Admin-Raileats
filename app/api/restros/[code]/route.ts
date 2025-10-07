// app/api/restros/[code]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env var");
}
if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var (server only)");
}

const sb = createClient(url, serviceRoleKey);

/**
 * GET: return the restro row by RestroCode
 */
export async function GET(req: Request, { params }: { params: { code: string } }) {
  try {
    const code = String(params.code ?? "").trim();
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const { data, error, status } = await sb
      .from("RestroMaster")
      .select("*")
      .eq("RestroCode", code)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: status || 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, error: "Not found", row: null }, { status: 404 });
    }
    return NextResponse.json({ ok: true, row: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

/**
 * PATCH: update allowed fields on RestroMaster by RestroCode
 * IMPORTANT: server uses service_role key, so RLS will not block.
 */
export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  try {
    const code = String(params.code ?? "").trim();
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    // Whitelist allowed columns (EDIT this list to match your table exactly)
    const allowed = [
      // emails (2)
      "EmailAddressName1", "EmailsforOrdersReceiving1", "EmailsforOrdersStatus1",
      "EmailAddressName2", "EmailsforOrdersReceiving2", "EmailsforOrdersStatus2",

      // whatsapp (3)
      "WhatsappMobileNumberName1", "WhatsappMobileNumberforOrderDetails1", "WhatsappMobileNumberStatus1",
      "WhatsappMobileNumberName2", "WhatsappMobileNumberforOrderDetails2", "WhatsappMobileNumberStatus2",
      "WhatsappMobileNumberName3", "WhatsappMobileNumberforOrderDetails3", "WhatsappMobileNumberStatus3",

      // common
      "OwnerName","OwnerPhone","RestroEmail","RestroPhone","BrandName"
    ];

    const payload: any = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        const v = body[k];
        // skip null/empty string to avoid overwriting with blanks
        if (v === undefined || v === null) continue;
        if (typeof v === "string" && v.trim() === "") continue;
        payload[k] = v;
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ ok: false, error: "Nothing to update (payload empty after whitelist)" }, { status: 400 });
    }

    const { data, error, status } = await sb
      .from("RestroMaster")
      .update(payload)
      .eq("RestroCode", code)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error }, { status: status || 400 });
    }

    if (!data) {
      // No rows updated -> either no matching row or something else
      return NextResponse.json({ ok: false, error: "No rows updated (possibly code mismatch)" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, row: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
