// app/api/admin/re-rds/export/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  NextRequest,
  NextResponse,
} from "next/server";

import * as XLSX from "xlsx";

import {
  serviceClient,
} from "@/lib/supabaseServer";

const RE_RDS_EXPORT_COLUMNS = `
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

const EXPORT_BATCH_SIZE = 1000;

function cleanText(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
}

function cleanRestroCode(
  value: unknown
) {
  return cleanText(
    value
  ).replace(
    /[^\d]/g,
    ""
  );
}

function cleanOrderId(
  value: unknown
) {
  return cleanText(
    value
  )
    .replace(
      /[%_,]/g,
      ""
    )
    .slice(
      0,
      100
    );
}

function normalizeDateTimeFilter(
  value: unknown,
  isEnd = false
) {
  const text =
    cleanText(
      value
    );

  if (!text) {
    return null;
  }

  const match =
    text.match(
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

  const suffix =
    isEnd
      ? ":59.999+05:30"
      : ":00.000+05:30";

  return (
    `${year}-${month}-${day}` +
    `T${hour}:${minute}` +
    suffix
  );
}

function roundMoney(
  value: unknown
) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(
      parsed
    )
  ) {
    return 0;
  }

  return (
    Math.round(
      parsed * 100
    ) / 100
  );
}

function formatIndiaDateTime(
  value: unknown
) {
  const text =
    cleanText(
      value
    );

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
    Record<
      string,
      string
    > = {};

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

function formatDeliveryDate(
  value: unknown
) {
  const text =
    cleanText(
      value
    );

  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  return match
    ? `${match[3]}-${match[2]}-${match[1]}`
    : text;
}

function formatDeliveryTime(
  value: unknown
) {
  const text =
    cleanText(
      value
    );

  return text
    ? text.slice(
        0,
        8
      )
    : "";
}

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
    restroCode:
      string;
    orderId:
      string;
    entrySource:
      string;
    paymentMode:
      string;
    status:
      string;
    fromDateTime:
      string | null;
    toDateTime:
      string | null;
  }
) {
  let nextQuery =
    query;

  if (
    restroCode
  ) {
    nextQuery =
      nextQuery.eq(
        "RestroCode",
        Number(
          restroCode
        )
      );
  }

  if (
    orderId
  ) {
    nextQuery =
      nextQuery.ilike(
        "OrderId",
        `%${orderId}%`
      );
  }

  if (
    entrySource
  ) {
    nextQuery =
      nextQuery.eq(
        "EntrySource",
        entrySource
      );
  }

  if (
    paymentMode
  ) {
    nextQuery =
      nextQuery.eq(
        "PaymentMode",
        paymentMode
      );
  }

  if (
    status
  ) {
    nextQuery =
      nextQuery.ilike(
        "Status",
        status
      );
  }

  if (
    fromDateTime
  ) {
    nextQuery =
      nextQuery.gte(
        "CreatedAt",
        fromDateTime
      );
  }

  if (
    toDateTime
  ) {
    nextQuery =
      nextQuery.lte(
        "CreatedAt",
        toDateTime
      );
  }

  return nextQuery;
}

async function fetchAllRows(
  filters: {
    restroCode:
      string;
    orderId:
      string;
    entrySource:
      string;
    paymentMode:
      string;
    status:
      string;
    fromDateTime:
      string | null;
    toDateTime:
      string | null;
  }
) {
  const allRows:
    any[] = [];

  let fromIndex =
    0;

  while (true) {
    let query =
      serviceClient
        .from(
          "RERDS"
        )
        .select(
          RE_RDS_EXPORT_COLUMNS
        );

    query =
      applyFilters(
        query,
        filters
      );

    const {
      data,
      error,
    } =
      await query
        .order(
          "CreatedAt",
          {
            ascending:
              true,
          }
        )
        .order(
          "RERDSId",
          {
            ascending:
              true,
          }
        )
        .range(
          fromIndex,
          fromIndex +
            EXPORT_BATCH_SIZE -
            1
        );

    if (error) {
      throw new Error(
        error.message ||
        "Unable to export RE RDS"
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
      EXPORT_BATCH_SIZE
    ) {
      break;
    }

    fromIndex +=
      EXPORT_BATCH_SIZE;
  }

  return allRows;
}

function buildSafeFileName(
  restroCode:
    string,
  fromRaw:
    string,
  toRaw:
    string
) {
  const datePart =
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
    )
      .format(
        new Date()
      )
      .replace(
        /-/g,
        ""
      );

  const filterPart =
    [
      restroCode
        ? `Restro-${restroCode}`
        : "All-Restros",
      fromRaw
        ? `From-${fromRaw.replace(/[:T]/g, "-")}`
        : "",
      toRaw
        ? `To-${toRaw.replace(/[:T]/g, "-")}`
        : "",
    ]
      .filter(
        Boolean
      )
      .join(
        "_"
      );

  return (
    `RE-RDS_${filterPart}_${datePart}.xlsx`
  );
}

export async function GET(
  req: NextRequest
) {
  try {
    const params =
      req.nextUrl
        .searchParams;

    const restroCode =
      cleanRestroCode(
        params.get(
          "restroCode"
        )
      );

    const orderId =
      cleanOrderId(
        params.get(
          "orderId"
        )
      );

    const entrySource =
      cleanText(
        params.get(
          "entrySource"
        )
      );

    const paymentMode =
      cleanText(
        params.get(
          "paymentMode"
        )
      );

    const status =
      cleanText(
        params.get(
          "status"
        )
      );

    const fromRaw =
      cleanText(
        params.get(
          "from"
        )
      );

    const toRaw =
      cleanText(
        params.get(
          "to"
        )
      );

    const fromDateTime =
      normalizeDateTimeFilter(
        fromRaw,
        false
      );

    const toDateTime =
      normalizeDateTimeFilter(
        toRaw,
        true
      );

    if (
      fromDateTime &&
      toDateTime &&
      new Date(
        fromDateTime
      ) >
        new Date(
          toDateTime
        )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "From Date-Time cannot be greater than To Date-Time",
        },
        {
          status:
            400,
        }
      );
    }

    const filters = {
      restroCode,
      orderId,
      entrySource,
      paymentMode,
      status,
      fromDateTime,
      toDateTime,
    };

    const rows =
      await fetchAllRows(
        filters
      );

    let totalReceivable =
      0;

    let totalPayable =
      0;

    let netMovement =
      0;

    let orderCount =
      0;

    let creditNoteCount =
      0;

    let debitNoteCount =
      0;

    for (
      const row of rows
    ) {
      const amount =
        roundMoney(
          row
            .RESettlementAmount
        );

      netMovement +=
        amount;

      if (
        amount > 0
      ) {
        totalReceivable +=
          amount;
      }

      if (
        amount < 0
      ) {
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

      if (
        source ===
        "order"
      ) {
        orderCount +=
          1;
      } else if (
        source ===
        "creditnote"
      ) {
        creditNoteCount +=
          1;
      } else if (
        source ===
        "debitnote"
      ) {
        debitNoteCount +=
          1;
      }
    }

    let openingBalance =
      0;

    if (
      fromDateTime
    ) {
      let openingQuery =
        serviceClient
          .from(
            "RERDS"
          )
          .select(
            `
              RERDSId,
              CurrentBal,
              CreatedAt
            `
          )
          .lt(
            "CreatedAt",
            fromDateTime
          );

      if (
        restroCode
      ) {
        openingQuery =
          openingQuery.eq(
            "RestroCode",
            Number(
              restroCode
            )
          );
      }

      const {
        data:
          openingRow,
        error:
          openingError,
      } =
        await openingQuery
          .order(
            "CreatedAt",
            {
              ascending:
                false,
            }
          )
          .order(
            "RERDSId",
            {
              ascending:
                false,
            }
          )
          .limit(
            1
          )
          .maybeSingle();

      if (
        openingError
      ) {
        throw new Error(
          openingError.message
        );
      }

      openingBalance =
        roundMoney(
          openingRow
            ?.CurrentBal
        );
    }

    const closingBalance =
      roundMoney(
        openingBalance +
        netMovement
      );

    const exportRows =
      rows.map(
        (
          row: any
        ) => ({
          "RE RDS ID":
            row.RERDSId,
          "Restro RDS ID":
            row.RestroRDSId,
          "Order / Reference":
            row.OrderId,
          "Entry Source":
            row.EntrySource,
          "Restro Code":
            row.RestroCode,
          "Restro Name":
            row.RestroName,
          "Station Code":
            row.StationCode,
          Status:
            row.Status,
          "Sub Status":
            row.SubStatus,
          Remarks:
            row.Remarks,
          "Delivery Date":
            formatDeliveryDate(
              row.DeliveryDate
            ),
          "Delivery Time":
            formatDeliveryTime(
              row.DeliveryTime
            ),
          "Payment Mode":
            row.PaymentMode,
          "Coupon Code":
            row.CouponCode,
          "Restro Price":
            roundMoney(
              row.RestroPrice
            ),
          "Base Price":
            roundMoney(
              row.BasePrice
            ),
          "Discounted Base Price":
            roundMoney(
              row.DiscountedBasePrice
            ),
          Commission:
            roundMoney(
              row.Commission
            ),
          GST:
            roundMoney(
              row.GSTAmount
            ),
          "Platform Charge":
            roundMoney(
              row.PlatformCharge
            ),
          "Restro Discount":
            roundMoney(
              row.RestroDiscount
            ),
          "RE Discount":
            roundMoney(
              row.REDiscount
            ),
          "Total Amount":
            roundMoney(
              row.TotalAmount
            ),
          "COD Amount":
            roundMoney(
              row.CODAmount
            ),
          "PPD Amount":
            roundMoney(
              row.PPDAmount
            ),
          Penalty:
            roundMoney(
              row.OrderPenalty
            ),
          IGST:
            roundMoney(
              row.IGST
            ),
          "Order Charges":
            roundMoney(
              row.OrderCharges
            ),
          "Restro Settlement":
            roundMoney(
              row.RestroSettlementAmount
            ),
          "RE Settlement":
            roundMoney(
              row.RESettlementAmount
            ),
          "Previous Balance":
            roundMoney(
              row.PreviousBal
            ),
          "Current Balance":
            roundMoney(
              row.CurrentBal
            ),
          "Created At":
            formatIndiaDateTime(
              row.CreatedAt
            ),
        })
      );

    const workbook =
      XLSX.utils
        .book_new();

    const statementSheet =
      XLSX.utils
        .json_to_sheet(
          exportRows
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
      { wch: 10 },
      { wch: 13 },
      { wch: 24 },
      { wch: 14 },
      { wch: 12 },
      { wch: 28 },
      { wch: 12 },
      { wch: 16 },
      { wch: 18 },
      { wch: 28 },
      { wch: 13 },
      { wch: 13 },
      { wch: 13 },
      { wch: 16 },
      { wch: 13 },
      { wch: 13 },
      { wch: 19 },
      { wch: 13 },
      { wch: 12 },
      { wch: 15 },
      { wch: 16 },
      { wch: 13 },
      { wch: 14 },
      { wch: 13 },
      { wch: 13 },
      { wch: 13 },
      { wch: 13 },
      { wch: 15 },
      { wch: 18 },
      { wch: 16 },
      { wch: 17 },
      { wch: 17 },
      { wch: 20 },
    ];

    const moneyHeaders =
      new Set([
        "Restro Price",
        "Base Price",
        "Discounted Base Price",
        "Commission",
        "GST",
        "Platform Charge",
        "Restro Discount",
        "RE Discount",
        "Total Amount",
        "COD Amount",
        "PPD Amount",
        "Penalty",
        "IGST",
        "Order Charges",
        "Restro Settlement",
        "RE Settlement",
        "Previous Balance",
        "Current Balance",
      ]);

    const range =
      XLSX.utils
        .decode_range(
          statementSheet[
            "!ref"
          ] ||
          "A1:A1"
        );

    for (
      let col =
        range.s.c;
      col <=
        range.e.c;
      col +=
        1
    ) {
      const headerCell =
        statementSheet[
          XLSX.utils
            .encode_cell({
              r: 0,
              c: col,
            })
        ];

      const header =
        cleanText(
          headerCell
            ?.v
        );

      if (
        !moneyHeaders
          .has(
            header
          )
      ) {
        continue;
      }

      for (
        let rowIndex =
          1;
        rowIndex <=
          range.e.r;
        rowIndex +=
          1
      ) {
        const address =
          XLSX.utils
            .encode_cell({
              r:
                rowIndex,
              c:
                col,
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
    }

    XLSX.utils
      .book_append_sheet(
        workbook,
        statementSheet,
        "RE RDS Statement"
      );

    const summaryRows:
      Array<
        [string, any]
      > = [
        [
          "Report",
          "RailEats RE RDS Statement",
        ],
        [
          "Generated At",
          formatIndiaDateTime(
            new Date()
          ),
        ],
        [
          "Restro Code",
          restroCode ||
            "All Restaurants",
        ],
        [
          "Order / Reference",
          orderId ||
            "All",
        ],
        [
          "Entry Source",
          entrySource ||
            "All",
        ],
        [
          "Payment Mode",
          paymentMode ||
            "All",
        ],
        [
          "Status",
          status ||
            "All",
        ],
        [
          "From",
          fromRaw ||
            "Beginning",
        ],
        [
          "To",
          toRaw ||
            "Latest",
        ],
        [
          "",
          "",
        ],
        [
          "Opening Balance",
          openingBalance,
        ],
        [
          "Total Receivable",
          roundMoney(
            totalReceivable
          ),
        ],
        [
          "Total Payable",
          roundMoney(
            totalPayable
          ),
        ],
        [
          "Net Movement",
          roundMoney(
            netMovement
          ),
        ],
        [
          "Closing Balance",
          closingBalance,
        ],
        [
          "Total Transactions",
          rows.length,
        ],
        [
          "Orders",
          orderCount,
        ],
        [
          "Credit Notes",
          creditNoteCount,
        ],
        [
          "Debit Notes",
          debitNoteCount,
        ],
      ];

    const summarySheet =
      XLSX.utils
        .aoa_to_sheet(
          summaryRows
        );

    summarySheet[
      "!cols"
    ] = [
      {
        wch:
          24,
      },
      {
        wch:
          30,
      },
    ];

    for (
      const rowIndex of [
        10,
        11,
        12,
        13,
        14,
      ]
    ) {
      const cell =
        summarySheet[
          `B${
            rowIndex +
            1
          }`
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

    XLSX.utils
      .book_append_sheet(
        workbook,
        summarySheet,
        "Summary"
      );

    const output =
      XLSX.write(
        workbook,
        {
          type:
            "buffer",
          bookType:
            "xlsx",
          compression:
            true,
        }
      );

    const fileName =
      buildSafeFileName(
        restroCode,
        fromRaw,
        toRaw
      );

    return new NextResponse(
      output,
      {
        status:
          200,
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
      "RE RDS EXPORT ERROR =>",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "Unable to export RE RDS",
      },
      {
        status:
          500,
      }
    );
  }
}
