// app/api/restros/[code]/settlement/route.ts

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
   HELPERS
   ========================================================= */

function cleanText(
  value: unknown
) {
  const text =
    String(value ?? "").trim();

  return text || null;
}

function cleanAmount(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(
      String(value)
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    );

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return null;
  }

  return (
    Math.round(
      Math.abs(parsed) *
        100
    ) / 100
  );
}

function normalizeDate(
  value: unknown
) {
  const text =
    String(value ?? "").trim();

  if (!text) {
    return null;
  }

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

function normalizeSettlementType(
  value: unknown
) {
  const key =
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        ""
      );

  if (
    key ===
      "paymentpaid" ||
    key ===
      "paid" ||
    key ===
      "pay"
  ) {
    return "PaymentPaid";
  }

  if (
    key ===
      "paymentreceived" ||
    key ===
      "received" ||
    key ===
      "receive"
  ) {
    return "PaymentReceived";
  }

  return null;
}

function normalizePaymentMode(
  value: unknown
) {
  const key =
    String(value ?? "")
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ""
      );

  if (!key) {
    return null;
  }

  if (
    key === "NEFT"
  ) {
    return "NEFT";
  }

  if (
    key === "RTGS"
  ) {
    return "RTGS";
  }

  if (
    key === "IMPS"
  ) {
    return "IMPS";
  }

  if (
    key === "UPI"
  ) {
    return "UPI";
  }

  if (
    key === "BANKTRANSFER" ||
    key === "TRANSFER"
  ) {
    return "BANK TRANSFER";
  }

  if (
    key === "CASH"
  ) {
    return "CASH";
  }

  if (
    key === "CHEQUE" ||
    key === "CHECK"
  ) {
    return "CHEQUE";
  }

  return cleanText(value);
}

