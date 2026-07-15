// app/api/admin/re-rds/route.ts

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
   EXACT RE RDS COLUMNS
   ========================================================= */

const RE_RDS_COLUMNS = `
  RERDSId,
  RestroRDSId,
  OrderId,
  EntrySource,
  RestroCode,
  RestroName,
  StationCode,
  Status,
  SubStatus,
  Remarks,
  DeliveryDate,
  DeliveryTime,
  PaymentMode,
  CouponCode,
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
  RestroSettlementAmount,
  RESettlementAmount,
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
        searchParams.get(
          "page"
        ),
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

    const entrySource =
      cleanText(
        searchParams.get(
          "entrySource"
        )
      );

    const paymentMode =
      cleanText(
        searchParams.get(
          "paymentMode"
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
       - All India
       - All Restaurants
       - Latest 20
       - CreatedAt DESC
       - RERDSId DESC
       ===================================================== */

    let query =
      serviceClient
        .from("RERDS")
        .select(
          RE_RDS_COLUMNS,
          {
            count: "exact",
          }
        );

    if (restroCode) {
      query =
        query.eq(
          "RestroCode",
          Number(restroCode)
        );
    }

    if (entrySource) {
      query =
        query.eq(
          "EntrySource",
          entrySource
        );
    }

    if (paymentMode) {
      query =
        query.eq(
          "PaymentMode",
          paymentMode
        );
    }

    if (fromDateTime) {
      query =
        query.gte(
          "CreatedAt",
          fromDateTime
        );
    }

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
          "RERDSId",
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
        "RE RDS API ERROR =>",
        error
      );

      return NextResponse.json(
        {
          ok: false,

          error:
            error.message ||
            "Unable to load RE RDS",

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
       UNIVERSAL CURRENT BALANCE

       Latest RERDS row ka CurrentBal company ka
       current All-India running balance hai.
       ===================================================== */

    const {
      data:
        latestBalanceRow,

      error:
        latestBalanceError,
    } =
      await serviceClient
        .from("RERDS")
        .select(
          `
            RERDSId,
            PreviousBal,
            CurrentBal,
            CreatedAt
          `
        )
        .order(
          "RERDSId",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (
      latestBalanceError
    ) {
      console.error(
        "RE RDS BALANCE ERROR =>",
        latestBalanceError
      );
    }

    const universalBalance =
      Number(
        latestBalanceRow
          ?.CurrentBal ??
          0
      );

    /* =====================================================
       FILTERED TOTALS

       Current filters ke according:
       - Total receivable
       - Total payable
       - Net movement
       ===================================================== */

    let totalsQuery =
      serviceClient
        .from("RERDS")
        .select(
          `
            RESettlementAmount
          `
        );

    if (restroCode) {
      totalsQuery =
        totalsQuery.eq(
          "RestroCode",
          Number(restroCode)
        );
    }

    if (entrySource) {
      totalsQuery =
        totalsQuery.eq(
          "EntrySource",
          entrySource
        );
    }

    if (paymentMode) {
      totalsQuery =
        totalsQuery.eq(
          "PaymentMode",
          paymentMode
        );
    }

    if (fromDateTime) {
      totalsQuery =
        totalsQuery.gte(
          "CreatedAt",
          fromDateTime
        );
    }

    if (toDateTime) {
      totalsQuery =
        totalsQuery.lte(
          "CreatedAt",
          toDateTime
        );
    }

    const {
      data:
        totalsRows,

      error:
        totalsError,
    } =
      await totalsQuery;

    if (totalsError) {
      console.error(
        "RE RDS TOTALS ERROR =>",
        totalsError
      );
    }

    let totalReceivable = 0;
    let totalPayable = 0;
    let netMovement = 0;

    if (
      Array.isArray(
        totalsRows
      )
    ) {
      for (
        const row of totalsRows
      ) {
        const amount =
          Number(
            row
              .RESettlementAmount ??
              0
          );

        if (
          !Number.isFinite(
            amount
          )
        ) {
          continue;
        }

        netMovement +=
          amount;

        if (amount > 0) {
          totalReceivable +=
            amount;
        }

        if (amount < 0) {
          totalPayable +=
            Math.abs(
              amount
            );
        }
      }
    }

    totalReceivable =
      Math.round(
        totalReceivable *
          100
      ) / 100;

    totalPayable =
      Math.round(
        totalPayable *
          100
      ) / 100;

    netMovement =
      Math.round(
        netMovement *
          100
      ) / 100;

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

    if (
      restroCode &&
      !selectedRestro
    ) {
      const {
        data:
          summaryRow,
      } =
        await serviceClient
          .from("RERDS")
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
            "RERDSId",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (summaryRow) {
        const stationName =
          await getStationName(
            summaryRow
              .StationCode
          );

        selectedRestro = {
          RestroCode:
            summaryRow
              .RestroCode,

          RestroName:
            cleanText(
              summaryRow
                .RestroName
            ),

          StationCode:
            cleanText(
              summaryRow
                .StationCode
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

        summary: {
          universalBalance,

          totalReceivable,

          totalPayable,

          netMovement,

          lastEntryAt:
            latestBalanceRow
              ?.CreatedAt
              ? formatIndiaDateTime(
                  latestBalanceRow
                    .CreatedAt
                )
              : null,
        },

        filters: {
          restroCode:
            restroCode ||
            null,

          entrySource:
            entrySource ||
            null,

          paymentMode:
            paymentMode ||
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
          !entrySource &&
          !paymentMode &&
          !fromDateTime &&
          !toDateTime,

        sort: {
          primary:
            "CreatedAt",

          primaryDirection:
            "DESC",

          secondary:
            "RERDSId",

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
      "RE RDS API CRITICAL ERROR =>",
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
