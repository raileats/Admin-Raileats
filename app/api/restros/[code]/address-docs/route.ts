import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE config: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  global: { headers: { "x-application-client": "admin-api" } },
});

type Params = { params: { code: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const codeStr = params?.code;
    if (!codeStr) {
      return NextResponse.json({ error: "Missing restro code in URL" }, { status: 400 });
    }
    const restroCode = Number(codeStr);
    if (Number.isNaN(restroCode)) {
      return NextResponse.json({ error: "Invalid restro code" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
    }

    // allowed/whitelist keys (keep in sync with client)
    const ALLOWED_KEYS = [
      "RestroAddress",
      "City",
      "State",
      "District",
      "PinCode",
      "RestroLatitude",
      "RestroLongitude",
      "FSSAINumber",
      "FSSAIExpiryDate",
      "FSSAICopyPath",
      "FSSAIStatus",
      "GSTNumber",
      "GSTType",
      "GSTCopyPath",
      "GSTStatus",
      "PANNumber",
      "PANType",
      "PANCopyPath",
      "PANStatus",
    ];

    const updateObj: Record<string, any> = {};
    for (const k of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(body, k)) {
        const val = (body as any)[k];
        updateObj[k] = val === "" ? null : val;
      }
    }

    if (Object.keys(updateObj).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    // Execute update
    const { data, error } = await supabaseAdmin
      .from("RestroMaster")
      .update(updateObj)
      .eq("RestroCode", restroCode)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message ?? error }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "No row updated (maybe restro not found)" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
