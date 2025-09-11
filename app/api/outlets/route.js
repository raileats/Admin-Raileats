// app/api/outlets/route.js
export async function POST(req) {
  try {
    const body = await req.json();

    // basic validation
    if (!body?.basic?.outletId || !body?.basic?.outletName || !body?.basic?.ownerMobile) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE;
    const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ygisiztmuzwxpnvhwrmr.supabase.co";

    if (!SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "SUPABASE_SERVICE_ROLE not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    // map payload to Outlets table columns
    const payload = {
      outlet_id: body.basic.outletId,
      name: body.basic.outletName,
      owner_mobile: body.basic.ownerMobile,
      owner_email: body.basic.ownerEmail || null,
      station_id: body.basic.stationId || null,
      station_name: body.basic.stationObj?.StationName || null,
      station_code: body.basic.stationObj?.StationCode || null,
      lat: body.basic.stationObj?.Lat || body.basic.outletLat || null,
      long: body.basic.stationObj?.Long || body.basic.outletLong || null,
      status: body.basic.outletStatus ? "active" : "inactive",
      min_order: body.stationSettings?.minOrder || null,
      open_time: body.stationSettings?.openTime || null,
      close_time: body.stationSettings?.closeTime || null,
      fssai: body.documents?.fssai || null
    };

    const url = `${PROJECT_URL}/rest/v1/Outlets`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation" // returns the inserted row
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    try {
      const data = JSON.parse(text);
      if (!r.ok) {
        return new Response(JSON.stringify({ status: r.status, error: data }), { status: 500, headers: { "Content-Type": "application/json" }});
      }
      // return inserted row(s)
      return new Response(JSON.stringify({ status: r.status, data }), { status: 200, headers: { "Content-Type": "application/json" }});
    } catch (err) {
      return new Response(JSON.stringify({ status: r.status, raw: text }), { status: r.status, headers: { "Content-Type": "application/json" }});
    }
  } catch (err) {
    console.error("API /api/outlets error:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}
