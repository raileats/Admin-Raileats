// app/api/restros/[code]/statement/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

/* =========================================================
   SUPABASE SERVICE CLIENT
   ========================================================= */

const supabase = createClient(
  process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/* =========================================================
   TYPES
   ========================================================= */

type RestroRdsRow = {
  RDSId: number | string | null;
  RestroCode: number | string | null;
  OrderId: string | null;
  RestroName: string | null;
  StationCode: string | null;

  Status: string | null;
  SubStatus: string | null;
  Remarks: string | null;
  EntrySource: string | null;

  DeliveryDate: string | null;
  DeliveryTime: string | null;
  PaymentMode: string | null;
  CouponCode: string | null;

  RestroPrice: number | string | null;
  BasePrice: number | string | null;
  DiscountedBasePrice: number | string | null;

  Commission: number | string | null;
  GSTAmount: number | string | null;
  PlatformCharge: number | string | null;

  RestroDiscount: number | string | null;
  REDiscount: number | string | null;
  TotalAmount: number | string | null;

  CODAmount: number | string | null;
  PPDAmount: number | string | null;

  OrderPenalty: number | string | null;
  IGST: number | string | null;
  OrderCharges: number | string | null;

  SettlementAmount: number | string | null;
  PreviousBal: number | string | null;
  CurrentBal: number | string | null;

  CreatedAt: string | null;
  UpdatedAt?: string | null;
};

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function numberValue(
  value: unknown
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function roundMoney(
  value: unknown
) {
  return (
    Math.round(
      numberValue(value) *
        100
    ) / 100
  );
}

function normalizeDate(
  value: unknown
) {
  const text =
    cleanText(value);

  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
  ] = match;

  const date =
    new Date(
      `${year}-${month}-${day}T00:00:00+05:30`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function getIndiaDateParts(
  date = new Date()
) {
  const parts =
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
    ).formatToParts(
      date
    );

  const map:
    Record<string, string> =
    {};

  for (
    const part of parts
  ) {
    map[
      part.type
    ] =
      part.value;
  }

  return {
    year:
      Number(
        map.year
      ),
    month:
      Number(
        map.month
      ),
    day:
      Number(
        map.day
      ),
  };
}

function getDefaultPeriod() {
  const india =
    getIndiaDateParts();

  const year =
    india.year;

  const month =
    india.month;

  const lastDay =
    new Date(
      Date.UTC(
        year,
        month,
        0
      )
    ).getUTCDate();

  const monthText =
    String(
      month
    ).padStart(
      2,
      "0"
    );

  return {
    from:
      `${year}-${monthText}-01`,

    to:
      `${year}-${monthText}-${String(
        lastDay
      ).padStart(
        2,
        "0"
      )}`,
  };
}

/*
 * User jo date select karta hai wo India date hoti hai.
 * Supabase CreatedAt timestamptz UTC me stored hota hai.
 *
 * 2026-07-01 IST start
 * = 2026-06-30T18:30:00.000Z
 */
function indiaDateStartToUtcIso(
  dateText: string
) {
  return new Date(
    `${dateText}T00:00:00+05:30`
  ).toISOString();
}

/*
 * Selected To date ka poora din include karna hai.
 */
function indiaDateEndToUtcIso(
  dateText: string
) {
  return new Date(
    `${dateText}T23:59:59.999+05:30`
  ).toISOString();
}

function formatIndiaDateTime(
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
        second:
          "2-digit",
        hour12:
          false,
      }
    ).formatToParts(
      date
    );

  const map:
    Record<string, string> =
    {};

  for (
    const part of parts
  ) {
    map[
      part.type
    ] =
      part.value;
  }

  return (
    `${map.day}-${map.month}-${map.year} ` +
    `${map.hour}:${map.minute}:${map.second}`
  );
}

function normalizeEntrySource(
  value: unknown
) {
  return cleanText(
    value
  )
    .toLowerCase()
    .replace(
      /[^a-z]/g,
      ""
    );
}

function entrySourceLabel(
  value: unknown
) {
  const key =
    normalizeEntrySource(
      value
    );

  if (
    key === "order"
  ) {
    return "Order";
  }

  if (
    key === "creditnote"
  ) {
    return "Credit Note";
  }

  if (
    key === "debitnote"
  ) {
    return "Debit Note";
  }

  if (
    key ===
    "paymentpaid"
  ) {
    return "Payment Paid";
  }

  if (
    key ===
    "paymentreceived"
  ) {
    return "Payment Received";
  }

  if (
    key === "manual"
  ) {
    return "Manual";
  }

  return cleanText(
    value
  ) || "-";
}

