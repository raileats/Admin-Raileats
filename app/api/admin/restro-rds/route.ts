// app/api/admin/restro-rds/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  serviceClient,
} from "@/lib/supabaseServer";

/* =========================================================
   ALLOWED PAGE SIZES
   ========================================================= */

const ALLOWED_PAGE_SIZES = [
  20,
  50,
  100,
  500,
] as const;

/* =========================================================
   EXACT RESTRO RDS COLUMNS
   ========================================================= */

const RESTRO_RDS_COLUMNS = `
  RDSId,
  RestroCode,
  OrderId,
  RestroName,
  StationCode,
  Status,
  SubStatus,
  DeliveryDate,
  DeliveryTime,
  PaymentMode,
  RestroPrice,
  BasePrice,
  DiscountedBasePrice,
  Commission,
  GSTAmount,
  PlatformCharge,
  RestroDiscount,
  REDiscount,
  TotalAmount,
  CODAmount,
  PPDAmount,
  OrderPenalty,
  IGST,
  OrderCharges,
  SettlementAmount,
  PreviousBal,
  CurrentBal,
  CreatedAt
`;

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(
  value: unknown
) {
  const text =
    String(value ?? "").trim();

  return text || "";
}

function cleanRestroCode(
  value: unknown
) {
  return cleanText(value)
    .replace(/[^\d]/g, "");
}

