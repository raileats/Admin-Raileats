// components/admin/ReRdsTable.tsx
"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type ReRdsRow = {
  RERDSId: number | string | null;
  RestroRDSId: number | string | null;
  OrderId: string | null;
  EntrySource: string | null;
  RestroCode: number | string | null;
  RestroName: string | null;
  StationCode: string | null;
  Status: string | null;
  SubStatus: string | null;
  Remarks: string | null;
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
  RestroSettlementAmount: number | string | null;
  RESettlementAmount: number | string | null;
  PreviousBal: number | string | null;
  CurrentBal: number | string | null;
  CreatedAt: string | null;
};

type SelectedRestro = {
  RestroCode: number | string;
  RestroName: string;
  StationCode: string;
  StationName: string;
};

type TodaySummary = {
  receivable: number;
  payable: number;
  netMovement: number;
  creditNote: number;
  debitNote: number;
  orderCount: number;
};

type Summary = {
  universalBalance: number;
  totalReceivable: number;
  totalPayable: number;
  netMovement: number;
  totalEntries: number;
  orderCount: number;
  creditNoteCount: number;
  debitNoteCount: number;
  manualCount: number;
  openingBalance: number;
  closingBalance: number;
  transactionCount: number;
  lastEntryAt: string | null;
  today: TodaySummary;
};

type ApiResponse = {
  ok: boolean;
  rows?: ReRdsRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  selectedRestro?: SelectedRestro | null;
  summary?: Summary;
  error?: string;
};

type PageSize = 20 | 50 | 100 | 500;

type AppliedFilters = {
  restroCode: string;
  orderId: string;
  entrySource: string;
  paymentMode: string;
  status: string;
  from: string;
  to: string;
};

const EMPTY_SUMMARY: Summary = {
  universalBalance: 0,
  totalReceivable: 0,
  totalPayable: 0,
  netMovement: 0,
  totalEntries: 0,
  orderCount: 0,
  creditNoteCount: 0,
  debitNoteCount: 0,
  manualCount: 0,
  openingBalance: 0,
  closingBalance: 0,
  transactionCount: 0,
  lastEntryAt: null,
  today: {
    receivable: 0,
    payable: 0,
    netMovement: 0,
    creditNote: 0,
    debitNote: 0,
    orderCount: 0,
  },
};

const COLUMNS: {
  key: keyof ReRdsRow;
  title: string;
  type?:
    | "money"
    | "balance"
    | "reSettlement"
    | "restroSettlement";
  width: string;
  align?:
    | "left"
    | "center"
    | "right";
}[] = [
  { key: "RERDSId", title: "RE RDS Id", width: "3.1%", align: "center" },
  { key: "RestroRDSId", title: "Restro RDS Id", width: "3.3%", align: "center" },
  { key: "OrderId", title: "Order / Ref.", width: "6%" },
  { key: "EntrySource", title: "Entry Source", width: "4.4%", align: "center" },
  { key: "RestroCode", title: "Restro Code", width: "3.7%", align: "center" },
  { key: "RestroName", title: "Restro Name", width: "5.5%" },
  { key: "StationCode", title: "Station", width: "3%", align: "center" },
  { key: "Status", title: "Status", width: "3.8%" },
  { key: "SubStatus", title: "Sub Status", width: "4%" },
  { key: "PaymentMode", title: "Payment", width: "3.3%", align: "center" },
  { key: "CouponCode", title: "Coupon", width: "3.5%", align: "center" },
  { key: "BasePrice", title: "Base Price", type: "money", width: "3.4%", align: "right" },
  { key: "DiscountedBasePrice", title: "Discounted Base", type: "money", width: "3.9%", align: "right" },
  { key: "Commission", title: "Commission", type: "money", width: "3.3%", align: "right" },
  { key: "GSTAmount", title: "GST", type: "money", width: "2.7%", align: "right" },
  { key: "PlatformCharge", title: "Platform", type: "money", width: "3.1%", align: "right" },
  { key: "RestroDiscount", title: "Restro Disc.", type: "money", width: "3.4%", align: "right" },
  { key: "REDiscount", title: "RE Disc.", type: "money", width: "3%", align: "right" },
  { key: "TotalAmount", title: "Total", type: "money", width: "3.2%", align: "right" },
  { key: "CODAmount", title: "COD", type: "money", width: "2.9%", align: "right" },
  { key: "PPDAmount", title: "PPD", type: "money", width: "2.9%", align: "right" },
  { key: "OrderPenalty", title: "Penalty", type: "money", width: "2.9%", align: "right" },
  { key: "IGST", title: "IGST", type: "money", width: "2.6%", align: "right" },
  { key: "OrderCharges", title: "Order Charges", type: "money", width: "3.4%", align: "right" },
  { key: "RestroSettlementAmount", title: "Restro Settle.", type: "restroSettlement", width: "3.7%", align: "right" },
  { key: "RESettlementAmount", title: "RE Settle.", type: "reSettlement", width: "3.7%", align: "right" },
  { key: "PreviousBal", title: "Previous Bal.", type: "money", width: "3.7%", align: "right" },
  { key: "CurrentBal", title: "Current Bal.", type: "balance", width: "3.9%", align: "right" },
  { key: "CreatedAt", title: "Created At", width: "4.2%", align: "center" },
];

