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

function cleanOrderId(
  value: unknown
) {
  return cleanText(value)
    .replace(/[%_,]/g, "")
    .slice(0, 100);
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
  value: unknown,
  isEnd = false
) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
  ] = match;

  const seconds = isEnd ? "59" : "00";

  /*
   * Browser datetime-local ko
   * India timezone (+05:30) treat karo.
   */
  return `${year}-${month}-${day}T${hour}:${minute}:${seconds}+05:30`;
}
function roundMoney(
  value: unknown
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return 0;
  }

  return (
    Math.round(
      number * 100
    ) / 100
  );
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
    Record<string, string> =
    {};

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

function getIndiaTodayRange() {
  const now =
    new Date();

  const indiaDateText =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kolkata",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).format(now);

  /*
   * India midnight = previous UTC day 18:30.
   * Explicit +05:30 offset timezone-safe conversion deta hai.
   */
  const start =
    new Date(
      `${indiaDateText}T00:00:00+05:30`
    );

  const end =
    new Date(
      `${indiaDateText}T23:59:59.999+05:30`
    );

  return {
    start:
      start.toISOString(),

    end:
      end.toISOString(),
  };
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
   COMMON FILTER APPLIER

   Same filters main rows aur totals dono par lagenge.
   ========================================================= */

function applyFilters(
  query: any,
  {
    restroCode,
    orderId,
    entrySource,
    paymentMode,
    status,
    fromDateTime,
    toDateTime,
  }: {
    restroCode: string;
    orderId: string;
    entrySource: string;
    paymentMode: string;
    status: string;
    fromDateTime: string | null;
    toDateTime: string | null;
  }
) {
  let nextQuery =
    query;

  if (restroCode) {
    nextQuery =
      nextQuery.eq(
        "RestroCode",
        Number(restroCode)
      );
  }

  if (orderId) {
    nextQuery =
      nextQuery.ilike(
        "OrderId",
        `%${orderId}%`
      );
  }

  if (entrySource) {
    nextQuery =
      nextQuery.eq(
        "EntrySource",
        entrySource
      );
  }

  if (paymentMode) {
    nextQuery =
      nextQuery.eq(
        "PaymentMode",
        paymentMode
      );
  }

  if (status) {
    nextQuery =
      nextQuery.ilike(
        "Status",
        status
      );
  }

  if (fromDateTime) {
    nextQuery =
      nextQuery.gte(
        "CreatedAt",
        fromDateTime
      );
  }

  if (toDateTime) {
    nextQuery =
      nextQuery.lte(
        "CreatedAt",
        toDateTime
      );
  }

  return nextQuery;
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

    const orderId =
      cleanOrderId(
        searchParams.get(
          "orderId"
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

    const status =
      cleanText(
        searchParams.get(
          "status"
        )
      );

    const fromDateTime =
  normalizeDateTimeFilter(
    searchParams.get("from"),
    false
  );

const toDateTime =
  normalizeDateTimeFilter(
    searchParams.get("to"),
    true
  );

    if (
      fromDateTime &&
      toDateTime &&
      new Date(fromDateTime) >
        new Date(toDateTime)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "From Date-Time cannot be greater than To Date-Time",
        },
        {
          status: 400,
        }
      );
    }

    const filterValues = {
      restroCode,
      orderId,
      entrySource,
      paymentMode,
      status,
      fromDateTime,
      toDateTime,
    };

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

    let mainQuery =
      serviceClient
        .from("RERDS")
        .select(
          RE_RDS_COLUMNS,
          {
            count: "exact",
          }
        );

    mainQuery =
      applyFilters(
        mainQuery,
        filterValues
      );

    const {
      data,
      error,
      count,
    } =
      await mainQuery
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

       Filters se independent actual All-India latest balance.
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
      roundMoney(
        latestBalanceRow
          ?.CurrentBal
      );

    /* =====================================================
       FILTERED TOTALS + COUNTS
       ===================================================== */

    let totalsQuery =
      serviceClient
        .from("RERDS")
        .select(
          `
            EntrySource,
            RESettlementAmount
          `
        );

    totalsQuery =
      applyFilters(
        totalsQuery,
        filterValues
      );

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

    let orderCount = 0;
    let creditNoteCount = 0;
    let debitNoteCount = 0;
    let manualCount = 0;

    if (
      Array.isArray(
        totalsRows
      )
    ) {
      for (
        const row of totalsRows
      ) {
        const amount =
          roundMoney(
            row
              .RESettlementAmount
          );

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

        const source =
          cleanText(
            row.EntrySource
          )
            .toLowerCase()
            .replace(
              /[^a-z]/g,
              ""
            );

        if (source === "order") {
          orderCount += 1;
        } else if (
          source ===
          "creditnote"
        ) {
          creditNoteCount += 1;
        } else if (
          source ===
          "debitnote"
        ) {
          debitNoteCount += 1;
        } else if (
          source ===
          "manual"
        ) {
          manualCount += 1;
        }
      }
    }

    totalReceivable =
      roundMoney(
        totalReceivable
      );

    totalPayable =
      roundMoney(
        totalPayable
      );

    netMovement =
      roundMoney(
        netMovement
      );

    /* =====================================================
       TODAY SUMMARY — INDIA TIME
       ===================================================== */

    const todayRange =
      getIndiaTodayRange();

    const {
      data:
        todayRows,

      error:
        todayError,
    } =
      await serviceClient
        .from("RERDS")
        .select(
          `
            EntrySource,
            RESettlementAmount
          `
        )
        .gte(
          "CreatedAt",
          todayRange.start
        )
        .lte(
          "CreatedAt",
          todayRange.end
        );

    if (todayError) {
      console.error(
        "RE RDS TODAY SUMMARY ERROR =>",
        todayError
      );
    }

    let todayReceivable = 0;
    let todayPayable = 0;
    let todayNetMovement = 0;
    let todayCreditNote = 0;
    let todayDebitNote = 0;
    let todayOrderCount = 0;

    if (
      Array.isArray(
        todayRows
      )
    ) {
      for (
        const row of todayRows
      ) {
        const amount =
          roundMoney(
            row
              .RESettlementAmount
          );

        todayNetMovement +=
          amount;

        if (amount > 0) {
          todayReceivable +=
            amount;
        }

        if (amount < 0) {
          todayPayable +=
            Math.abs(
              amount
            );
        }

        const source =
          cleanText(
            row.EntrySource
          )
            .toLowerCase()
            .replace(
              /[^a-z]/g,
              ""
            );

        if (
          source === "order"
        ) {
          todayOrderCount += 1;
        }

        /*
         * Company perspective:
         * Restaurant CreditNote -> RE settlement negative.
         * Restaurant DebitNote  -> RE settlement positive.
         */
        if (
          source ===
          "creditnote"
        ) {
          todayCreditNote +=
            Math.abs(
              amount
            );
        }

        if (
          source ===
          "debitnote"
        ) {
          todayDebitNote +=
            Math.abs(
              amount
            );
        }
      }
    }

    todayReceivable =
      roundMoney(
        todayReceivable
      );

    todayPayable =
      roundMoney(
        todayPayable
      );

    todayNetMovement =
      roundMoney(
        todayNetMovement
      );

    todayCreditNote =
      roundMoney(
        todayCreditNote
      );

    todayDebitNote =
      roundMoney(
        todayDebitNote
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

    if (
      restroCode &&
      !selectedRestro
    ) {
      const {
        data:
          summaryRow,

        error:
          summaryError,
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

      if (summaryError) {
        console.error(
          "RE RDS RESTRO SUMMARY ERROR =>",
          summaryError
        );
      }

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

          totalEntries:
            total,

          orderCount,

          creditNoteCount,

          debitNoteCount,

          manualCount,

          lastEntryAt:
            latestBalanceRow
              ?.CreatedAt
              ? formatIndiaDateTime(
                  latestBalanceRow
                    .CreatedAt
                )
              : null,

          today: {
            receivable:
              todayReceivable,

            payable:
              todayPayable,

            netMovement:
              todayNetMovement,

            creditNote:
              todayCreditNote,

            debitNote:
              todayDebitNote,

            orderCount:
              todayOrderCount,
          },
        },

        filters: {
          restroCode:
            restroCode ||
            null,

          orderId:
            orderId ||
            null,

          entrySource:
            entrySource ||
            null,

          paymentMode:
            paymentMode ||
            null,

          status:
            status ||
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
          !orderId &&
          !entrySource &&
          !paymentMode &&
          !status &&
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

          Pragma:
            "no-cache",

          Expires:
            "0",
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

        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  }
}
