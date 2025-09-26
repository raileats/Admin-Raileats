// app/api/outlets/route.ts
import { NextResponse } from "next/server";

type BodyShape = {
  basic?: {
    outletId?: string;
    outletName?: string;
    ownerMobile?: string;
    ownerEmail?: string | null;
    stationId?: number | string | null;
    stationObj?: {
      StationId?: number | string;
      StationName?: string;
      StationCode?: string;
      State?: string;
      District?: string;
      Lat?: number | null;
      Long?: number | null;
    } | null;
    outletLat?: number | string | null;
    outletLong?: number | string | null;
    outletStatus?: boolean;
  };
  stationSettings?: {
    minOrder?: number | string | null;
    openTime?: string | null;
    closeTime?: string | null;
    cutOffMinutes?: number | string | null;
  };
  documents?: {
    fssai?: string | null;
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BodyShape;

    // minimal validation
    const outletId = body?.basic?.outletId;
    const outletName = body?.basic?.outletName;
    const ownerMobile = body?.basic?.ownerMobile;

    if (!outletId || !outletName || !ownerMobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE;
    const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ygisiztmuzwxpnvhwrmr.supabase.co";

    if (!SERVICE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE not configured on server" }, { status: 500 });
    }

    const payload = {
      outlet_id: outletId,
      name: outletName,
      owner_mobile: ownerMobile,
      owner_email: body.basic?.ownerEmail ?? null,
      station_id: body.basic?.stationId ?? null,
      station_name: body.basic?.stationObj?.StationName ?? null,
      station_code: body.basic?.stationObj?.StationCode ?? null,
      lat: body.basic?.stationObj?.Lat ?? body.basic?.outletLat ?? null,
      long: body.basic?.stationObj?.Long ?? body.basic?.outletLong ?? null,
      status: body.basic?.outletStatus ? "active" : "inactive",
      min_order: body.stationSettings?.minOrder ?? null,
      open_time: body.stationSettings?.openTime ?? null,
      close_time: body.stationSettings?.closeTime ?? null,
      fssai: body.documents?.fssai ?? null,
      created_at: new Date().toISOString()
    };

    const url = `${PROJECT_URL}/rest/v1/Outlets`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    // try parse JSON response
    try {
      const data = JSON.parse(text);
      if (!resp.ok) {
        return NextResponse.json({ status: resp.status, error: data }, { status: 500 });
      }
      return NextResponse.json({ status: resp.status, data }, { status: 200 });
    } catch (e) {
      // not JSON? return raw text
      return NextResponse.json({ status: resp.status, raw: text }, { status: resp.status });
    }
  } catch (err) {
    console.error("API /api/outlets error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
