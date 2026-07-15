// components/admin/RestroRdsTable.tsx
"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
  EntrySource: string | null;
  DeliveryDate: string | null;
  DeliveryTime: string | null;
  PaymentMode: string | null;
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
  CreatedAtRaw?: string | null;
};

type SelectedRestro = {
  RestroCode: number | string;
  RestroName: string;
  StationCode: string;
  StationName: string;
};

type ApiResponse = {
  ok: boolean;
  rows?: RestroRdsRow[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  selectedRestro?: SelectedRestro | null;
  error?: string;
  details?: string | null;
  hint?: string | null;
};

type PageSize = 20 | 50 | 100 | 500;

type AppliedFilters = {
  restroCode: string;
  from: string;
  to: string;
};

/* =========================================================
   TABLE COLUMNS

   CSV ke same columns aur same order.
   ========================================================= */

const COLUMNS: {
  key: keyof RestroRdsRow;
  title: string;
  type?: "money" | "text" | "balance";
  width: string;
  align?: "left" | "center" | "right";
}[] = [
  {
    key: "RDSId",
    title: "RDS Id",
    width: "3.4%",
    align: "center",
  },
  {
    key: "RestroCode",
    title: "Restro Code",
    width: "4.2%",
    align: "center",
  },
  {
    key: "OrderId",
    title: "Order Id",
    width: "6.4%",
  },
  {
    key: "RestroName",
    title: "Restro Name",
    width: "6.2%",
  },
  {
    key: "StationCode",
    title: "Station",
    width: "3.5%",
    align: "center",
  },
  {
    key: "Status",
    title: "Status",
    width: "4.2%",
  },
  {
  key: "EntrySource",
  title: "Entry Source",
  width: "4%",
  align: "center",
},
  {
    key: "SubStatus",
    title: "Sub Status",
    width: "4.8%",
  },
  {
    key: "DeliveryDate",
    title: "Delivery Date",
    width: "4.1%",
    align: "center",
  },
  {
    key: "DeliveryTime",
    title: "Delivery Time",
    width: "3.7%",
    align: "center",
  },
  {
    key: "PaymentMode",
    title: "Payment",
    width: "3.5%",
    align: "center",
  },
  {
    key: "RestroPrice",
    title: "Restro Price",
    type: "money",
    width: "3.7%",
    align: "right",
  },
  {
    key: "BasePrice",
    title: "Base Price",
    type: "money",
    width: "3.7%",
    align: "right",
  },
  {
    key: "DiscountedBasePrice",
    title: "Discounted Base",
    type: "money",
    width: "4.2%",
    align: "right",
  },
  {
    key: "Commission",
    title: "Commission",
    type: "money",
    width: "3.7%",
    align: "right",
  },
  {
    key: "GSTAmount",
    title: "GST",
    type: "money",
    width: "3%",
    align: "right",
  },
  {
    key: "PlatformCharge",
    title: "Platform",
    type: "money",
    width: "3.5%",
    align: "right",
  },
  {
    key: "RestroDiscount",
    title: "Restro Disc.",
    type: "money",
    width: "3.7%",
    align: "right",
  },
  {
    key: "REDiscount",
    title: "RE Disc.",
    type: "money",
    width: "3.3%",
    align: "right",
  },
  {
    key: "TotalAmount",
    title: "Total",
    type: "money",
    width: "3.5%",
    align: "right",
  },
  {
    key: "CODAmount",
    title: "COD",
    type: "money",
    width: "3.2%",
    align: "right",
  },
  {
    key: "PPDAmount",
    title: "PPD",
    type: "money",
    width: "3.2%",
    align: "right",
  },
  {
    key: "OrderPenalty",
    title: "Penalty",
    type: "money",
    width: "3.2%",
    align: "right",
  },
  {
    key: "IGST",
    title: "IGST",
    type: "money",
    width: "2.8%",
    align: "right",
  },
  {
    key: "OrderCharges",
    title: "Order Charges",
    type: "money",
    width: "3.8%",
    align: "right",
  },
  {
    key: "SettlementAmount",
    title: "Settlement",
    type: "money",
    width: "4%",
    align: "right",
  },
  {
    key: "PreviousBal",
    title: "Previous Bal.",
    type: "money",
    width: "4%",
    align: "right",
  },
  {
    key: "CurrentBal",
    title: "Current Bal.",
    type: "balance",
    width: "4.2%",
    align: "right",
  },
  {
    key: "CreatedAt",
    title: "Created At",
    width: "4.5%",
    align: "center",
  },
];

/* =========================================================
   HELPERS
   ========================================================= */

function textValue(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatMoney(value: unknown) {
  return numberValue(value).toLocaleString(
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

  const [datePart, timePart] =
    value.split("T");

  if (!datePart) {
    return value;
  }

  const [year, month, day] =
    datePart.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}-${month}-${year}${
    timePart
      ? ` ${timePart}`
      : ""
  }`;
}

function alignClass(
  align?: "left" | "center" | "right"
) {
  if (align === "right") {
    return "text-right";
  }

  if (align === "center") {
    return "text-center";
  }

  return "text-left";
}

function paymentModeClass(
  value: unknown
) {
  const mode =
    textValue(value).toUpperCase();

  if (
    [
      "PPD",
      "PREPAID",
      "ONLINE",
    ].includes(mode)
  ) {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }

  return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (
    status.includes("cancel")
  ) {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (
    status.includes(
      "not delivered"
    )
  ) {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  if (
    status.includes("partial") ||
    status.includes("bad")
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function RestroRdsTable() {
  const [rows, setRows] =
    useState<RestroRdsRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState<PageSize>(20);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  /*
   * Search form values.
   */
  const [
    restroCodeInput,
    setRestroCodeInput,
  ] = useState("");

  const [
    fromDateTimeInput,
    setFromDateTimeInput,
  ] = useState("");

  const [
    toDateTimeInput,
    setToDateTimeInput,
  ] = useState("");

  /*
   * API par sirf Search button ke baad
   * ye filters apply honge.
   */
  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState<AppliedFilters>({
    restroCode: "",
    from: "",
    to: "",
  });

  const [
    selectedRestro,
    setSelectedRestro,
  ] =
    useState<SelectedRestro | null>(
      null
    );

  /* =======================================================
     FETCH DATA
     ======================================================= */

  const fetchRows =
    useCallback(
      async (
        requestedPage: number,
        requestedPageSize: PageSize,
        filters: AppliedFilters
      ) => {
        setLoading(true);
        setError(null);

        try {
          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(requestedPage)
          );

          params.set(
            "pageSize",
            String(requestedPageSize)
          );

          if (
            filters.restroCode
          ) {
            params.set(
              "restroCode",
              filters.restroCode
            );
          }

          if (filters.from) {
            params.set(
              "from",
              filters.from
            );
          }

          if (filters.to) {
            params.set(
              "to",
              filters.to
            );
          }

          const response =
            await fetch(
              `/api/admin/restro-rds?${params.toString()}`,
              {
                method: "GET",
                cache: "no-store",
              }
            );

          const json: ApiResponse =
            await response.json();

          if (
            !response.ok ||
            !json.ok
          ) {
            throw new Error(
              json.error ||
                "Unable to load Restro RDS"
            );
          }

          const nextRows =
            Array.isArray(json.rows)
              ? json.rows
              : [];

          const nextPage =
            Number(
              json.page ??
                requestedPage
            );

          const nextTotalPages =
            Math.max(
              1,
              Number(
                json.totalPages ??
                  1
              )
            );

          setRows(nextRows);
          setTotal(
            Number(json.total ?? 0)
          );

          setPage(
            Math.min(
              nextPage,
              nextTotalPages
            )
          );

          setTotalPages(
            nextTotalPages
          );

          setSelectedRestro(
            json.selectedRestro ??
              null
          );
        } catch (fetchError: any) {
          console.error(
            "RESTRO RDS FETCH ERROR =>",
            fetchError
          );

          setRows([]);
          setTotal(0);
          setTotalPages(1);
          setSelectedRestro(null);

          setError(
            fetchError?.message ||
              "Unable to load Restro RDS"
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  /*
   * Initial default load:
   *
   * All Restaurants
   * Latest 20
   * API sort:
   * CreatedAt DESC
   * RDSId DESC
   */
  useEffect(() => {
    fetchRows(
      1,
      20,
      {
        restroCode: "",
        from: "",
        to: "",
      }
    );
  }, [fetchRows]);

  /* =======================================================
     FILTER ACTIONS
     ======================================================= */

  function handleSearch(
    event: FormEvent
  ) {
    event.preventDefault();

    const nextFilters: AppliedFilters =
      {
        restroCode:
          restroCodeInput
            .replace(/\D/g, "")
            .trim(),

        from:
          fromDateTimeInput,

        to:
          toDateTimeInput,
      };

    if (
      nextFilters.from &&
      nextFilters.to &&
      new Date(nextFilters.from) >
        new Date(nextFilters.to)
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
    const clearedFilters: AppliedFilters =
      {
        restroCode: "",
        from: "",
        to: "",
      };

    setRestroCodeInput("");
    setFromDateTimeInput("");
    setToDateTimeInput("");

    setAppliedFilters(
      clearedFilters
    );

    setSelectedRestro(null);
    setError(null);
    setPage(1);

    fetchRows(
      1,
      pageSize,
      clearedFilters
    );
  }

  function handlePageSizeChange(
    value: string
  ) {
    const parsed =
      Number(value) as PageSize;

    const nextPageSize: PageSize =
      [20, 50, 100, 500].includes(
        parsed
      )
        ? parsed
        : 20;

    setPageSize(
      nextPageSize
    );

    setPage(1);

    fetchRows(
      1,
      nextPageSize,
      appliedFilters
    );
  }

  function goToPage(
    nextPage: number
  ) {
    if (
      loading ||
      nextPage < 1 ||
      nextPage > totalPages ||
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

  /* =======================================================
     DISPLAY COUNTS
     ======================================================= */

  const firstVisibleRecord =
    total === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const lastVisibleRecord =
    Math.min(
      page * pageSize,
      total
    );

  const filterDescription =
    useMemo(() => {
      const parts: string[] = [];

      if (
        appliedFilters.restroCode
      ) {
        parts.push(
          `Restro ${appliedFilters.restroCode}`
        );
      }

      if (
        appliedFilters.from
      ) {
        parts.push(
          `From ${inputDateTimeToDisplay(
            appliedFilters.from
          )}`
        );
      }

      if (
        appliedFilters.to
      ) {
        parts.push(
          `To ${inputDateTimeToDisplay(
            appliedFilters.to
          )}`
        );
      }

      return parts.join(" • ");
    }, [appliedFilters]);

  /* =======================================================
   CELL RENDERER
   ======================================================= */

function renderCell(
  row: RestroRdsRow,
  column: (typeof COLUMNS)[number]
) {
  const value = row[column.key];

  if (column.key === "Status") {
    const status =
      textValue(value) || "-";

    return (
      <span
        title={status}
        className={[
          "inline-flex max-w-full items-center rounded border px-1 py-0.5 font-semibold",
          statusClass(status),
        ].join(" ")}
      >
        <span className="truncate">
          {status}
        </span>
      </span>
    );
  }

  if (column.key === "EntrySource") {
    const source =
      textValue(value) || "-";

    const normalizedSource =
      source
        .toLowerCase()
        .replace(/[^a-z]/g, "");

    const sourceClass =
      normalizedSource === "order"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : normalizedSource === "creditnote"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : normalizedSource === "debitnote"
        ? "border-red-200 bg-red-50 text-red-700"
        : normalizedSource === "manual"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-700";

    const sourceLabel =
      normalizedSource === "creditnote"
        ? "Credit Note"
        : normalizedSource === "debitnote"
        ? "Debit Note"
        : normalizedSource === "order"
        ? "Order"
        : normalizedSource === "manual"
        ? "Manual"
        : source;

    return (
      <span
        title={sourceLabel}
        className={[
          "inline-flex max-w-full items-center rounded border px-1 py-0.5 font-semibold",
          sourceClass,
        ].join(" ")}
      >
        <span className="truncate">
          {sourceLabel}
        </span>
      </span>
    );
  }

  if (column.key === "PaymentMode") {
    const mode =
      textValue(value) || "-";

    return (
      <span
        className={[
          "inline-flex rounded border px-1 py-0.5 font-bold",
          paymentModeClass(mode),
        ].join(" ")}
      >
        {mode}
      </span>
    );
  }

  if (column.type === "balance") {
    const amount =
      numberValue(value);

    return (
      <span
        className={[
          "block text-[11px] font-extrabold leading-tight",
          amount < 0
            ? "text-red-700"
            : amount > 0
            ? "text-green-700"
            : "text-slate-900",
        ].join(" ")}
      >
        {formatMoney(amount)}
      </span>
    );
  }

  if (column.type === "money") {
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
        {formatMoney(amount)}
      </span>
    );
  }

  const text =
    textValue(value);

  return (
    <span
      title={text}
      className="block break-words leading-tight"
    >
      {text || "-"}
    </span>
  );
}
  /* =======================================================
     JSX
     ======================================================= */

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
      {/* ===============================================
          TOP HEADING
          =============================================== */}

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Restro RDS Management
          </h3>

          <p className="mt-1 text-xs font-medium text-slate-500">
            Default view shows latest
            entries from all restaurants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="rds-page-size"
            className="text-sm font-medium text-slate-600"
          >
            Rows
          </label>

          <select
            id="rds-page-size"
            value={pageSize}
            onChange={(event) =>
              handlePageSizeChange(
                event.target.value
              )
            }
            disabled={loading}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
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

      {/* ===============================================
          FILTERS
          =============================================== */}

      <form
        onSubmit={handleSearch}
        className="mb-4"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              Search by Restro Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={
                restroCodeInput
              }
              onChange={(event) =>
                setRestroCodeInput(
                  event.target.value
                    .replace(
                      /\D/g,
                      ""
                    )
                )
              }
              placeholder="Example: 1032"
              className="search-pill-sm w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              From Date &amp; Time
            </label>

            <input
              type="datetime-local"
              value={
                fromDateTimeInput
              }
              onChange={(event) =>
                setFromDateTimeInput(
                  event.target.value
                )
              }
              className="search-pill-sm w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">
              To Date &amp; Time
            </label>

            <input
              type="datetime-local"
              value={
                toDateTimeInput
              }
              onChange={(event) =>
                setToDateTimeInput(
                  event.target.value
                )
              }
              className="search-pill-sm w-full"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={
                handleClear
              }
              disabled={loading}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Search"}
            </button>
          </div>
        </div>
      </form>

      {/* ===============================================
          RESTAURANT SUMMARY
          =============================================== */}

      {selectedRestro && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Restro RDS Search
            Result
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            <div>
              <span className="text-slate-500">
                Restro Code:
              </span>{" "}
              <strong className="text-slate-900">
                {
                  selectedRestro.RestroCode
                }
              </strong>
            </div>

            <div>
              <span className="text-slate-500">
                Restro Name:
              </span>{" "}
              <strong className="text-slate-900">
                {selectedRestro.RestroName ||
                  "-"}
              </strong>
            </div>

            <div>
              <span className="text-slate-500">
                Station:
              </span>{" "}
              <strong className="text-slate-900">
                {selectedRestro.StationCode ||
                  "-"}
                {selectedRestro.StationName
                  ? ` — ${selectedRestro.StationName}`
                  : ""}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ===============================================
          ACTIVE FILTER SUMMARY
          =============================================== */}

      {filterDescription && (
        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          Active Filters:{" "}
          <span className="font-semibold text-slate-900">
            {filterDescription}
          </span>
        </div>
      )}

      {/* ===============================================
          ERROR
          =============================================== */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* ===============================================
          TABLE

          No horizontal scroll on desktop:
          table-layout fixed + compact font + wrapped cells.
          =============================================== */}

      <div className="w-full overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            {COLUMNS.map(
              (column) => (
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
                (column) => (
                  <th
                    key={
                      column.key
                    }
                    title={
                      column.title
                    }
                    className={[
                      "border-b border-r border-slate-200 px-1 py-2 align-middle text-[9px] font-bold leading-tight text-slate-700 last:border-r-0",
                      alignClass(
                        column.align
                      ),
                    ].join(" ")}
                  >
                    <span className="block break-words">
                      {
                        column.title
                      }
                    </span>
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
                  className="p-10 text-center text-sm font-medium text-slate-500"
                >
                  Loading Restro
                  RDS...
                </td>
              </tr>
            ) : rows.length ===
              0 ? (
              <tr>
                <td
                  colSpan={
                    COLUMNS.length
                  }
                  className="p-10 text-center text-sm font-medium text-slate-400"
                >
                  No Restro RDS
                  records found
                </td>
              </tr>
            ) : (
              rows.map(
                (
                  row,
                  rowIndex
                ) => (
                  <tr
                    key={`${row.RDSId}-${row.OrderId}-${rowIndex}`}
                    className={
                      rowIndex %
                        2 ===
                      0
                        ? "bg-white"
                        : "bg-slate-50"
                    }
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
                            "border-b border-r border-slate-200 px-1 py-2 align-top text-[9px] text-slate-700 last:border-r-0",
                            alignClass(
                              column.align
                            ),
                            column.key ===
                            "CurrentBal"
                              ? "bg-blue-50/60"
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

      {/* ===============================================
          PAGINATION
          =============================================== */}

      <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700 lg:flex-row lg:items-center lg:justify-between">
        <div className="font-medium">
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              goToPage(1)
            }
            disabled={
              loading ||
              page <= 1
            }
            className="rounded border border-slate-300 bg-white px-3 py-2 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded border border-slate-300 bg-white px-3 py-2 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Prev
          </button>

          <span className="rounded border border-slate-300 bg-slate-50 px-4 py-2 font-bold text-slate-900">
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
            className="rounded border border-slate-300 bg-white px-3 py-2 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded border border-slate-300 bg-white px-3 py-2 font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
