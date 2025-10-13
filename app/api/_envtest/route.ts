// app/api/_envtest/route.ts  (server)
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hasUrl = !!process.env.SUPABASE_URL;
    const hasKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    return NextResponse.json({ ok: true, hasSupabaseUrl: hasUrl, hasServiceRoleKey: hasKey });
  } catch (err:any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
