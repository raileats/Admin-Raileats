export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

type StationRow = {
  StationCode?: string;
  StationName?: string;
  State?: string;
  District?: string;
};

type AnyRow = Record<string, any>;

const getEnv = () => {
  return {
    PROJECT_URL:
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      process.env.SUPABASE_PROJECT_URL ??
      "",

    SERVICE_KEY:
      process.env.SUPABASE_SERVICE_ROLE ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_KEY ??
      "",

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
  "Cache-Control": "no-store, no-cache, must-revalidate",
});

async function fetchJsonWithKey(url: string, serviceKey: string) {
  return fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: "application/json",
    },
  });
}

/* =========================================================
   CASE-INSENSITIVE COLUMN READER
========================================================= */
function getValue(row: AnyRow, possibleKeys: string[]) {
  if (!row || typeof row !== "object") {
    return undefined;
  }

  for (const key of possibleKeys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }

  const rowKeys = Object.keys(row);

  for (const wantedKey of possibleKeys) {
    const matchedKey = rowKeys.find(
      (rowKey) => rowKey.toLowerCase() === wantedKey.toLowerCase()
    );

    if (matchedKey) {
      return row[matchedKey];
    }
  }

  return undefined;
}

function cleanText(value: any) {
  return String(value ?? "").trim();
}

/* =========================================================
   RESTRO CODE NORMALIZER
========================================================= */
function normalizeRestroCode(value: any) {
  const raw = cleanText(value);

  if (!raw) {
    return "";
  }

  const numericValue = Number(raw);

  if (Number.isFinite(numericValue)) {
    return String(numericValue);
  }

  return raw.toUpperCase();
}

/* =========================================================
   ACTIVE STATUS CHECK
========================================================= */
function isActiveStatus(value: any) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  const normalized = cleanText(value).toLowerCase();

  return [
    "active",
    "1",
    "true",
    "yes",
    "on",
    "valid",
    "approved",
  ].includes(normalized);
}

/* =========================================================
   DATE PARSER

   Supported:
   - 2026-05-03
   - 2026-05-03T00:00:00
   - 03/05/2026
   - 03-05-2026
========================================================= */
function parseExpiryDate(value: any): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      23,
      59,
      59,
      999
    );
  }

  const raw = cleanText(value);

  if (!raw) {
    return null;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const indianDateMatch = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (indianDateMatch) {
    const day = Number(indianDateMatch[1]);
    const month = Number(indianDateMatch[2]);
    const year = Number(indianDateMatch[3]);

    const parsed = new Date(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999
    );

    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }

    return null;
  }

  // YYYY-MM-DD or ISO datetime
  const isoDateMatch = raw.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})/
  );

  if (isoDateMatch) {
    const year = Number(isoDateMatch[1]);
    const month = Number(isoDateMatch[2]);
    const day = Number(isoDateMatch[3]);

    const parsed = new Date(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999
    );

    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }

    return null;
  }

  const fallbackDate = new Date(raw);

  if (Number.isNaN(fallbackDate.getTime())) {
    return null;
  }

  return new Date(
    fallbackDate.getFullYear(),
    fallbackDate.getMonth(),
    fallbackDate.getDate(),
    23,
    59,
    59,
    999
  );
}

/* =========================================================
   INDIA TODAY START

   Vercel server UTC mein hota hai, isliye India date nikali
   ja rahi hai.
========================================================= */
function getIndiaTodayStart() {
  const indiaDateString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const [year, month, day] = indiaDateString
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0
  );
}

/* =========================================================
   FSSAI HELPERS
========================================================= */
function getFssaiRestroCode(row: AnyRow) {
  return normalizeRestroCode(
    getValue(row, [
      "RestroCode",
      "restro_code",
      "restroCode",
      "RestaurantCode",
      "restaurant_code",
    ])
  );
}

function getFssaiExpiryValue(row: AnyRow) {
  return getValue(row, [
    "Expiry",
    "expiry",
    "ExpiryDate",
    "expiry_date",
    "FSSAIExpiry",
    "FSSAIExpiryDate",
    "FssaiExpiry",
    "FssaiExpiryDate",
    "ValidTill",
    "valid_till",
    "ValidUpto",
    "valid_upto",
  ]);
}

