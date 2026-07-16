// app/api/restros/[code]/settlement/receipt/route.ts

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

function buildReceiptNumber(
  paymentDate: unknown,
  settlementId: unknown
) {
  const dateText =
    cleanText(
      paymentDate
    ).replace(
      /-/g,
      ""
    );

  const idText =
    cleanText(
      settlementId
    ).padStart(
      6,
      "0"
    );

  return (
    `RS-${dateText || "00000000"}-${idText}`
  );
}

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

    const settlementId =
      Number(
        req.nextUrl
          .searchParams
          .get(
            "settlementId"
          )
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

    if (
      !settlementId ||
      !Number.isFinite(
        settlementId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid Settlement ID",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        settlement,
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
            RestroCode,
            RestroName,
            StationCode,
            SettlementType,
            Amount,
            PaymentDate,
            PaymentMode,
            BankName,
            UTR,
            ReferenceNo,
            Remarks,
            RestroRDSId,
            RERDSId,
            CreatedBy,
            CreatedAt,
            UpdatedAt
          `
        )
        .eq(
          "SettlementId",
          settlementId
        )
        .eq(
          "RestroCode",
          restroCode
        )
        .maybeSingle();

    if (
      settlementError
    ) {
      throw new Error(
        settlementError.message
      );
    }

    if (!settlement) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Settlement receipt not found",
        },
        {
          status: 404,
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

    let ledger:
      any = null;

    if (
      settlement.RestroRDSId
    ) {
      const {
        data:
          ledgerRow,
        error:
          ledgerError,
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
              PreviousBal,
              CurrentBal,
              CreatedAt
            `
          )
          .eq(
            "RDSId",
            settlement
              .RestroRDSId
          )
          .maybeSingle();

      if (
        ledgerError
      ) {
        throw new Error(
          ledgerError.message
        );
      }

      ledger =
        ledgerRow;
    }

    return NextResponse.json(
      {
        ok: true,

        receiptNumber:
          buildReceiptNumber(
            settlement
              .PaymentDate,
            settlement
              .SettlementId
          ),

        settlement: {
          ...settlement,
          Amount:
            numberValue(
              settlement.Amount
            ),
          CreatedAtFormatted:
            formatIndiaDateTime(
              settlement
                .CreatedAt
            ),
        },

        restro: {
          RestroCode:
            restro
              ?.RestroCode ??
            settlement
              .RestroCode,

          RestroName:
            restro
              ?.RestroName ??
            settlement
              .RestroName,

          StationCode:
            restro
              ?.StationCode ??
            settlement
              .StationCode,

          StationName:
            restro
              ?.StationName ??
            "",

          State:
            restro
              ?.State ??
            "",
        },

        ledger: ledger
          ? {
              ...ledger,
              SettlementAmount:
                numberValue(
                  ledger
                    .SettlementAmount
                ),
              PreviousBal:
                numberValue(
                  ledger
                    .PreviousBal
                ),
              CurrentBal:
                numberValue(
                  ledger
                    .CurrentBal
                ),
              CreatedAtFormatted:
                formatIndiaDateTime(
                  ledger
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
      "SETTLEMENT RECEIPT ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to load settlement receipt",
      },
      {
        status: 500,
      }
    );
  }
}
