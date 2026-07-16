"use client";

// components/restro-route-tabs/StatementClient.tsx

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Props = {
  restroCode: string | number;
};

type RestroInfo = {
  RestroCode: number | string;
  RestroName: string | null;
  StationCode: string | null;
  StationName: string | null;
  State: string | null;
};

type StatementRow = {
  RDSId: number | string | null;
  RestroCode: number | string | null;
  OrderId: string | null;
  RestroName: string | null;
  StationCode: string | null;

  Status: string | null;
  SubStatus: string | null;
  Remarks: string | null;
  EntrySource: string | null;
  EntrySourceLabel?: string | null;
  Particular?: string | null;

  DeliveryDate: string | null;
  DeliveryTime: string | null;
  PaymentMode: string | null;
  CouponCode: string | null;

  SettlementAmount: number | string | null;
  Debit?: number | string | null;
  Credit?: number | string | null;
  PreviousBal: number | string | null;
  CurrentBal: number | string | null;

  CreatedAt: string | null;
  CreatedAtFormatted?: string | null;
};

type StatementSummary = {
  openingBalance: number;
  closingBalance: number;
  netMovement: number;

  totalDebit: number;
  totalCredit: number;

  totalTransactions: number;

  orderCount: number;
  creditNoteCount: number;
  debitNoteCount: number;
  paymentPaidCount: number;
  paymentReceivedCount: number;
  manualCount: number;

  totalOrders: number;
  totalCreditNotes: number;
  totalDebitNotes: number;
  totalPaymentPaid: number;
  totalPaymentReceived: number;
  totalManual: number;
};

type ApiResponse = {
  ok: boolean;

  period?: {
    from: string;
    to: string;
    fromUtc?: string;
    toUtc?: string;
  };

  restro?: RestroInfo;

  summary?: StatementSummary;

  rows?: StatementRow[];

  generatedAt?: string | null;

  error?: string;
};

const EMPTY_SUMMARY: StatementSummary = {
  openingBalance: 0,
  closingBalance: 0,
  netMovement: 0,

  totalDebit: 0,
  totalCredit: 0,

  totalTransactions: 0,

  orderCount: 0,
  creditNoteCount: 0,
  debitNoteCount: 0,
  paymentPaidCount: 0,
  paymentReceivedCount: 0,
  manualCount: 0,

  totalOrders: 0,
  totalCreditNotes: 0,
  totalDebitNotes: 0,
  totalPaymentPaid: 0,
  totalPaymentReceived: 0,
  totalManual: 0,
};