function getFssaiStatusValue(row: AnyRow) {
  return getValue(row, [
    "Status",
    "status",
    "FSSAIStatus",
    "FssaiStatus",
    "fssai_status",
    "IsActive",
    "is_active",
    "Active",
    "active",
  ]);
}

/* =========================================================
   VALID FSSAI CHECK

   Restaurant tabhi website par aayega jab:
   - RestroCode match ho
   - FSSAI status active ho
   - Expiry date available ho
   - Expiry aaj ya future ki ho
========================================================= */
function hasValidFssai(
  fssaiRows: AnyRow[],
  restroCode: any
) {
  const normalizedCode = normalizeRestroCode(restroCode);

  if (!normalizedCode) {
    return false;
  }

  const todayStart = getIndiaTodayStart();

  return fssaiRows.some((row) => {
    const rowRestroCode = getFssaiRestroCode(row);

    if (rowRestroCode !== normalizedCode) {
      return false;
    }

    const statusValue = getFssaiStatusValue(row);

    if (!isActiveStatus(statusValue)) {
      return false;
    }

    const expiryValue = getFssaiExpiryValue(row);
    const expiryDate = parseExpiryDate(expiryValue);

    if (!expiryDate) {
      return false;
    }

    return expiryDate.getTime() >= todayStart.getTime();
  });
}

/* =========================================================
   RESTAURANT ACTIVE CHECK
========================================================= */
function isRestaurantActive(value: any) {
  const normalized = cleanText(value).toLowerCase();

  return (
    value === 1 ||
    value === true ||
    normalized === "1" ||
    normalized === "true" ||
    normalized === "active" ||
    normalized === "on"
  );
}

/* =========================================================
   PURE VEG CHECK
========================================================= */
function isPureVeg(value: any) {
  const normalized = cleanText(value).toLowerCase();

  return (
    value === 1 ||
    value === true ||
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "veg"
  );
}

/* =========================================================
   OPTIONS
========================================================= */
export async function OPTIONS(request: Request) {
  const { FRONTEND_ORIGIN } = getEnv();

  const requestOrigin = request.headers.get("origin");

  const allowedOrigin =
    FRONTEND_ORIGIN === "*"
      ? "*"
      : requestOrigin === FRONTEND_ORIGIN
      ? FRONTEND_ORIGIN
      : FRONTEND_ORIGIN;

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(allowedOrigin),
  });
}

