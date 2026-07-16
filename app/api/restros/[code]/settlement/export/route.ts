// app/api/restros/[code]/settlement/export/route.ts

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

import * as XLSX from "xlsx";

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

function formatDate(
  value: unknown
) {
  const text =
    cleanText(value);

  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return text;
  }

  return (
    `${match[3]}-${match[2]}-${match[1]}`
  );
}

function settlementTypeLabel(
  value: unknown
) {
  const key =
    cleanText(value)
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        ""
      );

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

  return cleanText(value);
}

function safeFileNamePart(
  value: unknown
) {
  return cleanText(value)
    .replace(
      /[^a-zA-Z0-9-_]/g,
      "-"
    )
    .replace(
      /-+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}

/* =========================================================
   GET - EXPORT SETTLEMENT HISTORY
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
       CURRENT BALANCE
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
      throw new Error(
        balanceError.message
      );
    }

    /* =====================================================
       ALL SETTLEMENTS
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
              true,
          }
        );

    if (
      settlementsError
    ) {
      throw new Error(
        settlementsError.message
      );
    }

    const rows =
      Array.isArray(
        settlements
      )
        ? settlements
        : [];

    const totalAmountPaid =
      roundMoney(
        rows.reduce(
          (
            total,
            row: any
          ) =>
            total +
            numberValue(
              row.Amount
            ),
          0
        )
      );

    const latestSettlement =
      rows.length > 0
        ? rows[
            rows.length - 1
          ]
        : null;

    const statementRows =
      rows.map(
        (
          row: any
        ) => ({
          "Settlement ID":
            row.SettlementId,
          "Payment Date":
            formatDate(
              row.PaymentDate
            ),
          "Settlement Type":
            settlementTypeLabel(
              row.SettlementType
            ),
          "Amount":
            roundMoney(
              row.Amount
            ),
          "Payment Mode":
            cleanText(
              row.PaymentMode
            ),
          "Bank Name":
            cleanText(
              row.BankName
            ),
          "UTR":
            cleanText(
              row.UTR
            ),
          "Reference Number":
            cleanText(
              row.ReferenceNo
            ),
          "Restro RDS ID":
            row.RestroRDSId,
          "RE RDS ID":
            row.RERDSId,
          "Created By":
            cleanText(
              row.CreatedBy
            ),
          "Created At":
            formatIndiaDateTime(
              row.CreatedAt
            ),
          "Remarks":
            cleanText(
              row.Remarks
            ),
        })
      );

    const workbook =
      XLSX.utils.book_new();

    const statementSheet =
      XLSX.utils.json_to_sheet(
        statementRows
      );

    statementSheet[
      "!freeze"
    ] = {
      xSplit: 0,
      ySplit: 1,
    } as any;

    statementSheet[
      "!autofilter"
    ] = {
      ref:
        statementSheet[
          "!ref"
        ] ||
        "A1:A1",
    };

    statementSheet[
      "!cols"
    ] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
      { wch: 24 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 22 },
      { wch: 36 },
    ];

    const range =
      XLSX.utils.decode_range(
        statementSheet[
          "!ref"
        ] ||
          "A1:A1"
      );

    for (
      let rowIndex = 1;
      rowIndex <=
        range.e.r;
      rowIndex += 1
    ) {
      const address =
        XLSX.utils.encode_cell({
          r: rowIndex,
          c: 3,
        });

      const cell =
        statementSheet[
          address
        ];

      if (
        cell &&
        typeof cell.v ===
          "number"
      ) {
        cell.z =
          '₹#,##0.00;[Red]-₹#,##0.00';
      }
    }

    XLSX.utils.book_append_sheet(
      workbook,
      statementSheet,
      "Settlement History"
    );

    const summaryRows:
      Array<
        [string, any]
      > = [
        [
          "Report",
          "RailEats Restaurant Settlement Statement",
        ],
        [
          "Generated At",
          formatIndiaDateTime(
            new Date()
          ),
        ],
        [
          "Restro Code",
          restro.RestroCode,
        ],
        [
          "Restro Name",
          restro.RestroName ||
            "",
        ],
        [
          "Station",
          [
            restro.StationCode,
            restro.StationName,
          ]
            .filter(Boolean)
            .join(" - "),
        ],
        [
          "",
          "",
        ],
        [
          "Current Outstanding",
          roundMoney(
            lastRdsRow
              ?.CurrentBal
          ),
        ],
        [
          "Total Settlements",
          rows.length,
        ],
        [
          "Total Amount Paid",
          totalAmountPaid,
        ],
        [
          "Last Settlement Date",
          latestSettlement
            ? formatDate(
                latestSettlement
                  .PaymentDate
              )
            : "",
        ],
        [
          "Last Settlement Amount",
          latestSettlement
            ? roundMoney(
                latestSettlement
                  .Amount
              )
            : 0,
        ],
        [
          "Last Ledger Entry",
          lastRdsRow
            ?.CreatedAt
            ? formatIndiaDateTime(
                lastRdsRow
                  .CreatedAt
              )
            : "",
        ],
      ];

    const summarySheet =
      XLSX.utils.aoa_to_sheet(
        summaryRows
      );

    summarySheet[
      "!cols"
    ] = [
      {
        wch: 26,
      },
      {
        wch: 42,
      },
    ];

    for (
      const rowNumber of [
        7,
        9,
        11,
      ]
    ) {
      const cell =
        summarySheet[
          `B${rowNumber}`
        ];

      if (
        cell &&
        typeof cell.v ===
          "number"
      ) {
        cell.z =
          '₹#,##0.00;[Red]-₹#,##0.00';
      }
    }

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Summary"
    );

    const output =
      XLSX.write(
        workbook,
        {
          type: "buffer",
          bookType: "xlsx",
          compression: true,
        }
      );

    const restroNamePart =
      safeFileNamePart(
        restro.RestroName
      );

    const fileName =
      `Settlement-${restroCode}` +
      (
        restroNamePart
          ? `-${restroNamePart}`
          : ""
      ) +
      `.xlsx`;

    return new NextResponse(
      output,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="${fileName}"`,

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
      "SETTLEMENT EXPORT ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to export settlement history",
      },
      {
        status: 500,
      }
    );
  }
}