function getIndiaCurrentMonth() {
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

function textValue(
  value: unknown
) {
  return value === null ||
    value === undefined
    ? ""
    : String(value).trim();
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

function formatMoney(
  value: unknown
) {
  return numberValue(
    value
  ).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );
}

function formatDate(
  value: unknown
) {
  const text =
    textValue(value);

  if (!text) {
    return "-";
  }

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

function balanceClass(
  value: unknown
) {
  const amount =
    numberValue(value);

  if (
    amount > 0
  ) {
    return "text-emerald-700";
  }

  if (
    amount < 0
  ) {
    return "text-red-700";
  }

  return "text-slate-900";
}

function normalizeSource(
  value: unknown
) {
  return textValue(
    value
  )
    .toLowerCase()
    .replace(
      /[^a-z]/g,
      ""
    );
}

function entrySourceDetails(
  value: unknown
) {
  const source =
    normalizeSource(
      value
    );

  if (
    source === "order"
  ) {
    return {
      label:
        "Order",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (
    source ===
    "creditnote"
  ) {
    return {
      label:
        "Credit Note",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (
    source ===
    "debitnote"
  ) {
    return {
      label:
        "Debit Note",
      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (
    source ===
    "paymentpaid"
  ) {
    return {
      label:
        "Payment Paid",
      className:
        "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    };
  }

  if (
    source ===
    "paymentreceived"
  ) {
    return {
      label:
        "Payment Received",
      className:
        "border-cyan-200 bg-cyan-50 text-cyan-700",
    };
  }

  if (
    source ===
    "manual"
  ) {
    return {
      label:
        "Manual",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label:
      textValue(value) ||
      "-",
    className:
      "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function getReferenceUrl(
  row: StatementRow,
  restroCode: string
) {
  const reference =
    textValue(row.OrderId);

  const source =
    normalizeSource(
      row.EntrySource
    );

  if (!reference) {
    return null;
  }

  if (source === "order") {
    return `/admin/orders?orderId=${encodeURIComponent(
      reference
    )}`;
  }

  if (
    source === "creditnote" ||
    source === "debitnote"
  ) {
    return `/admin/restros/${encodeURIComponent(
      restroCode
    )}/edit/credit-debit-note?reference=${encodeURIComponent(
      reference
    )}`;
  }

  if (
    source === "paymentpaid" ||
    source === "paymentreceived"
  ) {
    const rdsId =
      textValue(row.RDSId);

    if (!rdsId) {
      return null;
    }

    return `/admin/restros/${encodeURIComponent(
      restroCode
    )}/edit/settlement?rdsId=${encodeURIComponent(
      rdsId
    )}`;
  }

  return null;
}

export default function StatementClient({
  restroCode,
}: Props) {
  const code =
    String(
      restroCode ?? ""
    ).trim();

  const currentMonth =
    useMemo(
      () =>
        getIndiaCurrentMonth(),
      []
    );

  const [
    fromInput,
    setFromInput,
  ] =
    useState(
      currentMonth.from
    );

  const [
    toInput,
    setToInput,
  ] =
    useState(
      currentMonth.to
    );

  const [
    appliedFrom,
    setAppliedFrom,
  ] =
    useState(
      currentMonth.from
    );

  const [
    appliedTo,
    setAppliedTo,
  ] =
    useState(
      currentMonth.to
    );

  const [
    restro,
    setRestro,
  ] =
    useState<RestroInfo | null>(
      null
    );

  const [
    summary,
    setSummary,
  ] =
    useState<StatementSummary>(
      EMPTY_SUMMARY
    );

  const [
    rows,
    setRows,
  ] =
    useState<StatementRow[]>(
      []
    );

  const [
    generatedAt,
    setGeneratedAt,
  ] =
    useState<string | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    exporting,
    setExporting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const loadStatement =
    useCallback(
      async (
        from:
          string,
        to:
          string
      ) => {
        if (!code) {
          setError(
            "Invalid RestroCode"
          );
          return;
        }

        setLoading(
          true
        );
        setError(
          null
        );

        try {
          const params =
            new URLSearchParams();

          params.set(
            "from",
            from
          );

          params.set(
            "to",
            to
          );

          const response =
            await fetch(
              `/api/restros/${encodeURIComponent(
                code
              )}/statement?${params.toString()}`,
              {
                method:
                  "GET",
                cache:
                  "no-store",
              }
            );

          const json:
            ApiResponse =
            await response
              .json();

          if (
            !response.ok ||
            !json.ok
          ) {
            throw new Error(
              json.error ||
              "Unable to load statement"
            );
          }

          setRestro(
            json.restro ??
            null
          );

          setSummary(
            json.summary ??
            EMPTY_SUMMARY
          );

          setRows(
            Array.isArray(
              json.rows
            )
              ? json.rows
              : []
          );

          setGeneratedAt(
            json.generatedAt ??
            null
          );

          setAppliedFrom(
            json.period
              ?.from ??
            from
          );

          setAppliedTo(
            json.period
              ?.to ??
            to
          );
        } catch (
          loadError: any
        ) {
          setRestro(
            null
          );

          setSummary(
            EMPTY_SUMMARY
          );

          setRows(
            []
          );

          setGeneratedAt(
            null
          );

          setError(
            loadError
              ?.message ||
            "Unable to load statement"
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        code,
      ]
    );

  useEffect(() => {
    loadStatement(
      currentMonth.from,
      currentMonth.to
    );
  }, [
    currentMonth.from,
    currentMonth.to,
    loadStatement,
  ]);

  function handleSearch(
    event:
      FormEvent
  ) {
    event.preventDefault();

    if (
      !fromInput ||
      !toInput
    ) {
      setError(
        "From Date and To Date are required"
      );
      return;
    }

    if (
      fromInput >
      toInput
    ) {
      setError(
        "From Date, To Date se badi nahi ho sakti"
      );
      return;
    }

    loadStatement(
      fromInput,
      toInput
    );
  }

  function handleCurrentMonth() {
    setFromInput(
      currentMonth.from
    );

    setToInput(
      currentMonth.to
    );

    loadStatement(
      currentMonth.from,
      currentMonth.to
    );
  }

  function handlePrint() {
    window.print();
  }

  async function handleExportExcel() {
    if (
      exporting ||
      loading
    ) {
      return;
    }

    setExporting(
      true
    );
    setError(
      null
    );

    try {
      const params =
        new URLSearchParams();

      params.set(
        "from",
        appliedFrom
      );

      params.set(
        "to",
        appliedTo
      );

      const response =
        await fetch(
          `/api/restros/${encodeURIComponent(
            code
          )}/statement/export?${params.toString()}`,
          {
            method:
              "GET",
            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        let message =
          "Unable to export statement";

        try {
          const json =
            await response
              .json();

          message =
            json?.error ||
            message;
        } catch {
          // Keep default error.
        }

        throw new Error(
          message
        );
      }

      const blob =
        await response
          .blob();

      const disposition =
        response.headers
          .get(
            "content-disposition"
          ) ||
        "";

      const fileMatch =
        disposition.match(
          /filename="?([^"]+)"?/i
        );

      const fileName =
        fileMatch
          ? fileMatch[1]
          : `Restro-Statement-${code}.xlsx`;

      const objectUrl =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        objectUrl;

      anchor.download =
        fileName;

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        objectUrl
      );
    } catch (
      exportError: any
    ) {
      setError(
        exportError
          ?.message ||
        "Unable to export statement"
      );
    } finally {
      setExporting(
        false
      );
    }
  }

  const sortedRows =
    useMemo(
      () =>
        [...rows].sort(
          (a, b) => {
            const timeA =
              a.CreatedAt
                ? new Date(
                    a.CreatedAt
                  ).getTime()
                : 0;

            const timeB =
              b.CreatedAt
                ? new Date(
                    b.CreatedAt
                  ).getTime()
                : 0;

            if (
              timeA !==
              timeB
            ) {
              return (
                timeB -
                timeA
              );
            }

            return (
              numberValue(
                b.RDSId
              ) -
              numberValue(
                a.RDSId
              )
            );
          }
        ),
      [
        rows,
      ]
    );

  return (
    <div className="statement-page space-y-5">
      <div className="no-print rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <form
            onSubmit={
              handleSearch
            }
            className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl"
          >
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                From Date
              </label>

              <input
                type="date"
                value={
                  fromInput
                }
                onChange={(
                  event
                ) =>
                  setFromInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                To Date
              </label>

              <input
                type="date"
                value={
                  toInput
                }
                onChange={(
                  event
                ) =>
                  setToInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={
                  handleCurrentMonth
                }
                disabled={
                  loading
                }
                className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Current Month
              </button>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : "Load Statement"}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                handleExportExcel
              }
              disabled={
                loading ||
                exporting
              }
              className="h-10 rounded-lg border border-emerald-300 bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {exporting
                ? "Exporting..."
                : "Export Excel"}
            </button>

            <button
              type="button"
              onClick={
                handlePrint
              }
              disabled={
                loading
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="no-print rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl bg-white p-5 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950">
                Restaurant Statement
              </h1>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                RailEats Restaurant Running Due Statement
              </p>
            </div>

            <div className="text-left md:text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Statement Period
              </div>

              <div className="mt-1 text-sm font-extrabold text-slate-900">
                {formatDate(
                  appliedFrom
                )}{" "}
                to{" "}
                {formatDate(
                  appliedTo
                )}
              </div>

              <div className="mt-1 text-xs font-medium text-slate-500">
                Generated:{" "}
                {generatedAt ||
                  "-"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Restaurant
          </div>

          <div className="mt-2 text-lg font-extrabold text-slate-950">
            {restro
              ?.RestroCode ??
              code}
            {restro
              ?.RestroName
              ? ` / ${restro.RestroName}`
              : ""}
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-600">
            {[
              restro
                ?.StationCode,
              restro
                ?.StationName,
              restro
                ?.State,
            ]
              .filter(
                Boolean
              )
              .join(
                " - "
              ) ||
              "-"}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Opening Balance
            </div>

            <div
              className={[
                "mt-1 text-lg font-extrabold",
                balanceClass(
                  summary.openingBalance
                ),
              ].join(" ")}
            >
              ₹{formatMoney(
                summary.openingBalance
              )}
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-red-600">
              Total Debit
            </div>

            <div className="mt-1 text-lg font-extrabold text-red-700">
              ₹{formatMoney(
                summary.totalDebit
              )}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              Total Credit
            </div>

            <div className="mt-1 text-lg font-extrabold text-emerald-700">
              ₹{formatMoney(
                summary.totalCredit
              )}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
              Closing Balance
            </div>

            <div
              className={[
                "mt-1 text-lg font-extrabold",
                balanceClass(
                  summary.closingBalance
                ),
              ].join(" ")}
            >
              ₹{formatMoney(
                summary.closingBalance
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-600">
              Orders
            </div>

            <div className="mt-1 text-lg font-extrabold text-blue-700">
              {summary.orderCount}
            </div>

            <div className="text-xs font-medium text-slate-500">
              ₹{formatMoney(
                summary.totalOrders
              )}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-xs font-semibold text-emerald-600">
              Credit Notes
            </div>

            <div className="mt-1 text-lg font-extrabold text-emerald-700">
              {summary.creditNoteCount}
            </div>

            <div className="text-xs font-medium text-slate-500">
              ₹{formatMoney(
                summary.totalCreditNotes
              )}
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="text-xs font-semibold text-red-600">
              Debit Notes
            </div>

            <div className="mt-1 text-lg font-extrabold text-red-700">
              {summary.debitNoteCount}
            </div>

            <div className="text-xs font-medium text-slate-500">
              ₹{formatMoney(
                summary.totalDebitNotes
              )}
            </div>
          </div>

          <div className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3">
            <div className="text-xs font-semibold text-fuchsia-600">
              Payment Paid
            </div>

            <div className="mt-1 text-lg font-extrabold text-fuchsia-700">
              {summary.paymentPaidCount}
            </div>

            <div className="text-xs font-medium text-slate-500">
              ₹{formatMoney(
                summary.totalPaymentPaid
              )}
            </div>
          </div>

          <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
            <div className="text-xs font-semibold text-cyan-700">
              Payment Received
            </div>

            <div className="mt-1 text-lg font-extrabold text-cyan-700">
              {summary.paymentReceivedCount}
            </div>

            <div className="text-xs font-medium text-slate-500">
              ₹{formatMoney(
                summary.totalPaymentReceived
              )}
            </div>
          </div>

          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
            <div className="text-xs font-semibold text-violet-600">
              Net Movement
            </div>

            <div
              className={[
                "mt-1 text-lg font-extrabold",
                balanceClass(
                  summary.netMovement
                ),
              ].join(" ")}
            >
              ₹{formatMoney(
                summary.netMovement
              )}
            </div>

            <div className="text-xs font-medium text-slate-500">
              {summary.totalTransactions} entries
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-[1050px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left text-xs font-bold text-slate-700">
                <th className="border-b border-r px-3 py-3">
                  Date &amp; Time
                </th>

                <th className="border-b border-r px-3 py-3">
                  Entry
                </th>

                <th className="border-b border-r px-3 py-3">
                  Particular
                </th>

                <th className="border-b border-r px-3 py-3">
                  Reference
                </th>

                <th className="border-b border-r px-3 py-3">
                  Payment
                </th>

                <th className="border-b border-r px-3 py-3">
                  Remarks
                </th>

                <th className="border-b border-r px-3 py-3 text-right">
                  Debit
                </th>

                <th className="border-b border-r px-3 py-3 text-right">
                  Credit
                </th>

                <th className="border-b px-3 py-3 text-right">
                  Balance
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm font-semibold text-slate-500"
                  >
                    Loading statement...
                  </td>
                </tr>
              ) : sortedRows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-sm font-semibold text-slate-400"
                  >
                    No statement records found
                  </td>
                </tr>
              ) : (
                sortedRows.map(
                  (
                    row,
                    index
                  ) => {
                    const entry =
                      entrySourceDetails(
                        row.EntrySource
                      );

                    const referenceUrl =
                      getReferenceUrl(
                        row,
                        code
                      );

                    return (
                      <tr
                        key={`${row.RDSId}-${row.OrderId}-${index}`}
                        className={
                          index % 2 ===
                          0
                            ? "bg-white"
                            : "bg-slate-50"
                        }
                      >
                        <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                          {row.CreatedAtFormatted ||
                            row.CreatedAt ||
                            "-"}
                        </td>

                        <td className="border-b border-r px-3 py-3">
                          <span
                            className={[
                              "inline-flex rounded border px-2 py-1 text-xs font-bold",
                              entry.className,
                            ].join(" ")}
                          >
                            {entry.label}
                          </span>
                        </td>

                        <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                          {row.Particular ||
                            row.EntrySourceLabel ||
                            "-"}
                        </td>

                        <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                          {referenceUrl ? (
                            <a
                              href={referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                              title="Open entry details"
                            >
                              {row.OrderId || "-"}
                            </a>
                          ) : (
                            row.OrderId || "-"
                          )}
                        </td>

                        <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                          {row.PaymentMode ||
                            "-"}
                        </td>

                        <td
                          title={row.Remarks || "-"}
                          className="max-w-[240px] border-b border-r px-3 py-3 text-xs font-semibold text-slate-700"
                        >
                          <span className="block truncate">
                            {row.Remarks || "-"}
                          </span>
                        </td>

                        <td className="border-b border-r px-3 py-3 text-right text-xs font-extrabold text-red-700">
                          {numberValue(
                            row.Debit
                          ) >
                          0
                            ? `₹${formatMoney(
                                row.Debit
                              )}`
                            : "-"}
                        </td>

                        <td className="border-b border-r px-3 py-3 text-right text-xs font-extrabold text-emerald-700">
                          {numberValue(
                            row.Credit
                          ) >
                          0
                            ? `₹${formatMoney(
                                row.Credit
                              )}`
                            : "-"}
                        </td>

                        <td
                          className={[
                            "border-b px-3 py-3 text-right text-xs font-extrabold",
                            balanceClass(
                              row.CurrentBal
                            ),
                          ].join(" ")}
                        >
                          ₹{formatMoney(
                            row.CurrentBal
                          )}
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>

            <tfoot>
              <tr className="bg-slate-100">
                <td
                  colSpan={6}
                  className="border-t border-r px-3 py-3 text-right text-sm font-extrabold text-slate-900"
                >
                  Totals
                </td>

                <td className="border-t border-r px-3 py-3 text-right text-sm font-extrabold text-red-700">
                  ₹{formatMoney(
                    summary.totalDebit
                  )}
                </td>

                <td className="border-t border-r px-3 py-3 text-right text-sm font-extrabold text-emerald-700">
                  ₹{formatMoney(
                    summary.totalCredit
                  )}
                </td>

                <td
                  className={[
                    "border-t px-3 py-3 text-right text-sm font-extrabold",
                    balanceClass(
                      summary.closingBalance
                    ),
                  ].join(" ")}
                >
                  ₹{formatMoney(
                    summary.closingBalance
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .statement-page {
            padding: 0 !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
