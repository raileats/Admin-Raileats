// app/api/restros/[code]/accounting/route.ts

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

function normalizeSource(
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

  return new Intl.DateTimeFormat(
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
  ).format(date);
}

function getIndiaMonthRange() {
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
      new Date()
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

  const year =
    Number(
      map.year
    );

  const month =
    Number(
      map.month
    );

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

function indiaDateStartToUtcIso(
  dateText: string
) {
  return new Date(
    `${dateText}T00:00:00+05:30`
  ).toISOString();
}

function indiaDateEndToUtcIso(
  dateText: string
) {
  return new Date(
    `${dateText}T23:59:59.999+05:30`
  ).toISOString();
}

async function fetchAllMonthRows({
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
    any[] =
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
            OrderId,
            EntrySource,
            Status,
            SubStatus,
            Remarks,
            SettlementAmount,
            PreviousBal,
            CurrentBal,
            TotalAmount,
            CreatedAt
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
        ? data
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

export async function GET(
  _req: NextRequest,
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

    const {
      data:
        latestRow,
      error:
        latestError,
    } =
      await supabase
        .from(
          "RestroRDS"
        )
        .select(
          `
            RDSId,
            OrderId,
            EntrySource,
            SettlementAmount,
            CurrentBal,
            CreatedAt
          `
        )
        .eq(
          "RestroCode",
          restroCode
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
      latestError
    ) {
      throw new Error(
        latestError.message
      );
    }

    const monthRange =
      getIndiaMonthRange();

    const monthRows =
      await fetchAllMonthRows(
        {
          restroCode,
          fromUtc:
            indiaDateStartToUtcIso(
              monthRange.from
            ),
          toUtc:
            indiaDateEndToUtcIso(
              monthRange.to
            ),
        }
      );

    let orderCount =
      0;

    let totalBusiness =
      0;

    let creditNoteCount =
      0;

    let creditNoteAmount =
      0;

    let debitNoteCount =
      0;

    let debitNoteAmount =
      0;

    let paymentPaidCount =
      0;

    let paymentPaidAmount =
      0;

    let paymentReceivedCount =
      0;

    let paymentReceivedAmount =
      0;

    for (
      const row of monthRows
    ) {
      const source =
        normalizeSource(
          row.EntrySource
        );

      const settlementAmount =
        roundMoney(
          row.SettlementAmount
        );

      if (
        source ===
        "order"
      ) {
        orderCount +=
          1;

        totalBusiness +=
          numberValue(
            row.TotalAmount
          );
      } else if (
        source ===
        "creditnote"
      ) {
        creditNoteCount +=
          1;

        creditNoteAmount +=
          Math.abs(
            settlementAmount
          );
      } else if (
        source ===
        "debitnote"
      ) {
        debitNoteCount +=
          1;

        debitNoteAmount +=
          Math.abs(
            settlementAmount
          );
      } else if (
        source ===
        "paymentpaid"
      ) {
        paymentPaidCount +=
          1;

        paymentPaidAmount +=
          Math.abs(
            settlementAmount
          );
      } else if (
        source ===
        "paymentreceived"
      ) {
        paymentReceivedCount +=
          1;

        paymentReceivedAmount +=
          Math.abs(
            settlementAmount
          );
      }
    }

    const {
      data:
        lastSettlement,
      error:
        settlementError,
    } =
      await supabase
        .from(
          "RestroSettlements"
        )
        .select(
          `
            SettlementId,
            SettlementType,
            Amount,
            PaymentDate,
            PaymentMode,
            UTR,
            ReferenceNo,
            RestroRDSId,
            RERDSId,
            CreatedAt
          `
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .order(
          "SettlementId",
          {
            ascending:
              false,
          }
        )
        .limit(1)
        .maybeSingle();

    if (
      settlementError
    ) {
      throw new Error(
        settlementError.message
      );
    }

    return NextResponse.json(
      {
        ok: true,

        restro,

        period: {
          from:
            monthRange.from,
          to:
            monthRange.to,
        },

        summary: {
          currentBalance:
            roundMoney(
              latestRow
                ?.CurrentBal
            ),

          orderCount,

          totalBusiness:
            roundMoney(
              totalBusiness
            ),

          creditNoteCount,

          creditNoteAmount:
            roundMoney(
              creditNoteAmount
            ),

          debitNoteCount,

          debitNoteAmount:
            roundMoney(
              debitNoteAmount
            ),

          paymentPaidCount,

          paymentPaidAmount:
            roundMoney(
              paymentPaidAmount
            ),

          paymentReceivedCount,

          paymentReceivedAmount:
            roundMoney(
              paymentReceivedAmount
            ),

          netSettlement:
            roundMoney(
              paymentReceivedAmount -
              paymentPaidAmount
            ),
        },

        lastTransaction:
          latestRow
            ? {
                ...latestRow,

                SettlementAmount:
                  roundMoney(
                    latestRow
                      .SettlementAmount
                  ),

                CurrentBal:
                  roundMoney(
                    latestRow
                      .CurrentBal
                  ),

                CreatedAtFormatted:
                  formatIndiaDateTime(
                    latestRow
                      .CreatedAt
                  ),
              }
            : null,

        lastSettlement:
          lastSettlement
            ? {
                ...lastSettlement,

                Amount:
                  roundMoney(
                    lastSettlement
                      .Amount
                  ),

                CreatedAtFormatted:
                  formatIndiaDateTime(
                    lastSettlement
                      .CreatedAt
                  ),
              }
            : null,

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
        },
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "RESTRO ACCOUNTING DASHBOARD ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ||
          "Unable to load accounting dashboard",
      },
      {
        status: 500,
      }
    );
  }
}