function buildParticular(
  row: RestroRdsRow
) {
  const source =
    entrySourceLabel(
      row.EntrySource
    );

  const status =
    cleanText(
      row.Status
    );

  const subStatus =
    cleanText(
      row.SubStatus
    );

  return [
    source,
    status &&
    status !== "-"
      ? status
      : "",
    subStatus &&
    subStatus !== "-"
      ? subStatus
      : "",
  ]
    .filter(Boolean)
    .join(" - ");
}

/* =========================================================
   PAGINATED FETCH
   Supabase default 1000 row limit ko safely handle karta hai.
   ========================================================= */

async function fetchAllStatementRows({
  restroCode,
  fromUtc,
  toUtc,
}: {
  restroCode: number;
  fromUtc: string;
  toUtc: string;
}) {
  const pageSize =
    1000;

  let fromIndex =
    0;

  const allRows:
    RestroRdsRow[] =
    [];

  while (true) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "RestroRDS"
        )
        .select(
          `
            RDSId,
            RestroCode,
            OrderId,
            RestroName,
            StationCode,

            Status,
            SubStatus,
            Remarks,
            EntrySource,

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

            SettlementAmount,
            PreviousBal,
            CurrentBal,

            CreatedAt,
            UpdatedAt
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .gte(
          "CreatedAt",
          fromUtc
        )
        .lte(
          "CreatedAt",
          toUtc
        )
        .order(
          "RDSId",
          {
            ascending:
              true,
          }
        )
        .range(
          fromIndex,
          fromIndex +
            pageSize -
            1
        );

    if (error) {
      throw new Error(
        error.message
      );
    }

    const batch =
      Array.isArray(
        data
      )
        ? (
            data as
              RestroRdsRow[]
          )
        : [];

    allRows.push(
      ...batch
    );

    if (
      batch.length <
      pageSize
    ) {
      break;
    }

    fromIndex +=
      pageSize;
  }

  return allRows;
}

/* =========================================================
   GET RESTAURANT MONTHLY / DATE-RANGE STATEMENT
   ========================================================= */

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      code: string;
    };
  }
) {
  try {
    const restroCode =
      Number(
        params.code
      );

    if (
      !restroCode ||
      !Number.isFinite(
        restroCode
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid RestroCode",
        },
        {
          status: 400,
        }
      );
    }

    const defaultPeriod =
      getDefaultPeriod();

    const fromDate =
      normalizeDate(
        req.nextUrl
          .searchParams
          .get("from")
      ) ||
      defaultPeriod.from;

    const toDate =
      normalizeDate(
        req.nextUrl
          .searchParams
          .get("to")
      ) ||
      defaultPeriod.to;

    if (
      fromDate >
      toDate
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "From Date, To Date se badi nahi ho sakti",
        },
        {
          status: 400,
        }
      );
    }

    const fromUtc =
      indiaDateStartToUtcIso(
        fromDate
      );

    const toUtc =
      indiaDateEndToUtcIso(
        toDate
      );

    /* =====================================================
       RESTAURANT DETAILS
       ===================================================== */

    const {
      data:
        restro,
      error:
        restroError,
    } =
      await supabase
        .from(
          "RestroMaster"
        )
        .select(
          `
            RestroCode,
            RestroName,
            StationCode,
            StationName,
            State
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .maybeSingle();

    if (
      restroError
    ) {
      throw new Error(
        restroError.message
      );
    }

    if (!restro) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Restaurant not found",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       OPENING BALANCE

       Selected period se just pehle wali last ledger row ka
       CurrentBal statement ka Opening Balance hoga.
       ===================================================== */

    const {
      data:
        previousRow,
      error:
        previousError,
    } =
      await supabase
        .from(
          "RestroRDS"
        )
        .select(
          `
            RDSId,
            CurrentBal,
            CreatedAt
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .lt(
          "CreatedAt",
          fromUtc
        )
        .order(
          "RDSId",
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (
      previousError
    ) {
      throw new Error(
        previousError.message
      );
    }

    const rows =
      await fetchAllStatementRows(
        {
          restroCode,
          fromUtc,
          toUtc,
        }
      );

    let openingBalance =
      roundMoney(
        previousRow
          ?.CurrentBal ??
        (
          rows.length > 0
            ? rows[0]
                .PreviousBal
            : 0
        )
      );

    let totalOrders =
      0;

    let totalCreditNotes =
      0;

    let totalDebitNotes =
      0;

    let totalPaymentPaid =
      0;

    let totalPaymentReceived =
      0;

    let totalManual =
      0;

    let orderCount =
      0;

    let creditNoteCount =
      0;

    let debitNoteCount =
      0;

    let paymentPaidCount =
      0;

    let paymentReceivedCount =
      0;

    let manualCount =
      0;

    const statementRows =
      rows.map(
        (
          row
        ) => {
          const source =
            normalizeEntrySource(
              row.EntrySource
            );

          const settlementAmount =
            roundMoney(
              row.SettlementAmount
            );

          const debit =
            settlementAmount < 0
              ? Math.abs(
                  settlementAmount
                )
              : 0;

          const credit =
            settlementAmount > 0
              ? settlementAmount
              : 0;

          if (
            source ===
            "order"
          ) {
            orderCount +=
              1;

            totalOrders +=
              settlementAmount;
          } else if (
            source ===
            "creditnote"
          ) {
            creditNoteCount +=
              1;

            totalCreditNotes +=
              settlementAmount;
          } else if (
            source ===
            "debitnote"
          ) {
            debitNoteCount +=
              1;

            totalDebitNotes +=
              Math.abs(
                settlementAmount
              );
          } else if (
            source ===
            "paymentpaid"
          ) {
            paymentPaidCount +=
              1;

            totalPaymentPaid +=
              Math.abs(
                settlementAmount
              );
          } else if (
            source ===
            "paymentreceived"
          ) {
            paymentReceivedCount +=
              1;

            totalPaymentReceived +=
              Math.abs(
                settlementAmount
              );
          } else {
            manualCount +=
              1;

            totalManual +=
              settlementAmount;
          }

          return {
            ...row,

            EntrySourceLabel:
              entrySourceLabel(
                row.EntrySource
              ),

            Particular:
              buildParticular(
                row
              ),

            SettlementAmount:
              settlementAmount,

            Debit:
              roundMoney(
                debit
              ),

            Credit:
              roundMoney(
                credit
              ),

            PreviousBal:
              roundMoney(
                row.PreviousBal
              ),

            CurrentBal:
              roundMoney(
                row.CurrentBal
              ),

            CreatedAtFormatted:
              formatIndiaDateTime(
                row.CreatedAt
              ),
          };
        }
      );

    totalOrders =
      roundMoney(
        totalOrders
      );

    totalCreditNotes =
      roundMoney(
        totalCreditNotes
      );

    totalDebitNotes =
      roundMoney(
        totalDebitNotes
      );

    totalPaymentPaid =
      roundMoney(
        totalPaymentPaid
      );

    totalPaymentReceived =
      roundMoney(
        totalPaymentReceived
      );

    totalManual =
      roundMoney(
        totalManual
      );

    const netMovement =
      roundMoney(
        statementRows.reduce(
          (
            total,
            row
          ) =>
            total +
            numberValue(
              row.SettlementAmount
            ),
          0
        )
      );

    const closingBalance =
      roundMoney(
        statementRows.length >
          0
          ? statementRows[
              statementRows.length -
              1
            ].CurrentBal
          : openingBalance
      );

    const totalDebit =
      roundMoney(
        statementRows.reduce(
          (
            total,
            row
          ) =>
            total +
            numberValue(
              row.Debit
            ),
          0
        )
      );

    const totalCredit =
      roundMoney(
        statementRows.reduce(
          (
            total,
            row
          ) =>
            total +
            numberValue(
              row.Credit
            ),
          0
        )
      );

    return NextResponse.json(
      {
        ok: true,

        period: {
          from:
            fromDate,

          to:
            toDate,

          fromUtc,

          toUtc,
        },

        restro: {
          RestroCode:
            restro.RestroCode,

          RestroName:
            restro.RestroName,

          StationCode:
            restro.StationCode,

          StationName:
            restro.StationName,

          State:
            restro.State,
        },

        summary: {
          openingBalance,
          closingBalance,
          netMovement,

          totalDebit,
          totalCredit,

          totalTransactions:
            statementRows.length,

          orderCount,
          creditNoteCount,
          debitNoteCount,
          paymentPaidCount,
          paymentReceivedCount,
          manualCount,

          totalOrders,
          totalCreditNotes,
          totalDebitNotes,
          totalPaymentPaid,
          totalPaymentReceived,
          totalManual,
        },

        rows:
          statementRows,

        generatedAt:
          formatIndiaDateTime(
            new Date()
          ),
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
      "RESTRO STATEMENT ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ||
          "Unable to load restaurant statement",
      },
      {
        status: 500,
      }
    );
  }
}