function rpcErrorMessage(
  error: any
) {
  return [
    error?.message,
    error?.details,
    error?.hint,
    error?.code,
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatIndiaDateTime(
  value: unknown
) {
  const text =
    String(value ?? "").trim();

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
    `${map.hour}:${map.minute}`
  );
}

/* =========================================================
   GET

   Restaurant details, current balance aur recent settlement
   history load karne ke liye.
   ========================================================= */

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

    /* =====================================================
       RESTAURANT DETAILS
       ===================================================== */

    const {
      data: restro,
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
            StationName
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
      return NextResponse.json(
        {
          ok: false,
          error:
            restroError.message,
        },
        {
          status: 500,
        }
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
       CURRENT RESTAURANT BALANCE
       ===================================================== */

    const {
      data:
        lastRdsRow,
      error:
        balanceError,
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
      balanceError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            balanceError.message,
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       RECENT SETTLEMENT HISTORY
       ===================================================== */

    const {
      data:
        settlements,
      error:
        settlementsError,
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
        .limit(50);

    if (
      settlementsError
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            settlementsError.message,
        },
        {
          status: 500,
        }
      );
    }

    const history =
      (
        Array.isArray(
          settlements
        )
          ? settlements
          : []
      ).map(
        (
          row: any
        ) => ({
          ...row,

          Amount:
            Number(
              row.Amount ??
              0
            ),

          CreatedAtFormatted:
            formatIndiaDateTime(
              row.CreatedAt
            ),
        })
      );

    return NextResponse.json(
      {
        ok: true,

        restro: {
          RestroCode:
            restro.RestroCode,

          RestroName:
            restro.RestroName,

          StationCode:
            restro.StationCode,

          StationName:
            restro.StationName,
        },

        currentBalance:
          Number(
            lastRdsRow
              ?.CurrentBal ??
            0
          ),

        lastRdsAt:
          lastRdsRow
            ?.CreatedAt ??
          null,

        lastRdsAtFormatted:
          formatIndiaDateTime(
            lastRdsRow
              ?.CreatedAt
          ),

        settlements:
          history,
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
      "SETTLEMENT GET ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST

   Restaurant settlement create karne ke liye.

   PaymentPaid:
   - RailEats ne restaurant ko payment diya
   - RestroRDS SettlementAmount negative
   - RERDS company perspective positive

   PaymentReceived:
   - Restaurant ne RailEats ko payment diya
   - RestroRDS SettlementAmount positive
   - RERDS company perspective negative
   ========================================================= */

export async function POST(
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

    const body =
      await req
        .json()
        .catch(
          () => ({})
        );

    const settlementType =
      normalizeSettlementType(
        body.settlementType ??
        body.SettlementType ??
        body.type ??
        body.Type
      );

    const amount =
      cleanAmount(
        body.amount ??
        body.Amount ??
        body.settlementAmount ??
        body.SettlementAmount
      );

    const paymentDate =
      normalizeDate(
        body.paymentDate ??
        body.PaymentDate ??
        body.date ??
        body.Date
      );

    const paymentMode =
      normalizePaymentMode(
        body.paymentMode ??
        body.PaymentMode ??
        body.mode ??
        body.Mode
      );

    const bankName =
      cleanText(
        body.bankName ??
        body.BankName ??
        body.bank ??
        body.Bank
      );

    const utr =
      cleanText(
        body.utr ??
        body.UTR ??
        body.transactionId ??
        body.TransactionId
      );

    const referenceNo =
      cleanText(
        body.referenceNo ??
        body.ReferenceNo ??
        body.reference ??
        body.Reference
      );

    const remarks =
      cleanText(
        body.remarks ??
        body.Remarks ??
        body.note ??
        body.Note
      );

    const createdBy =
      cleanText(
        body.createdBy ??
        body.CreatedBy ??
        body.adminName ??
        body.AdminName
      );

    /* =====================================================
       VALIDATION
       ===================================================== */

    if (
      !settlementType
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Please select Payment Paid or Payment Received",
        },
        {
          status: 400,
        }
      );
    }

    if (
      amount === null ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Amount must be greater than 0",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !paymentDate
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Valid Payment Date is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !paymentMode
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Payment Mode is required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      paymentMode !==
        "CASH" &&
      !utr &&
      !referenceNo
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "UTR or Reference Number is required for non-cash settlement",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       VERIFY RESTAURANT
       ===================================================== */

    const {
      data: restro,
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
            StationName
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
      return NextResponse.json(
        {
          ok: false,
          error:
            restroError.message,
        },
        {
          status: 500,
        }
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
       CALL SQL FUNCTION

       Settlement type UI se validated value aayegi
       ===================================================== */

    const {
      data,
      error,
    } =
      await supabase
        .rpc(
          "create_restro_settlement",
          {
            p_restro_code:
              restroCode,

            p_settlement_type:
              settlementType,

            p_amount:
              amount,

            p_payment_date:
              paymentDate,

            p_payment_mode:
              paymentMode,

            p_bank_name:
              bankName,

            p_utr:
              utr,

            p_reference_no:
              referenceNo,

            p_remarks:
              remarks,

            p_created_by:
              createdBy,
          }
        );

    if (error) {
      const message =
        rpcErrorMessage(
          error
        );

      console.error(
        "CREATE RESTRO SETTLEMENT RPC ERROR =>",
        {
          restroCode,
          settlementType,
          amount,
          paymentDate,
          paymentMode,
          bankName,
          utr,
          referenceNo,
          error:
            message,
        }
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            message ||
            "Unable to create settlement",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Settlement function returned an empty response",
        },
        {
          status: 500,
        }
      );
    }

    if (
      data?.ok ===
      false
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            cleanText(
              data?.error
            ) ||
            "Unable to create settlement",

          data,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SUCCESS
       ===================================================== */

    return NextResponse.json(
      {
        ok: true,

        message:
          settlementType ===
          "PaymentPaid"
            ? "Payment Paid settlement saved successfully"
            : "Payment Received settlement saved successfully",

        restro: {
          RestroCode:
            restro.RestroCode,

          RestroName:
            restro.RestroName,

          StationCode:
            restro.StationCode,

          StationName:
            restro.StationName,
        },

        settlement: {
          settlementId:
            data
              ?.settlementId ??
            null,

          referenceId:
            data
              ?.referenceId ??
            null,

          settlementType:
            data
              ?.settlementType ??
            settlementType,

          amount:
            Number(
              data
                ?.amount ??
              amount
            ),

          restroSettlementAmount:
            Number(
              data
                ?.restroSettlementAmount ??
              (
                settlementType ===
                "PaymentPaid"
                  ? -amount
                  : amount
              )
            ),

          previousBalance:
            Number(
              data
                ?.previousBalance ??
              0
            ),

          currentBalance:
            Number(
              data
                ?.currentBalance ??
              0
            ),

          restroRdsId:
            data
              ?.restroRdsId ??
            null,

          reRdsId:
            data
              ?.reRdsId ??
            null,

          paymentDate,

          paymentMode,

          bankName,

          utr,

          referenceNo,

          remarks,

          createdBy,
        },

        data,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: any
  ) {
    console.error(
      "SETTLEMENT POST ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error?.message ||
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}
