// app/api/test-stations/route.js
export async function GET() {
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const PROJECT_URL = "https://ygisiztmuzwxpnvhwrmr.supabase.co";

  if (!SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "SUPABASE_ANON_KEY not configured in Vercel" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const url = `${PROJECT_URL}/rest/v1/Stations?select=StationId,StationName,StationCode,State&limit=5`;

  try {
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });

    const text = await r.text();
    try {
      const data = JSON.parse(text);
      return new Response(JSON.stringify({ status: r.status, data }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e) {
      return new Response(text, { status: r.status });
    }
  } catch (err) {
    console.error("test-stations GET error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
