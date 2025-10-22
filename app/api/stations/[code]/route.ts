// app/api/stations/[code]/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
// import your server supabase helper - adjust path if different
import { supabaseServer } from "@/lib/supabaseServer"; // used for PATCH and safe server queries

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
    FRONTEND_ORIGIN: process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_FRONTEND_URL ?? "*",
  };
};

const corsHeaders = (origin: string | null = "*") => ({
  "Access-Control-Allow-Origin": origin ?? "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "600",
});

function buildPublicImageUrl(projectUrl: string, path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const cleaned = String(path).replace(/^\/+/, "");
  return `${projectUrl.replace(/\/$/, "")}/storage/v1/object/public/public/${encodeURIComponent(cleaned)}`;
}

/**
 * OPTIONS (preflight)
 */
export async function OPTIONS() {
  const { FRONTEND_ORIGIN } = getEnv();
  return new NextResponse(null, { status: 204, headers: corsHeaders(FRONTEND_ORIGIN) });
}

/**
 * GET: return station metadata + active restaurants for station code
 */
export async function GET(_request: Request, { params }: { params: { code?: string } }) {
  const { PROJECT_URL, SERVICE_KEY, FRONTEND_ORIGIN } = getEnv();
  const headers = corsHeaders(FRONTEND_ORIGIN ?? "*");

  try {
    const codeRaw = params?.code || "";
    const code = String(codeRaw).toUpperCase().trim();
    if (!code) return NextResponse.json({ error: "Missing station code" }, { status: 400, headers });

    if (!PROJECT_URL) return NextResponse.json({ error: "SUPABASE URL not configured" }, { status: 500, headers });
    if (!SERVICE_KEY) return NextResponse.json({ error: "SUPABASE service key not configured" }, { status: 500, headers });

    // Use Supabase client (service role) for a safe server-side query
    // If supabaseServer exposes a service client, use it; else fallback to REST fetch (will still work)
    let station: StationRow | null = null;
    try {
      const { data: stData, error: stErr } = await supabaseServer
        .from("Stations")
        .select("StationCode,StationName,State,District,image_url")
        .eq("StationCode", code)
        .limit(1)
        .maybeSingle();

      if (stErr) {
        console.error("supabase Stations fetch error", stErr);
      } else {
        station = stData as StationRow | null;
      }
    } catch (e) {
      console.error("Stations query failed", e);
    }

    // Fetch RestroMaster rows for this station
    // Use supabaseServer to query RestroMaster columns
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

    const { data: restroRowsRaw, error: restroErr } = await supabaseServer
      .from("RestroMaster")
      .select(selectCols)
      .eq("StationCode", code);

    if (restroErr) {
      console.error("RestroMaster fetch error", restroErr);
      return NextResponse.json({ error: "Failed to fetch restaurants", details: restroErr.message }, { status: 502, headers });
    }

    const restroRows: any[] = Array.isArray(restroRowsRaw) ? restroRowsRaw : [];

    // Normalize & filter (IsActive & FSSAI active)
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
        const photoUrl = buildPublicImageUrl(PROJECT_URL || "", row.RestroDisplayPhoto);

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
            image_url: station.image_url ? buildPublicImageUrl(PROJECT_URL || "", station.image_url) : null,
          }
        : { StationCode: code, StationName: null },
      restaurants: normalized,
    };

    return NextResponse.json(result, { status: 200, headers });
  } catch (err) {
    console.error("api/stations/[code] GET error:", err);
    const { FRONTEND_ORIGIN } = getEnv();
    return NextResponse.json({ error: String(err) }, { status: 500, headers: corsHeaders(FRONTEND_ORIGIN ?? "*") });
  }
}

/**
 * PATCH: update station record (useful for admin UI)
 * Accepts JSON body; only allowed fields will be updated.
 * Uses supabaseServer client (service role) to perform update.
 */
export async function PATCH(request: Request, { params }: { params: { code?: string } }) {
  try {
    const codeRaw = params?.code || "";
    const code = String(codeRaw).toUpperCase().trim();
    if (!code) return NextResponse.json({ error: "Missing station code" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    // Allowed fields for Stations table (adjust as per your schema)
    const allowed = new Set([
      "StationName",
      "StationCode",
      "Category",
      "EcatRank",
      "Division",
      "RailwayZone",
      "EcatZone",
      "District",
      "State",
      "Lat",
      "Long",
      "Address",
      "ReGroup",
      "is_active",
    ]);

    const updates: any = {};
    for (const k of Object.keys(body || {})) {
      if (allowed.has(k)) updates[k] = body[k];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update Stations where StationCode = code
    const { data, error } = await supabaseServer
      .from("Stations")
      .update(updates)
      .eq("StationCode", code)
      .select()
      .maybeSingle();

    if (error) {
      console.error("supabase update error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error("PATCH /api/stations/[code] error", e);
    return NextResponse.json({ error: e.message ?? "unknown" }, { status: 500 });
  }
}
