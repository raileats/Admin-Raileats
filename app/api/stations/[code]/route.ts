// app/api/stations/[code]/route.ts
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
  return {
    PROJECT_URL:
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_PROJECT_URL,
    SERVICE_KEY:
      process.env.SUPABASE_SERVICE_ROLE ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_KEY,
    FRONTEND_ORIGIN:
      process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_FRONTEND_URL ?? "*",
  };
};

const corsHeaders = (origin: string | null = "*") => ({
  "Access-Control-Allow-Origin": origin ?? "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "600",
  "Content-Type": "application/json; charset=utf-8",
});

function buildPublicImageUrl(projectUrl: string, path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path; // already absolute

  const allowedBuckets = (process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKETS || "RestroDisplayPhoto,StationImage,restro-docs,user-photos,public")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cleaned = String(path).replace(/^\/+/, "");
  const parts = cleaned.split("/");

  let bucket = allowedBuckets[0] || "RestroDisplayPhoto";
  let objectPath = cleaned;

  if (parts.length > 1 && allowedBuckets.includes(parts[0])) {
    bucket = parts[0];
    objectPath = parts.slice(1).join("/");
  } else {
    objectPath = cleaned;
  }

  const encodedObject = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${projectUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encodedObject}`;
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

// small helper to check if a public URL exists (HEAD)
async function urlExists(url: string) {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}

// try candidate file names for station image and return first that exists
async function findStationImage(projectUrl: string, code: string) {
  const candidates = [
    `StationImage/${code}.webp`,
    `StationImage/${code}.png`,
    `StationImage/${code}.jpg`,
    `StationImage/StationImage_${code}.png`,
    `StationImage/StationImage_${code}.webp`,
  ];
  for (const p of candidates) {
    const url = buildPublicImageUrl(projectUrl, p);
    if (!url) continue;
    // try HEAD
    /* eslint-disable no-await-in-loop */
    const ok = await urlExists(url);
    if (ok) return url;
  }
  return null;
}

export async function OPTIONS() {
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
    const stationUrl = `${PROJECT_URL.replace(/\/$/, "")}/rest/v1/Stations?select=StationCode,StationName,State,District,image_url&StationCode=eq.${encodeURIComponent(code)}&limit=1`;
    const stationResp = await fetchJsonWithKey(stationUrl, SERVICE_KEY);

    let station: StationRow | null = null;
    if (stationResp.ok) {
      const stationJson: StationRow[] = await stationResp.json().catch(() => []);
      station = stationJson && stationJson.length ? stationJson[0] : null;
    } else {
      const text = await stationResp.text().catch(() => "");
      console.error("Station fetch error:", stationResp.status, text);
    }

    // determine station image URL (DB value takes precedence; else probe StationImage/{CODE}.webp etc)
    let stationImageUrl: string | null = null;
    if (station?.image_url) {
      stationImageUrl = buildPublicImageUrl(PROJECT_URL, station.image_url);
      // quick existence check
      if (stationImageUrl && !(await urlExists(stationImageUrl))) {
        // if stored path does not exist, try fallback probing
        const fallback = await findStationImage(PROJECT_URL, code);
        if (fallback) stationImageUrl = fallback;
      }
    } else {
      stationImageUrl = await findStationImage(PROJECT_URL, code);
    }

    // 2) RestroMaster query
    const selectCols = [
      "RestroCode",
      "RestroName",
      "RestroRating",
      "IsPureVeg",
      "RestroDisplayPhoto",
      "0penTime",
      "ClosedTime",
      "MinimumOrdermValue",
      "FSSAIStatus",
      "RaileatsStatus",
      "StationCode",
      "StationName",
    ].join(",");

    const restroUrl = `${PROJECT_URL.replace(/\/$/, "")}/rest/v1/RestroMaster?select=${encodeURIComponent(selectCols)}&StationCode=eq.${encodeURIComponent(code)}`;
    const restroResp = await fetchJsonWithKey(restroUrl, SERVICE_KEY);

    if (!restroResp.ok) {
      const txt = await restroResp.text().catch(() => "");
      console.error("RestroMaster fetch error:", restroResp.status, txt);
      return NextResponse.json({ error: "Failed to fetch restaurants", details: txt }, { status: 502, headers });
    }

    const restroRows: any[] = await restroResp.json().catch(() => []);

    // 3) Normalize & filter
    const normalized = await Promise.all(
      restroRows.map(async (row) => {
        const raileats = row.RaileatsStatus;
        const isActive =
          raileats === 1 ||
          raileats === "1" ||
          String(raileats).toLowerCase() === "active" ||
          String(raileats).toLowerCase() === "true";

        const fssaiStatus = row.FSSAIStatus ?? row.FssaiStatus ?? row.Fssai_Status;
        const fssaiActive =
          fssaiStatus === undefined ||
          fssaiStatus === null ||
          String(fssaiStatus).trim() === "" ||
          ["active", "on", "yes", "1", "true"].includes(String(fssaiStatus).toLowerCase());

        const isPureVeg = row.IsPureVeg === 1 || row.IsPureVeg === "1" || String(row.IsPureVeg).toLowerCase() === "true";

        // RestroDisplayPhoto might be just filename or bucket/path — build url
        let photoUrl = buildPublicImageUrl(PROJECT_URL, row.RestroDisplayPhoto);
        if (photoUrl && !(await urlExists(photoUrl))) {
          // try common filenames: RestroDisplayPhoto/{RestroCode}.webp etc
          const probeCandidates = [
            `RestroDisplayPhoto/${row.RestroCode}.webp`,
            `RestroDisplayPhoto/${row.RestroCode}.png`,
            `RestroDisplayPhoto/${row.RestroCode}.jpg`,
            `${row.RestroCode}.webp`,
            `${row.RestroCode}.png`,
          ];
          for (const p of probeCandidates) {
            const url = buildPublicImageUrl(PROJECT_URL, p);
            if (url && (await urlExists(url))) {
              photoUrl = url;
              break;
            }
          }
        }

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
    );

    const filtered = normalized.filter((r) => r._isActiveRaw && r._fssaiActiveRaw).map(({ _isActiveRaw, _fssaiActiveRaw, ...rest }) => rest);

    const result = {
      station: station
        ? {
            StationCode: station.StationCode ?? code,
            StationName: station.StationName ?? null,
            State: station.State ?? null,
            District: station.District ?? null,
            image_url: stationImageUrl,
          }
        : { StationCode: code, StationName: null, image_url: stationImageUrl },
      restaurants: filtered,
    };

    return NextResponse.json(result, { status: 200, headers });
  } catch (err) {
    console.error("api/stations/[code] error:", err);
    const { FRONTEND_ORIGIN } = getEnv();
    return NextResponse.json({ error: String(err) }, { status: 500, headers: corsHeaders(FRONTEND_ORIGIN ?? "*") });
  }
}
