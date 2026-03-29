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
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_FRONTEND_URL ??
      "*",
  };
};

const corsHeaders = (origin: string | null = "*") => ({
  "Access-Control-Allow-Origin": origin ?? "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8",
});

async function fetchJsonWithKey(url: string, serviceKey: string) {
  return fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { code?: string } }
) {
  const { PROJECT_URL, SERVICE_KEY, FRONTEND_ORIGIN } = getEnv();
  const headers = corsHeaders(FRONTEND_ORIGIN);

  try {
    const code = String(params?.code || "").toUpperCase().trim();

    if (!code) {
      return NextResponse.json(
        { error: "Missing station code" },
        { status: 400, headers }
      );
    }

    // =========================
    // 1️⃣ Station fetch
    // =========================
    const stationUrl = `${PROJECT_URL}/rest/v1/Stations?select=StationCode,StationName,State,District,image_url&StationCode=eq.${code}&limit=1`;

    const stationRes = await fetchJsonWithKey(stationUrl, SERVICE_KEY!);
    const stationJson = await stationRes.json().catch(() => []);
    const station = stationJson?.[0] ?? null;

    // =========================
    // 2️⃣ FIXED Restro query
    // =========================
    const selectCols = [
      "RestroCode",
      "RestroName",
      "RestroRating",
      "IsPureVeg",
      "RestroDisplayPhoto",
      "open_time",        // ✅ FIX
      "closed_time",      // ✅ FIX
      "MinimumOrderValue",// ✅ FIX
      "FSSAIStatus",
      "RaileatsStatus",
      "StationCode",
      "StationName",
    ].join(",");

    const restroUrl = `${PROJECT_URL}/rest/v1/RestroMaster?select=${selectCols}&StationCode=eq.${code}`;

    const restroRes = await fetchJsonWithKey(restroUrl, SERVICE_KEY!);

    if (!restroRes.ok) {
      const txt = await restroRes.text();
      return NextResponse.json(
        { error: "Failed to fetch restaurants", details: txt },
        { status: 502, headers }
      );
    }

    const rows = await restroRes.json();

    // =========================
    // 3️⃣ Filter + Normalize
    // =========================
    const restaurants = rows
      .filter((r: any) => {
        const active =
          r.RaileatsStatus == 1 ||
          String(r.RaileatsStatus).toLowerCase() === "active";

        const fssai =
          !r.FSSAIStatus ||
          ["active", "1", "true"].includes(
            String(r.FSSAIStatus).toLowerCase()
          );

        return active && fssai;
      })
      .map((r: any) => ({
        RestroCode: r.RestroCode,
        RestroName: r.RestroName,
        RestroRating: r.RestroRating ?? null,
        isPureVeg: r.IsPureVeg == 1,
        RestroDisplayPhoto: r.RestroDisplayPhoto ?? null,

        // ✅ CORRECT MAPPING
        OpenTime: r.open_time ?? null,
        ClosedTime: r.closed_time ?? null,
        MinimumOrdermValue: r.MinimumOrderValue ?? null,
      }));

    // =========================
    // FINAL RESPONSE
    // =========================
    return NextResponse.json(
      {
        station: {
          StationCode: station?.StationCode ?? code,
          StationName: station?.StationName ?? null,
          State: station?.State ?? null,
          District: station?.District ?? null,
          image_url: station?.image_url ?? null,
        },
        restaurants,
      },
      { status: 200, headers }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
