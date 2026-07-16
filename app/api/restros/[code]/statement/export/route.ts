// app/api/restros/[code]/statement/export/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

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
  SettlementAmount: number | string | null;
  PreviousBal: number | string | null;
  CurrentBal: number | string | null;
  CreatedAt: string | null;
  UpdatedAt?: string | null;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: unknown) {
  return Math.round(numberValue(value) * 100) / 100;
}

function normalizeDate(value: unknown) {
  const text = cleanText(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
  if (Number.isNaN(date.getTime())) return null;

  return `${year}-${month}-${day}`;
}

function getIndiaCurrentMonth() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const year = Number(map.year);
  const month = Number(map.month);
  const monthText = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    from: `${year}-${monthText}-01`,
    to: `${year}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}

function indiaDateStartToUtcIso(dateText: string) {
  return new Date(`${dateText}T00:00:00+05:30`).toISOString();
}

function indiaDateEndToUtcIso(dateText: string) {
  return new Date(`${dateText}T23:59:59.999+05:30`).toISOString();
}

function formatDate(value: unknown) {
  const text = cleanText(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return text;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function formatIndiaDateTime(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  return `${map.day}-${map.month}-${map.year} ${map.hour}:${map.minute}:${map.second}`;
}

function normalizeEntrySource(value: unknown) {
  return cleanText(value).toLowerCase().replace(/[^a-z]/g, "");
}

function entrySourceLabel(value: unknown) {
  const source = normalizeEntrySource(value);
  if (source === "order") return "Order";
  if (source === "creditnote") return "Credit Note";
  if (source === "debitnote") return "Debit Note";
  if (source === "paymentpaid") return "Payment Paid";
  if (source === "paymentreceived") return "Payment Received";
  if (source === "manual") return "Manual";
  return cleanText(value) || "-";
}

function buildParticular(row: RestroRdsRow) {
  return [
    entrySourceLabel(row.EntrySource),
    cleanText(row.Status),
    cleanText(row.SubStatus),
  ]
    .filter(Boolean)
    .join(" - ");
}

function safeFileNamePart(value: unknown) {
  return cleanText(value)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchAllStatementRows({
  restroCode,
  fromUtc,
  toUtc,
}: {
  restroCode: number;
  fromUtc: string;
  toUtc: string;
}) {
  const pageSize = 1000;
  let fromIndex = 0;
  const allRows: RestroRdsRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("RestroRDS")
      .select(`
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
        SettlementAmount,
        PreviousBal,
        CurrentBal,
        CreatedAt,
        UpdatedAt
      `)
      .eq("RestroCode", restroCode)
      .gte("CreatedAt", fromUtc)
      .lte("CreatedAt", toUtc)
      .order("RDSId", { ascending: true })
      .range(fromIndex, fromIndex + pageSize - 1);

    if (error) throw new Error(error.message);

    const batch = Array.isArray(data) ? (data as RestroRdsRow[]) : [];
    allRows.push(...batch);

    if (batch.length < pageSize) break;
    fromIndex += pageSize;
  }

  return allRows;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const restroCode = Number(params.code);

    if (!restroCode || !Number.isFinite(restroCode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid RestroCode" },
        { status: 400 }
      );
    }

    const defaultPeriod = getIndiaCurrentMonth();
    const fromDate =
      normalizeDate(req.nextUrl.searchParams.get("from")) || defaultPeriod.from;
    const toDate =
      normalizeDate(req.nextUrl.searchParams.get("to")) || defaultPeriod.to;

    if (fromDate > toDate) {
      return NextResponse.json(
        { ok: false, error: "From Date, To Date se badi nahi ho sakti" },
        { status: 400 }
      );
    }

    const fromUtc = indiaDateStartToUtcIso(fromDate);
    const toUtc = indiaDateEndToUtcIso(toDate);

    const { data: restro, error: restroError } = await supabase
      .from("RestroMaster")
      .select(`RestroCode, RestroName, StationCode, StationName, State`)
      .eq("RestroCode", restroCode)
      .maybeSingle();

    if (restroError) throw new Error(restroError.message);
    if (!restro) {
      return NextResponse.json(
        { ok: false, error: "Restaurant not found" },
        { status: 404 }
      );
    }

    const { data: previousRow, error: previousError } = await supabase
      .from("RestroRDS")
      .select(`RDSId, CurrentBal, CreatedAt`)
      .eq("RestroCode", restroCode)
      .lt("CreatedAt", fromUtc)
      .order("RDSId", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousError) throw new Error(previousError.message);

    const rows = await fetchAllStatementRows({ restroCode, fromUtc, toUtc });

    const openingBalance = roundMoney(
      previousRow?.CurrentBal ?? (rows.length > 0 ? rows[0].PreviousBal : 0)
    );

    let totalOrders = 0;
    let totalCreditNotes = 0;
    let totalDebitNotes = 0;
    let totalPaymentPaid = 0;
    let totalPaymentReceived = 0;
    let totalManual = 0;

    let orderCount = 0;
    let creditNoteCount = 0;
    let debitNoteCount = 0;
    let paymentPaidCount = 0;
    let paymentReceivedCount = 0;
    let manualCount = 0;

    const ledgerRows = rows.map((row) => {
      const source = normalizeEntrySource(row.EntrySource);
      const settlementAmount = roundMoney(row.SettlementAmount);
      const debit = settlementAmount < 0 ? Math.abs(settlementAmount) : 0;
      const credit = settlementAmount > 0 ? settlementAmount : 0;

      if (source === "order") {
        orderCount += 1;
        totalOrders += settlementAmount;
      } else if (source === "creditnote") {
        creditNoteCount += 1;
        totalCreditNotes += settlementAmount;
      } else if (source === "debitnote") {
        debitNoteCount += 1;
        totalDebitNotes += Math.abs(settlementAmount);
      } else if (source === "paymentpaid") {
        paymentPaidCount += 1;
        totalPaymentPaid += Math.abs(settlementAmount);
      } else if (source === "paymentreceived") {
        paymentReceivedCount += 1;
        totalPaymentReceived += Math.abs(settlementAmount);
      } else {
        manualCount += 1;
        totalManual += settlementAmount;
      }

      return {
        "RDS ID": row.RDSId,
        "Date & Time": formatIndiaDateTime(row.CreatedAt),
        "Entry Source": entrySourceLabel(row.EntrySource),
        Particular: buildParticular(row),
        Reference: cleanText(row.OrderId),
        "Payment Mode": cleanText(row.PaymentMode),
        Coupon: cleanText(row.CouponCode),
        Remarks: cleanText(row.Remarks),
        Debit: roundMoney(debit),
        Credit: roundMoney(credit),
        "Previous Balance": roundMoney(row.PreviousBal),
        "Current Balance": roundMoney(row.CurrentBal),
      };
    });

    const totalDebit = roundMoney(
      ledgerRows.reduce((sum, row) => sum + numberValue(row.Debit), 0)
    );
    const totalCredit = roundMoney(
      ledgerRows.reduce((sum, row) => sum + numberValue(row.Credit), 0)
    );
    const netMovement = roundMoney(totalCredit - totalDebit);
    const closingBalance = roundMoney(
      ledgerRows.length > 0
        ? ledgerRows[ledgerRows.length - 1]["Current Balance"]
        : openingBalance
    );

    totalOrders = roundMoney(totalOrders);
    totalCreditNotes = roundMoney(totalCreditNotes);
    totalDebitNotes = roundMoney(totalDebitNotes);
    totalPaymentPaid = roundMoney(totalPaymentPaid);
    totalPaymentReceived = roundMoney(totalPaymentReceived);
    totalManual = roundMoney(totalManual);

    const workbook = XLSX.utils.book_new();

    const summaryRows: Array<[string, any]> = [
      ["Report", "RailEats Restaurant Statement"],
      ["Generated At", formatIndiaDateTime(new Date())],
      ["Statement From", formatDate(fromDate)],
      ["Statement To", formatDate(toDate)],
      ["", ""],
      ["Restro Code", restro.RestroCode],
      ["Restro Name", restro.RestroName || ""],
      [
        "Station",
        [restro.StationCode, restro.StationName, restro.State]
          .filter(Boolean)
          .join(" - "),
      ],
      ["", ""],
      ["Opening Balance", openingBalance],
      ["Total Debit", totalDebit],
      ["Total Credit", totalCredit],
      ["Net Movement", netMovement],
      ["Closing Balance", closingBalance],
      ["", ""],
      ["Total Transactions", ledgerRows.length],
      ["Orders Count", orderCount],
      ["Orders Amount", totalOrders],
      ["Credit Notes Count", creditNoteCount],
      ["Credit Notes Amount", totalCreditNotes],
      ["Debit Notes Count", debitNoteCount],
      ["Debit Notes Amount", totalDebitNotes],
      ["Payment Paid Count", paymentPaidCount],
      ["Payment Paid Amount", totalPaymentPaid],
      ["Payment Received Count", paymentReceivedCount],
      ["Payment Received Amount", totalPaymentReceived],
      ["Manual Count", manualCount],
      ["Manual Net Amount", totalManual],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 44 }];

    for (const rowNumber of [10, 11, 12, 13, 14, 18, 20, 22, 24, 26, 28]) {
      const cell = summarySheet[`B${rowNumber}`];
      if (cell && typeof cell.v === "number") {
        cell.z = '₹#,##0.00;[Red]-₹#,##0.00';
      }
    }

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    const ledgerSheet = XLSX.utils.json_to_sheet(ledgerRows);
    ledgerSheet["!freeze"] = { xSplit: 0, ySplit: 1 } as any;
    ledgerSheet["!autofilter"] = {
      ref: ledgerSheet["!ref"] || "A1:A1",
    };
    ledgerSheet["!cols"] = [
      { wch: 11 },
      { wch: 22 },
      { wch: 20 },
      { wch: 34 },
      { wch: 26 },
      { wch: 16 },
      { wch: 16 },
      { wch: 36 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
    ];

    const ledgerRange = XLSX.utils.decode_range(ledgerSheet["!ref"] || "A1:A1");
    for (let rowIndex = 1; rowIndex <= ledgerRange.e.r; rowIndex += 1) {
      for (const columnIndex of [8, 9, 10, 11]) {
        const address = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
        const cell = ledgerSheet[address];
        if (cell && typeof cell.v === "number") {
          cell.z = '₹#,##0.00;[Red]-₹#,##0.00';
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, ledgerSheet, "Statement Ledger");

    const output = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      compression: true,
    });

    const restroNamePart = safeFileNamePart(restro.RestroName);
    const fileName =
      `RestroStatement-${restroCode}` +
      (restroNamePart ? `-${restroNamePart}` : "") +
      `-${fromDate}-to-${toDate}.xlsx`;

    return new NextResponse(output, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("RESTRO STATEMENT EXPORT ERROR =>", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to export restaurant statement",
      },
      { status: 500 }
    );
  }
}