function positiveInteger(
  value: unknown,
  fallback: number
) {
  const parsed =
    Number.parseInt(
      String(value ?? ""),
      10
    );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function normalizePageSize(
  value: unknown
) {
  const parsed =
    positiveInteger(
      value,
      20
    );

  return ALLOWED_PAGE_SIZES.includes(
    parsed as any
  )
    ? parsed
    : 20;
}

/*
 * datetime-local input usually:
 * 2026-07-15T10:30
 *
 * Supabase timestamptz filter ke liye
 * valid ISO string banayenge.
 */
function normalizeDateTimeFilter(
  value: unknown
) {
  const text =
    cleanText(value);

  if (!text) {
    return null;
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

/*
 * CreatedAt display:
 *
 * 15-07-2026 00:03
 *
 * GMT/UTC text show nahi hoga.
 * India local time use hoga.
 */
function formatIndiaDateTime(
  value: unknown
) {
  const text =
    cleanText(value);

  if (!text) {
    return "";
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Asia/Kolkata",

        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,
      }
    ).formatToParts(date);

  const map:
    Record<string, string> = {};

  for (
    const part of parts
  ) {
    map[part.type] =
      part.value;
  }

  return [
    `${map.day}-${map.month}-${map.year}`,
    `${map.hour}:${map.minute}`,
  ].join(" ");
}

function formatDeliveryDate(
  value: unknown
) {
  const text =
    cleanText(value);

  if (!text) {
    return "";
  }

  /*
   * Supabase date generally:
   * YYYY-MM-DD
   */
  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (match) {
    return (
      `${match[3]}-` +
      `${match[2]}-` +
      `${match[1]}`
    );
  }

  return text;
}

function formatDeliveryTime(
  value: unknown
) {
  const text =
    cleanText(value);

  if (!text) {
    return "";
  }

  /*
   * 21:50:00 ko same rakhenge.
   */
  return text.slice(0, 8);
}

/* =========================================================
   STATION NAME
   ========================================================= */

async function getStationName(
  stationCode: unknown
) {
  const code =
    cleanText(
      stationCode
    ).toUpperCase();

  if (!code) {
    return "";
  }

  const {
    data,
    error,
  } =
    await serviceClient
      .from("Stations")
      .select(
        "StationCode, StationName"
      )
      .eq(
        "StationCode",
        code
      )
      .maybeSingle();

  if (
    error ||
    !data
  ) {
    return "";
  }

  return cleanText(
    data.StationName
  );
}

/* =========================================================
   GET
   ========================================================= */

export async function GET(
  req: NextRequest
) {
  try {
    const searchParams =
      req.nextUrl.searchParams;

    const page =
      positiveInteger(
        searchParams.get("page"),
        1
      );

    const pageSize =
      normalizePageSize(
        searchParams.get(
          "pageSize"
        )
      );

    const restroCode =
      cleanRestroCode(
        searchParams.get(
          "restroCode"
        )
      );

    const fromDateTime =
      normalizeDateTimeFilter(
        searchParams.get(
          "from"
        )
      );

    const toDateTime =
      normalizeDateTimeFilter(
        searchParams.get(
          "to"
        )
      );

    const fromIndex =
      (page - 1) *
      pageSize;

    const toIndex =
      fromIndex +
      pageSize -
      1;

    /* =====================================================
       MAIN QUERY

       Default:
       - All Restaurants
       - Latest 20
       - CreatedAt DESC
       - RDSId DESC
       ===================================================== */

    let query =
      serviceClient
        .from("RestroRDS")
        .select(
          RESTRO_RDS_COLUMNS,
          {
            count: "exact",
          }
        );

    /*
     * RestroCode filter sirf tab lagega
     * jab user RestroCode search karega.
     */
    if (restroCode) {
      query =
        query.eq(
          "RestroCode",
          Number(restroCode)
        );
    }

    /*
     * From date/time inclusive.
     */
    if (fromDateTime) {
      query =
        query.gte(
          "CreatedAt",
          fromDateTime
        );
    }

    /*
     * To date/time inclusive.
     */
    if (toDateTime) {
      query =
        query.lte(
          "CreatedAt",
          toDateTime
        );
    }

    const {
      data,
      error,
      count,
    } =
      await query
        .order(
          "CreatedAt",
          {
            ascending: false,
          }
        )
        .order(
          "RDSId",
          {
            ascending: false,
          }
        )
        .range(
          fromIndex,
          toIndex
        );

    if (error) {
      console.error(
        "RESTRO RDS API ERROR =>",
        error
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            error.message ||
            "Unable to load Restro RDS",

          details:
            error.details ??
            null,

          hint:
            error.hint ??
            null,
        },
        {
          status: 500,
        }
      );
    }

    const rawRows =
      Array.isArray(data)
        ? data
        : [];

    /*
     * Frontend ke liye GMT-free display values.
     * Raw values ko bhi preserve rakhenge.
     */
    const rows =
      rawRows.map(
        (row: any) => ({
          ...row,

          DeliveryDate:
            formatDeliveryDate(
              row.DeliveryDate
            ),

          DeliveryTime:
            formatDeliveryTime(
              row.DeliveryTime
            ),

          CreatedAtRaw:
            row.CreatedAt,

          CreatedAt:
            formatIndiaDateTime(
              row.CreatedAt
            ),
        })
      );

    const total =
      Number(count ?? 0);

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total /
          pageSize
        )
      );

    /* =====================================================
       SELECTED RESTAURANT SUMMARY
       ===================================================== */

    let selectedRestro:
      | {
          RestroCode:
            number | string;

          RestroName:
            string;

          StationCode:
            string;

          StationName:
            string;
        }
      | null = null;

    if (
      restroCode &&
      rawRows.length > 0
    ) {
      const firstRow =
        rawRows[0];

      const stationName =
        await getStationName(
          firstRow.StationCode
        );

      selectedRestro = {
        RestroCode:
          firstRow.RestroCode,

        RestroName:
          cleanText(
            firstRow.RestroName
          ),

        StationCode:
          cleanText(
            firstRow.StationCode
          ),

        StationName:
          stationName,
      };
    }

    /*
     * Filtered restaurant ki requested page empty ho
     * sakti hai, lekin restaurant ka RDS previous page
     * par available ho sakta hai.
     *
     * Is case me ek summary row alag se fetch karenge.
     */
    if (
      restroCode &&
      !selectedRestro
    ) {
      const {
        data:
          summaryRow,
      } =
        await serviceClient
          .from("RestroRDS")
          .select(
            `
              RestroCode,
              RestroName,
              StationCode
            `
          )
          .eq(
            "RestroCode",
            Number(restroCode)
          )
          .order(
            "CreatedAt",
            {
              ascending: false,
            }
          )
          .order(
            "RDSId",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (summaryRow) {
        const stationName =
          await getStationName(
            summaryRow.StationCode
          );

        selectedRestro = {
          RestroCode:
            summaryRow.RestroCode,

          RestroName:
            cleanText(
              summaryRow.RestroName
            ),

          StationCode:
            cleanText(
              summaryRow.StationCode
            ),

          StationName:
            stationName,
        };
      }
    }

    return NextResponse.json(
      {
        ok: true,

        rows,

        total,

        page,

        pageSize,

        totalPages,

        hasPreviousPage:
          page > 1,

        hasNextPage:
          page <
          totalPages,

        filters: {
          restroCode:
            restroCode ||
            null,

          from:
            searchParams.get(
              "from"
            ) || null,

          to:
            searchParams.get(
              "to"
            ) || null,
        },

        selectedRestro,

        defaultView:
          !restroCode &&
          !fromDateTime &&
          !toDateTime,

        sort: {
          primary:
            "CreatedAt",

          primaryDirection:
            "DESC",

          secondary:
            "RDSId",

          secondaryDirection:
            "DESC",
        },
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "RESTRO RDS API CRITICAL ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ||
          "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
