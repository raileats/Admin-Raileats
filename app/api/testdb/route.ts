// debug: app/api/testdb/route.ts
import { NextResponse } from "next/server";

function maskDbUrl(url?: string) {
  if (!url) return null;
  try {
    // parse and return only host:port (no password)
    const m = url.match(/@([^/]+)/);
    if (m && m[1]) return m[1];
    return url;
  } catch (e) {
    return url;
  }
}

export async function GET() {
  const db = process.env.DATABASE_URL ?? null;
  const supabase = process.env.SUPABASE_URL ?? null;
  const role = process.env.SUPABASE_SERVICE_ROLE_KEY ? true : false;

  const response = {
    DATABASE_URL_host: maskDbUrl(db),
    SUPABASE_URL: supabase,
    SUPABASE_SERVICE_ROLE_KEY_exists: role,
    NOTE: "This is debug output. Remove this route after debugging."
  };

  return NextResponse.json(response);
}
