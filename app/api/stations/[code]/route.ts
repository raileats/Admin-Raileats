// app/api/stations/[code]/route.ts
// Server-side API for Admin project (Admin must host this route).
// Supports GET and OPTIONS (CORS preflight) to avoid 405 errors from browsers.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

type StationRow = {
  StationCode?: string;
  StationName?: string;
  State?: string;
  District?: string;
  image_url?: string | null;
};

const getEnv = () => {
  // prefer explicit admin/service env names, fallback to common ones
  return {
    PROJECT_URL:
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_PROJECT_URL,
    SERVICE_KEY:
      process.env.SUPABASE_SERVICE_ROLE ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_KEY,
    // allow listing a frontend origin for CORS (optional)
    FRONTEND_ORIGIN: process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_FRONTEND_URL ?? "*",
  };
};

const corsHeaders = (origin: string | null = "*") => ({
  "Access-Control-Allow-Origin": origin ?? "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  // allow caching policy control from client if needed
  "Access-Control-Max-Age": "600",
});

function buildPublicImageUrl(projectUrl: string, path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const cleaned = String(path).replace(/^\/+/, "");
  // default bucket "public" — change if your bucket name differs
  return `${projectUrl.replace(/\/$/, "")}/storage/v1/object/public/public/${encodeURIComponent(cleaned)}`;
}

async function fetchJsonWithKey(url: string, serviceKey: string) {
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
  return res;
}

export async function OPTIONS() {
  // Preflight response
  const { FRONTEND_ORIGIN } = getEnv();
  return new NextResponse(null, { status: 204, headers: corsHeaders(FRONTEND_ORIGIN) });
}

export async function GET(_request: Request, { params }: { params: { code?: string } }) {
  const { PROJECT_URL, SERVICE_KEY, FRONTEND_ORIGIN } = getEnv();

  const headers = corsHeaders(FRONTEND_ORIGIN ?? "*");

  try {
    const codeRaw = params?.code || "";
    const code = String(codeRaw).toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Missing station code" }, { status: 400, headers });
    }

    if (!PROJECT_URL) {
      return NextResponse.json({ error: "SUPABASE URL not configured" }, { status: 500, headers });
    }
    if (!SERVICE_KEY) {
      return NextResponse.json({ error: "SUPABASE service key not configured" }, { status: 500, headers });
    }

    // 1) Station metadata
    const stationUrl = `${PROJECT_URL.replace(/\/$/, "")}/rest/v1/Stations?select=StationCode,StationName,State,District,image_url&StationCode=eq.${encodeURIComponent(
      code
    )}&limit=1`;

    const stationResp = await fetchJsonWithKey(stationUrl, SERVICE_KEY);
    let station: StationRow | null = null;
    if (stationResp.ok) {
      const stationJson: StationRow[] = await stationResp.json().catch(() => []);
      station = stationJson && stationJson.length ? stationJson[0] : null;
    } else {
      // Log for debugging (Vercel logs)
      const text = await stationResp.text().catch(() => "");
      console.error("Station fetch error:", stationResp.status, text);
      // We continue — restaurant list may still be available
    }

    // 2) RestroMaster query (use your exact column names)
    // We request a broad select and filter in JS for robustness
    const selectCols = [
      "RestroCode",
      "RestroName",
      "RestroRating",
      "IsPureVeg",
      "RestroDisplayPhoto",
      "0penTime",
      "ClosedTime",
      "MinimumOrdermValue",
      "IsActive",
      "FSSAIStatus",
      "RaileatsStatus",
      "StationCode",
      "StationName",
    ].join(",");

    const restroUrl = `${PROJECT_URL.replace(/\/$/, "")}/rest/v1/RestroMaster?select=${encodeURIComponent(
      selectCols
    )}&StationCode=eq.${encodeURIComponent(code)}`;

    const restroResp = await fetchJsonWithKey(restroUrl, SERVICE_KEY);

    if (!restroResp.ok) {
      const txt = await restroResp.text().catch(() => "");
      console.error("RestroMaster fetch error:", restroResp.status, txt);
      return NextResponse.json({ error: "Failed to fetch restaurants", details: txt }, { status: 502, headers });
    }

    const restroRows: any[] = await restroResp.json().catch(() => []);

    // 3) normalize and filter active + FSSAI-active
    const normalized = restroRows
      .map((row) => {
        const isActive =
          row.IsActive === true ||
          String(row.IsActive).toLowerCase() === "true" ||
          String(row.RaileatsStatus) === "1" ||
          String(row.RaileatsStatus).toLowerCase() === "active";

        const fssaiStatus = row.FSSAIStatus ?? row.FssaiStatus ?? row.Fssai_Status;
        const fssaiActive =
          fssaiStatus === undefined ||
          fssaiStatus === null ||
          String(fssaiStatus).toLowerCase() === "active" ||
          String(fssaiStatus).toLowerCase() === "on" ||
          String(fssaiStatus).toLowerCase() === "yes" ||
          String(fssaiStatus).trim() === "";

        const isPureVeg = row.IsPureVeg === 1 || row.IsPureVeg === "1" || String(row.IsPureVeg).toLowerCase() === "true";

        const photoUrl = buildPublicImageUrl(PROJECT_URL, row.RestroDisplayPhoto);

        return {
          RestroCode: row.RestroCode,
          RestroName: row.RestroName,
          RestroRating: row.RestroRating ?? null,
          isPureVeg,
          RestroDisplayPhoto: photoUrl,
          OpenTime: row["0penTime"] ?? null,
          ClosedTime: row.ClosedTime ?? null,
          MinimumOrdermValue: row.MinimumOrdermValue ?? null,
          _isActiveRaw: isActive,
          _fssaiActiveRaw: fssaiActive,
        };
      })
      .filter((r) => r._isActiveRaw && r._fssaiActiveRaw)
      .map(({ _isActiveRaw, _fssaiActiveRaw, ...rest }) => rest);

    const result = {
      station: station
        ? {
            StationCode: station.StationCode ?? code,
            StationName: station.StationName ?? null,
            State: station.State ?? null,
            District: station.District ?? null,
            image_url: station.image_url ? buildPublicImageUrl(PROJECT_URL, station.image_url) : null,
          }
        : { StationCode: code, StationName: null },
      restaurants: normalized,
    };

    return NextResponse.json(result, { status: 200, headers });
  } catch (err) {
    console.error("api/stations/[code] error:", err);
    const { FRONTEND_ORIGIN } = getEnv();
    return NextResponse.json({ error: String(err) }, { status: 500, headers: corsHeaders(FRONTEND_ORIGIN ?? "*") });
  }
}