/* =========================================================
   GET
========================================================= */
export async function GET(
  request: Request,
  { params }: { params: { code?: string } }
) {
  const {
    PROJECT_URL,
    SERVICE_KEY,
    FRONTEND_ORIGIN,
  } = getEnv();

  const requestOrigin = request.headers.get("origin");

  const allowedOrigin =
    FRONTEND_ORIGIN === "*"
      ? "*"
      : requestOrigin === FRONTEND_ORIGIN
      ? FRONTEND_ORIGIN
      : FRONTEND_ORIGIN;

  const headers = corsHeaders(allowedOrigin);

  try {
    if (!PROJECT_URL) {
      return NextResponse.json(
        {
          error: "Supabase project URL is missing",
        },
        {
          status: 500,
          headers,
        }
      );
    }

    if (!SERVICE_KEY) {
      return NextResponse.json(
        {
          error: "Supabase service role key is missing",
        },
        {
          status: 500,
          headers,
        }
      );
    }

    const code = cleanText(params?.code)
      .toUpperCase();

    if (!code) {
      return NextResponse.json(
        {
          error: "Missing station code",
        },
        {
          status: 400,
          headers,
        }
      );
    }

    /* =====================================================
       1. STATION FETCH

       image_url hata diya gaya hai kyunki Stations table
       mein ye column available nahi hai.
    ===================================================== */
    const stationUrl =
      `${PROJECT_URL}/rest/v1/Stations` +
      `?select=StationCode,StationName,State,District` +
      `&StationCode=eq.${encodeURIComponent(code)}` +
      `&limit=1`;

    const stationRes = await fetchJsonWithKey(
      stationUrl,
      SERVICE_KEY
    );

    if (!stationRes.ok) {
      const details = await stationRes.text();

      return NextResponse.json(
        {
          error: "Failed to fetch station",
          details,
        },
        {
          status: 502,
          headers,
        }
      );
    }

    const stationJson: StationRow[] =
      await stationRes.json().catch(() => []);

    const station = stationJson?.[0] ?? null;

    /* =====================================================
       2. RESTAURANTS FETCH
    ===================================================== */
    const selectCols = [
      "RestroCode",
      "RestroName",
      "RestroRating",
      "IsPureVeg",
      "RestroDisplayPhoto",
      "open_time",
      "closed_time",
      "MinimumOrderValue",
      "FSSAIStatus",
      "RaileatsStatus",
      "StationCode",
      "StationName",
    ].join(",");

    const restroUrl =
      `${PROJECT_URL}/rest/v1/RestroMaster` +
      `?select=${encodeURIComponent(selectCols)}` +
      `&StationCode=eq.${encodeURIComponent(code)}`;

    const restroRes = await fetchJsonWithKey(
      restroUrl,
      SERVICE_KEY
    );

    if (!restroRes.ok) {
      const details = await restroRes.text();

      return NextResponse.json(
        {
          error: "Failed to fetch restaurants",
          details,
        },
        {
          status: 502,
          headers,
        }
      );
    }

    const restroRows: AnyRow[] =
      await restroRes.json().catch(() => []);

    /* =====================================================
       3. ACTIVE RESTAURANTS
    ===================================================== */
    const activeRestroRows = restroRows.filter(
      (row) => isRestaurantActive(row.RaileatsStatus)
    );

    const restroCodes = Array.from(
      new Set(
        activeRestroRows
          .map((row) =>
            normalizeRestroCode(row.RestroCode)
          )
          .filter(Boolean)
      )
    );

    /* =====================================================
       4. FSSAI RECORDS FETCH
    ===================================================== */
    let fssaiRows: AnyRow[] = [];

    if (restroCodes.length > 0) {
      const inFilter = restroCodes.join(",");

      const fssaiUrl =
        `${PROJECT_URL}/rest/v1/RestroFSSAI` +
        `?select=*` +
        `&RestroCode=in.(${inFilter})`;

      const fssaiRes = await fetchJsonWithKey(
        fssaiUrl,
        SERVICE_KEY
      );

      if (!fssaiRes.ok) {
        const details = await fssaiRes.text();

        return NextResponse.json(
          {
            error:
              "Failed to fetch restaurant FSSAI records",
            details,
          },
          {
            status: 502,
            headers,
          }
        );
      }

      fssaiRows = await fssaiRes
        .json()
        .catch(() => []);
    }

    /* =====================================================
       5. VALID FSSAI FILTER
    ===================================================== */
    const restaurants = activeRestroRows
      .filter((restaurant) =>
        hasValidFssai(
          fssaiRows,
          restaurant.RestroCode
        )
      )
      .map((restaurant) => ({
        RestroCode:
          restaurant.RestroCode,

        RestroName:
          restaurant.RestroName,

        RestroRating:
          restaurant.RestroRating ?? null,

        isPureVeg:
          isPureVeg(restaurant.IsPureVeg),

        RestroDisplayPhoto:
          restaurant.RestroDisplayPhoto ?? null,

        OpenTime:
          restaurant.open_time ?? null,

        ClosedTime:
          restaurant.closed_time ?? null,

        /*
          Existing frontend spelling same rakhi hai.
        */
        MinimumOrdermValue:
          restaurant.MinimumOrderValue ?? null,
      }));

    /* =====================================================
       6. FINAL RESPONSE
    ===================================================== */
    return NextResponse.json(
      {
        station: {
          StationCode:
            station?.StationCode ?? code,

          StationName:
            station?.StationName ?? null,

          State:
            station?.State ?? null,

          District:
            station?.District ?? null,

          /*
            Frontend compatibility ke liye key rakhi hai,
            lekin database column available nahi hai.
          */
          image_url: null,
        },

        restaurants,
      },
      {
        status: 200,
        headers,
      }
    );
  } catch (error: any) {
    console.error(
      "Station restaurant API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unexpected server error",
      },
      {
        status: 500,
        headers,
      }
    );
  }
}
