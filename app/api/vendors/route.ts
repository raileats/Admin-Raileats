// app/api/vendors/route.ts
import { db } from "@/lib/db";

export async function GET() {
  const { data, error } = await db.from("Vendors").select("*").limit(10);
  return Response.json({ data, error });
}


async function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  // dynamic ESM import so it doesn't run at module-evaluation time
  const mod = await import("@supabase/supabase-js");
  return mod.createClient(url, key);
}

export async function GET(req: Request) {
  try {
    const supabase = await getSupabaseClient();

    if (supabase) {
      // Example: read outlets table — adjust columns/table as per your DB
      const { data, error } = await supabase
        .from("outlets")
        .select("*")
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ data });
    } else {
      // fallback to direct pg pool if supabase client not configured
      const res = await db.query("SELECT * FROM outlets ORDER BY id DESC LIMIT $1", [50]);
      return NextResponse.json({ data: res.rows });
    }
  } catch (err) {
    console.error("GET /api/vendors error:", err);
    return NextResponse.json({ error: "Failed to fetch vendors", details: String(err) }, { status: 500 });
  }
}
