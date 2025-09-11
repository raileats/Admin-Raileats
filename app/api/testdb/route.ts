// TEMP debug route — app/api/testdb/route.ts
import { NextResponse } from "next/server";

function maskConnStr(s?: string) {
  if (!s) return null;
  // remove password, keep host:port and path
  try {
    return s.replace(/:\/\/([^:\/]+):([^@]+)@/, "://$1:****@");
  } catch (e) {
    return s;
  }
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? null;
  const supabaseUrl = process.env.SUPABASE_URL ?? null;
  const hasRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // try real DB connect using pg (node-postgres)
  let dbTest = { ok: false, message: null, hostUsed: null };
  if (dbUrl) {
    try {
      // dynamic import so build won't fail if pg isn't available at build-time
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
      });
      const res = await pool.query("SELECT NOW()");
      dbTest.ok = true;
      dbTest.message = `ok: ${res.rows[0].now}`;
      // show host portion (masked)
      const hostMatch = dbUrl.match(/@([^/]+)/);
      dbTest.hostUsed = hostMatch ? hostMatch[1] : null;
      await pool.end();
    } catch (err: any) {
      // show the error but do not print full connection string or password
      dbTest.ok = false;
      dbTest.message = err?.message ?? String(err);
      const hostMatch = dbUrl.match(/@([^/]+)/);
      dbTest.hostUsed = hostMatch ? hostMatch[1] : null;
    }
  } else {
    dbTest.message = "no DATABASE_URL present";
  }

  const out = {
    DATABASE_URL_masked: maskConnStr(dbUrl),
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY_exists: hasRole,
    dbTest,
    NOTE: "Temporary debug route — remove after debugging."
  };

  return NextResponse.json(out);
}