function textValue(value: unknown) {
  return value === null ||
    value === undefined
    ? ""
    : String(value).trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatMoney(value: unknown) {
  return numberValue(value)
    .toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
}

function inputDateTimeToDisplay(
  value: string
) {
  if (!value) return "";

  const [
    datePart,
    timePart,
  ] =
    value.split("T");

  const [
    year,
    month,
    day,
  ] =
    (datePart || "")
      .split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return (
    `${day}-${month}-${year}` +
    (
      timePart
        ? ` ${timePart}`
        : ""
    )
  );
}

function alignClass(
  align?:
    | "left"
    | "center"
    | "right"
) {
  if (align === "right") {
    return "text-right";
  }

  if (align === "center") {
    return "text-center";
  }

  return "text-left";
}

function entrySourceDetails(
  value: unknown
) {
  const source =
    textValue(value) ||
    "-";

  const normalized =
    source
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        ""
      );

  if (
    normalized === "order"
  ) {
    return {
      label: "Order",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
    };
  }

  if (
    normalized ===
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
    normalized ===
    "debitnote"
  ) {
    return {
      label:
        "Debit Note",
      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    label: source,
    className:
      "border-slate-200 bg-slate-50 text-slate-700",
  };
}

function statusClass(
  value: unknown
) {
  const status =
    textValue(value)
      .toLowerCase();

  if (
    status === "delivered"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (
    status.includes(
      "cancel"
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (
    status.includes(
      "notdelivered"
    ) ||
    status.includes(
      "not delivered"
    )
  ) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function paymentModeClass(
  value: unknown
) {
  const mode =
    textValue(value)
      .toUpperCase();

  if (
    [
      "PPD",
      "PREPAID",
      "ONLINE",
    ].includes(mode)
  ) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (
    !mode ||
    mode === "-"
  ) {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function summaryValueClass(
  value: number
) {
  if (value > 0) {
    return "text-emerald-700";
  }

  if (value < 0) {
    return "text-red-700";
  }

  return "text-slate-900";
}

function DetailItem({
  label,
  value,
  money = false,
  highlight = false,
}: {
  label: string;
  value: unknown;
  money?: boolean;
  highlight?: boolean;
}) {
  const number =
    numberValue(value);

  return (
    <div
      className={[
        "rounded-lg border border-slate-200 bg-white p-3",
        highlight
          ? "ring-1 ring-blue-100"
          : "",
      ].join(" ")}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div
        className={[
          "mt-1 break-words text-sm font-bold",
          money
            ? (
                number > 0
                  ? "text-emerald-700"
                  : number < 0
                  ? "text-red-700"
                  : "text-slate-900"
              )
            : "text-slate-900",
        ].join(" ")}
      >
        {money
          ? `₹${formatMoney(value)}`
          : textValue(value) ||
            "-"}
      </div>
    </div>
  );
}

export default function ReRdsTable() {
  const [
    rows,
    setRows,
  ] =
    useState<ReRdsRow[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedRow,
    setSelectedRow,
  ] =
    useState<
      ReRdsRow | null
    >(null);

  const [
    page,
    setPage,
  ] =
    useState(1);

  const [
    pageSize,
    setPageSize,
  ] =
    useState<PageSize>(20);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    totalPages,
    setTotalPages,
  ] =
    useState(1);

  const [
    summary,
    setSummary,
  ] =
    useState<Summary>(
      EMPTY_SUMMARY
    );

  const [
    selectedRestro,
    setSelectedRestro,
  ] =
    useState<
      SelectedRestro | null
    >(null);

  const [
    restroCodeInput,
    setRestroCodeInput,
  ] =
    useState("");

  const [
    orderIdInput,
    setOrderIdInput,
  ] =
    useState("");

  const [
    entrySourceInput,
    setEntrySourceInput,
  ] =
    useState("");

  const [
    paymentModeInput,
    setPaymentModeInput,
  ] =
    useState("");

  const [
    statusInput,
    setStatusInput,
  ] =
    useState("");

  const [
    fromDateTimeInput,
    setFromDateTimeInput,
  ] =
    useState("");

  const [
    toDateTimeInput,
    setToDateTimeInput,
  ] =
    useState("");

  const [
    appliedFilters,
    setAppliedFilters,
  ] =
    useState<AppliedFilters>({
      restroCode: "",
      orderId: "",
      entrySource: "",
      paymentMode: "",
      status: "",
      from: "",
      to: "",
    });

  const fetchRows =
    useCallback(
      async (
        requestedPage:
          number,
        requestedPageSize:
          PageSize,
        filters:
          AppliedFilters
      ) => {
        setLoading(true);
        setError(null);

        try {
          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(
              requestedPage
            )
          );

          params.set(
            "pageSize",
            String(
              requestedPageSize
            )
          );

          Object.entries(
            filters
          ).forEach(
            ([
              key,
              value,
            ]) => {
              if (value) {
                params.set(
                  key,
                  value
                );
              }
            }
          );

          const response =
            await fetch(
              `/api/admin/re-rds?${params.toString()}`,
              {
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
              "Unable to load RE RDS"
            );
          }

          const nextPages =
            Math.max(
              1,
              Number(
                json.totalPages ??
                1
              )
            );

          setRows(
            Array.isArray(
              json.rows
            )
              ? json.rows
              : []
          );

          setTotal(
            Number(
              json.total ??
              0
            )
          );

          setPage(
            Math.min(
              Number(
                json.page ??
                requestedPage
              ),
              nextPages
            )
          );

          setTotalPages(
            nextPages
          );

          setSelectedRestro(
            json.selectedRestro ??
            null
          );

          setSummary(
            json.summary ??
            EMPTY_SUMMARY
          );
        } catch (
          fetchError: any
        ) {
          setRows([]);
          setTotal(0);
          setTotalPages(1);
          setSelectedRestro(
            null
          );
          setSummary(
            EMPTY_SUMMARY
          );
          setError(
            fetchError
              ?.message ||
            "Unable to load RE RDS"
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    fetchRows(
      1,
      20,
      appliedFilters
    );
    // Initial default load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRows]);

  useEffect(() => {
    if (!selectedRow) {
      return;
    }

    const handleKeyDown =
      (
        event:
          KeyboardEvent
      ) => {
        if (
          event.key ===
          "Escape"
        ) {
          setSelectedRow(
            null
          );
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedRow]);

  function handleSearch(
    event:
      FormEvent
  ) {
    event.preventDefault();

    const nextFilters:
      AppliedFilters = {
        restroCode:
          restroCodeInput
            .replace(
              /\D/g,
              ""
            )
            .trim(),
        orderId:
          orderIdInput
            .trim(),
        entrySource:
          entrySourceInput,
        paymentMode:
          paymentModeInput,
        status:
          statusInput,
        from:
          fromDateTimeInput,
        to:
          toDateTimeInput,
      };

    if (
      nextFilters.from &&
      nextFilters.to &&
      nextFilters.from >
        nextFilters.to
    ) {
      setError(
        "From Date-Time, To Date-Time se bada nahi ho sakta."
      );
      return;
    }

    setAppliedFilters(
      nextFilters
    );

    setPage(1);

    fetchRows(
      1,
      pageSize,
      nextFilters
    );
  }

  function handleClear() {
    const cleared:
      AppliedFilters = {
        restroCode: "",
        orderId: "",
        entrySource: "",
        paymentMode: "",
        status: "",
        from: "",
        to: "",
      };

    setRestroCodeInput("");
    setOrderIdInput("");
    setEntrySourceInput("");
    setPaymentModeInput("");
    setStatusInput("");
    setFromDateTimeInput("");
    setToDateTimeInput("");
    setAppliedFilters(
      cleared
    );
    setSelectedRestro(
      null
    );
    setError(null);
    setPage(1);

    fetchRows(
      1,
      pageSize,
      cleared
    );
  }

  function handlePageSizeChange(
    value: string
  ) {
    const parsed =
      Number(value) as
      PageSize;

    const nextSize:
      PageSize =
      [
        20,
        50,
        100,
        500,
      ].includes(parsed)
        ? parsed
        : 20;

    setPageSize(
      nextSize
    );

    setPage(1);

    fetchRows(
      1,
      nextSize,
      appliedFilters
    );
  }

  function goToPage(
    nextPage:
      number
  ) {
    if (
      loading ||
      nextPage < 1 ||
      nextPage >
        totalPages ||
      nextPage === page
    ) {
      return;
    }

    setPage(nextPage);

    fetchRows(
      nextPage,
      pageSize,
      appliedFilters
    );
  }

  const firstVisibleRecord =
    total === 0
      ? 0
      : (
          page - 1
        ) *
          pageSize +
        1;

  const lastVisibleRecord =
    Math.min(
      page *
        pageSize,
      total
    );

  const filterDescription =
    useMemo(() => {
      const parts:
        string[] = [];

      if (
        appliedFilters
          .restroCode
      ) {
        parts.push(
          `Restro ${appliedFilters.restroCode}`
        );
      }

      if (
        appliedFilters
          .orderId
      ) {
        parts.push(
          `Order ${appliedFilters.orderId}`
        );
      }

      if (
        appliedFilters
          .entrySource
      ) {
        parts.push(
          `Entry ${appliedFilters.entrySource}`
        );
      }

      if (
        appliedFilters
          .paymentMode
      ) {
        parts.push(
          `Payment ${appliedFilters.paymentMode}`
        );
      }

      if (
        appliedFilters
          .status
      ) {
        parts.push(
          `Status ${appliedFilters.status}`
        );
      }

      if (
        appliedFilters
          .from
      ) {
        parts.push(
          `From ${inputDateTimeToDisplay(appliedFilters.from)}`
        );
      }

      if (
        appliedFilters
          .to
      ) {
        parts.push(
          `To ${inputDateTimeToDisplay(appliedFilters.to)}`
        );
      }

      return parts.join(
        " • "
      );
    }, [
      appliedFilters,
    ]);

  function renderCell(
    row:
      ReRdsRow,
    column:
      (typeof COLUMNS)[number]
  ) {
    const value =
      row[column.key];

    if (
      column.key ===
      "EntrySource"
    ) {
      const details =
        entrySourceDetails(
          value
        );

      return (
        <span
          title={
            details.label
          }
          className={[
            "inline-flex max-w-full rounded border px-1 py-0.5 font-semibold",
            details.className,
          ].join(" ")}
        >
          <span className="truncate">
            {details.label}
          </span>
        </span>
      );
    }

    if (
      column.key ===
      "Status"
    ) {
      const status =
        textValue(value) ||
        "-";

      return (
        <span
          title={status}
          className={[
            "inline-flex max-w-full rounded border px-1 py-0.5 font-semibold",
            statusClass(
              status
            ),
          ].join(" ")}
        >
          <span className="truncate">
            {status}
          </span>
        </span>
      );
    }

    if (
      column.key ===
      "PaymentMode"
    ) {
      const mode =
        textValue(value) ||
        "-";

      return (
        <span
          className={[
            "inline-flex rounded border px-1 py-0.5 font-bold",
            paymentModeClass(
              mode
            ),
          ].join(" ")}
        >
          {mode}
        </span>
      );
    }

    if (
      column.key ===
      "CouponCode"
    ) {
      const code =
        textValue(value) ||
        "-";

      return (
        <span
          title={code}
          className="inline-flex max-w-full rounded border border-amber-200 bg-amber-50 px-1 py-0.5 font-semibold text-amber-700"
        >
          <span className="truncate">
            {code}
          </span>
        </span>
      );
    }

    if (
      column.type ===
      "balance"
    ) {
      const amount =
        numberValue(value);

      return (
        <span
          className={[
            "block text-[11px] font-extrabold",
            summaryValueClass(
              amount
            ),
          ].join(" ")}
        >
          {formatMoney(
            amount
          )}
        </span>
      );
    }

    if (
      column.type ===
      "reSettlement" ||
      column.type ===
      "restroSettlement"
    ) {
      const amount =
        numberValue(value);

      const label =
        column.type ===
        "reSettlement"
          ? (
              amount > 0
                ? "Receivable"
                : amount < 0
                ? "Payable"
                : "Zero"
            )
          : (
              amount > 0
                ? "Credit"
                : amount < 0
                ? "Debit"
                : "Zero"
            );

      return (
        <span
          title={label}
          className={[
            "inline-flex rounded border px-1 py-0.5 font-extrabold",
            amount > 0
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : amount < 0
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-slate-50 text-slate-700",
          ].join(" ")}
        >
          {formatMoney(
            amount
          )}
        </span>
      );
    }

    if (
      column.type ===
      "money"
    ) {
      const amount =
        numberValue(value);

      return (
        <span
          className={
            amount < 0
              ? "font-semibold text-red-700"
              : ""
          }
        >
          {formatMoney(
            amount
          )}
        </span>
      );
    }

    const text =
      textValue(value);

    return (
      <span
        className="block break-words leading-tight"
        title={
          column.key ===
            "OrderId"
            ? [
                text ||
                  "-",
                row.Remarks
                  ? `Remarks: ${row.Remarks}`
                  : "",
                row.CouponCode
                  ? `Coupon: ${row.CouponCode}`
                  : "",
                row.EntrySource
                  ? `Entry: ${row.EntrySource}`
                  : "",
                row.CreatedAt
                  ? `Created: ${row.CreatedAt}`
                  : "",
              ]
                .filter(
                  Boolean
                )
                .join(" | ")
            : text
        }
      >
        {text || "-"}
      </span>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              RE RDS Management
            </h3>

            <p className="mt-1 text-xs font-medium text-slate-500">
              RailEats All-India universal company ledger. Kisi row par click karke full details dekhein.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="re-rds-page-size"
              className="text-sm font-medium text-slate-600"
            >
              Rows
            </label>

            <select
              id="re-rds-page-size"
              value={pageSize}
              onChange={(
                event
              ) =>
                handlePageSizeChange(
                  event.target.value
                )
              }
              disabled={
                loading
              }
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"
            >
              <option value={20}>
                20
              </option>
              <option value={50}>
                50
              </option>
              <option value={100}>
                100
              </option>
              <option value={500}>
                500
              </option>
            </select>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Universal Balance
            </div>

            <div
              className={[
                "mt-1 text-2xl font-extrabold",
                summaryValueClass(
                  summary.universalBalance
                ),
              ].join(" ")}
            >
              ₹
              {formatMoney(
                summary.universalBalance
              )}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Last entry:{" "}
              {summary.lastEntryAt ||
                "-"}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Today Receivable
            </div>

            <div className="mt-1 text-xl font-extrabold text-emerald-700">
              ₹
              {formatMoney(
                summary.today.receivable
              )}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Total: ₹
              {formatMoney(
                summary.totalReceivable
              )}
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-red-700">
              Today Payable
            </div>

            <div className="mt-1 text-xl font-extrabold text-red-700">
              ₹
              {formatMoney(
                summary.today.payable
              )}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Total: ₹
              {formatMoney(
                summary.totalPayable
              )}
            </div>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-violet-700">
              Today Net Movement
            </div>

            <div
              className={[
                "mt-1 text-xl font-extrabold",
                summaryValueClass(
                  summary.today.netMovement
                ),
              ].join(" ")}
            >
              ₹
              {formatMoney(
                summary.today.netMovement
              )}
            </div>

            <div className="mt-1 text-xs text-slate-500">
              Filtered: ₹
              {formatMoney(
                summary.netMovement
              )}
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Opening Balance
            </div>

            <div
              className={[
                "mt-1 text-xl font-extrabold",
                summaryValueClass(
                  summary.openingBalance
                ),
              ].join(" ")}
            >
              ₹
              {formatMoney(
                summary.openingBalance
              )}
            </div>
          </div>

          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-indigo-600">
              Transactions
            </div>

            <div className="mt-1 text-xl font-extrabold text-indigo-700">
              {summary.transactionCount}
            </div>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-violet-600">
              Net Movement
            </div>

            <div
              className={[
                "mt-1 text-xl font-extrabold",
                summaryValueClass(
                  summary.netMovement
                ),
              ].join(" ")}
            >
              ₹
              {formatMoney(
                summary.netMovement
              )}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Closing Balance
            </div>

            <div
              className={[
                "mt-1 text-xl font-extrabold",
                summaryValueClass(
                  summary.closingBalance
                ),
              ].join(" ")}
            >
              ₹
              {formatMoney(
                summary.closingBalance
              )}
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[
            [
              "Total Entries",
              summary.totalEntries,
              "border-slate-200 bg-slate-50 text-slate-900",
            ],
            [
              "Orders",
              summary.orderCount,
              "border-blue-200 bg-blue-50 text-blue-700",
            ],
            [
              "Credit Notes",
              summary.creditNoteCount,
              "border-emerald-200 bg-emerald-50 text-emerald-700",
            ],
            [
              "Debit Notes",
              summary.debitNoteCount,
              "border-red-200 bg-red-50 text-red-700",
            ],
            [
              "Today Credit",
              `₹${formatMoney(summary.today.creditNote)}`,
              "border-amber-200 bg-amber-50 text-amber-700",
            ],
            [
              "Today Debit",
              `₹${formatMoney(summary.today.debitNote)}`,
              "border-cyan-200 bg-cyan-50 text-cyan-700",
            ],
          ].map(
            ([
              label,
              value,
              classes,
            ]) => (
              <div
                key={String(
                  label
                )}
                className={[
                  "rounded-lg border p-3",
                  String(
                    classes
                  ),
                ].join(" ")}
              >
                <div className="text-xs font-semibold">
                  {label}
                </div>

                <div className="mt-1 text-lg font-extrabold">
                  {value}
                </div>
              </div>
            )
          )}
        </div>

        <form
          onSubmit={
            handleSearch
          }
          className="mb-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Restro Code
              </label>

              <input
                value={
                  restroCodeInput
                }
                onChange={(
                  event
                ) =>
                  setRestroCodeInput(
                    event.target.value.replace(
                      /\D/g,
                      ""
                    )
                  )
                }
                className="search-pill-sm w-full"
                placeholder="1032"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Order / Reference ID
              </label>

              <input
                value={
                  orderIdInput
                }
                onChange={(
                  event
                ) =>
                  setOrderIdInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
                placeholder="RE-20260716..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Entry Source
              </label>

              <select
                value={
                  entrySourceInput
                }
                onChange={(
                  event
                ) =>
                  setEntrySourceInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              >
                <option value="">
                  All Entries
                </option>
                <option value="Order">
                  Order
                </option>
                <option value="CreditNote">
                  Credit Note
                </option>
                <option value="DebitNote">
                  Debit Note
                </option>
                <option value="Manual">
                  Manual
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Payment
              </label>

              <select
                value={
                  paymentModeInput
                }
                onChange={(
                  event
                ) =>
                  setPaymentModeInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              >
                <option value="">
                  All
                </option>
                <option value="COD">
                  COD
                </option>
                <option value="PPD">
                  PPD
                </option>
                <option value="ONLINE">
                  ONLINE
                </option>
                <option value="PREPAID">
                  PREPAID
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                Status
              </label>

              <select
                value={
                  statusInput
                }
                onChange={(
                  event
                ) =>
                  setStatusInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              >
                <option value="">
                  All Status
                </option>
                <option value="Delivered">
                  Delivered
                </option>
                <option value="Cancelled">
                  Cancelled
                </option>
                <option value="Not Delivered">
                  Not Delivered
                </option>
                <option value="Partial Delivery">
                  Partial Delivery
                </option>
                <option value="Bad Delivery">
                  Bad Delivery
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                From Date &amp; Time
              </label>

              <input
                type="datetime-local"
                value={
                  fromDateTimeInput
                }
                onChange={(
                  event
                ) =>
                  setFromDateTimeInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-600">
                To Date &amp; Time
              </label>

              <input
                type="datetime-local"
                value={
                  toDateTimeInput
                }
                onChange={(
                  event
                ) =>
                  setToDateTimeInput(
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={
                  handleClear
                }
                disabled={
                  loading
                }
                className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="h-10 flex-1 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white"
              >
                {loading
                  ? "Loading..."
                  : "Search"}
              </button>
            </div>
          </div>
        </form>

        {selectedRestro && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
            <strong>
              {selectedRestro.RestroCode}
            </strong>{" "}
            /{" "}
            {selectedRestro.RestroName ||
              "-"}{" "}
            /{" "}
            {selectedRestro.StationCode ||
              "-"}
            {selectedRestro.StationName
              ? ` — ${selectedRestro.StationName}`
              : ""}
          </div>
        )}

        {filterDescription && (
          <div className="mb-3 rounded-lg border bg-slate-50 px-3 py-2 text-xs">
            Active Filters:{" "}
            <strong>
              {filterDescription}
            </strong>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="w-full overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              {COLUMNS.map(
                (
                  column
                ) => (
                  <col
                    key={
                      column.key
                    }
                    style={{
                      width:
                        column.width,
                    }}
                  />
                )
              )}
            </colgroup>

            <thead>
              <tr className="bg-slate-100">
                {COLUMNS.map(
                  (
                    column
                  ) => (
                    <th
                      key={
                        column.key
                      }
                      className={[
                        "border-b border-r px-1 py-2 text-[9px] font-bold",
                        alignClass(
                          column.align
                        ),
                      ].join(
                        " "
                      )}
                    >
                      {
                        column.title
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      COLUMNS.length
                    }
                    className="p-10 text-center"
                  >
                    Loading RE RDS...
                  </td>
                </tr>
              ) : rows.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={
                      COLUMNS.length
                    }
                    className="p-10 text-center text-slate-400"
                  >
                    No RE RDS records found
                  </td>
                </tr>
              ) : (
                rows.map(
                  (
                    row,
                    index
                  ) => (
                    <tr
                      key={`${row.RERDSId}-${row.OrderId}-${index}`}
                      onClick={() =>
                        setSelectedRow(
                          row
                        )
                      }
                      className={[
                        "cursor-pointer transition hover:bg-blue-50",
                        index % 2 ===
                        0
                          ? "bg-white"
                          : "bg-slate-50",
                      ].join(
                        " "
                      )}
                    >
                      {COLUMNS.map(
                        (
                          column
                        ) => (
                          <td
                            key={
                              column.key
                            }
                            className={[
                              "border-b border-r px-1 py-2 align-top text-[9px]",
                              alignClass(
                                column.align
                              ),
                              column.key ===
                              "CurrentBal"
                                ? "bg-blue-50/60"
                                : "",
                              column.key ===
                              "RESettlementAmount"
                                ? "bg-violet-50/40"
                                : "",
                            ].join(
                              " "
                            )}
                          >
                            {renderCell(
                              row,
                              column
                            )}
                          </td>
                        )
                      )}
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            Showing{" "}
            <strong>
              {firstVisibleRecord}
            </strong>{" "}
            -{" "}
            <strong>
              {lastVisibleRecord}
            </strong>{" "}
            of{" "}
            <strong>
              {total}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                goToPage(1)
              }
              disabled={
                loading ||
                page <= 1
              }
              className="rounded border px-3 py-2"
            >
              «
            </button>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  page - 1
                )
              }
              disabled={
                loading ||
                page <= 1
              }
              className="rounded border px-3 py-2"
            >
              Prev
            </button>

            <span className="rounded border bg-slate-50 px-4 py-2 font-bold">
              {page} /{" "}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  page + 1
                )
              }
              disabled={
                loading ||
                page >=
                  totalPages
              }
              className="rounded border px-3 py-2"
            >
              Next
            </button>

            <button
              type="button"
              onClick={() =>
                goToPage(
                  totalPages
                )
              }
              disabled={
                loading ||
                page >=
                  totalPages
              }
              className="rounded border px-3 py-2"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {selectedRow && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={() =>
            setSelectedRow(
              null
            )
          }
        >
          <div
            className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
            onMouseDown={(
              event
            ) =>
              event
                .stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-950">
                  RE RDS Transaction Details
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {selectedRow.OrderId ||
                    "-"}{" "}
                  • RE RDS ID{" "}
                  {selectedRow.RERDSId ||
                    "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRow(
                    null
                  )
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-bold text-slate-700 hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem
                  label="Entry Source"
                  value={
                    selectedRow.EntrySource
                  }
                />

                <DetailItem
                  label="Status"
                  value={
                    selectedRow.Status
                  }
                />

                <DetailItem
                  label="Sub Status"
                  value={
                    selectedRow.SubStatus
                  }
                />

                <DetailItem
                  label="Created At"
                  value={
                    selectedRow.CreatedAt
                  }
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-base font-bold text-slate-900">
                  Restaurant &amp; Order
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem
                    label="Restro Code"
                    value={
                      selectedRow.RestroCode
                    }
                  />

                  <DetailItem
                    label="Restro Name"
                    value={
                      selectedRow.RestroName
                    }
                  />

                  <DetailItem
                    label="Station"
                    value={
                      selectedRow.StationCode
                    }
                  />

                  <DetailItem
                    label="Order / Reference"
                    value={
                      selectedRow.OrderId
                    }
                  />

                  <DetailItem
                    label="Restro RDS Id"
                    value={
                      selectedRow.RestroRDSId
                    }
                  />

                  <DetailItem
                    label="Delivery Date"
                    value={
                      selectedRow.DeliveryDate
                    }
                  />

                  <DetailItem
                    label="Delivery Time"
                    value={
                      selectedRow.DeliveryTime
                    }
                  />

                  <DetailItem
                    label="Coupon"
                    value={
                      selectedRow.CouponCode
                    }
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="mb-3 text-base font-bold text-slate-900">
                  Payment &amp; Calculation
                </h4>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <DetailItem
                    label="Payment Mode"
                    value={
                      selectedRow.PaymentMode
                    }
                  />

                  <DetailItem
                    label="Restro Price"
                    value={
                      selectedRow.RestroPrice
                    }
                    money
                  />

                  <DetailItem
                    label="Base Price"
                    value={
                      selectedRow.BasePrice
                    }
                    money
                  />

                  <DetailItem
                    label="Discounted Base"
                    value={
                      selectedRow.DiscountedBasePrice
                    }
                    money
                  />

                  <DetailItem
                    label="Commission"
                    value={
                      selectedRow.Commission
                    }
                    money
                  />

                  <DetailItem
                    label="GST"
                    value={
                      selectedRow.GSTAmount
                    }
                    money
                  />

                  <DetailItem
                    label="Platform"
                    value={
                      selectedRow.PlatformCharge
                    }
                    money
                  />

                  <DetailItem
                    label="Restro Discount"
                    value={
                      selectedRow.RestroDiscount
                    }
                    money
                  />

                  <DetailItem
                    label="RE Discount"
                    value={
                      selectedRow.REDiscount
                    }
                    money
                  />

                  <DetailItem
                    label="Total"
                    value={
                      selectedRow.TotalAmount
                    }
                    money
                  />

                  <DetailItem
                    label="COD"
                    value={
                      selectedRow.CODAmount
                    }
                    money
                  />

                  <DetailItem
                    label="PPD"
                    value={
                      selectedRow.PPDAmount
                    }
                    money
                  />

                  <DetailItem
                    label="Penalty"
                    value={
                      selectedRow.OrderPenalty
                    }
                    money
                  />

                  <DetailItem
                    label="IGST"
                    value={
                      selectedRow.IGST
                    }
                    money
                  />

                  <DetailItem
                    label="Order Charges"
                    value={
                      selectedRow.OrderCharges
                    }
                    money
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h4 className="mb-3 text-base font-bold text-blue-950">
                  Settlement &amp; Balance
                </h4>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem
                    label="Restro Settlement"
                    value={
                      selectedRow.RestroSettlementAmount
                    }
                    money
                  />

                  <DetailItem
                    label="RE Settlement"
                    value={
                      selectedRow.RESettlementAmount
                    }
                    money
                    highlight
                  />

                  <DetailItem
                    label="Previous Balance"
                    value={
                      selectedRow.PreviousBal
                    }
                    money
                  />

                  <DetailItem
                    label="Current Balance"
                    value={
                      selectedRow.CurrentBal
                    }
                    money
                    highlight
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-2 text-base font-bold text-amber-950">
                  Remarks
                </h4>

                <p className="whitespace-pre-wrap text-sm font-medium text-amber-900">
                  {selectedRow.Remarks ||
                    "No remarks"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
