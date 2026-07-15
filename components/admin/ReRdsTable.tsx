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
  PaymentMode: string | null;
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

type Summary = {
  universalBalance: number;
  totalReceivable: number;
  totalPayable: number;
  netMovement: number;
  lastEntryAt: string | null;
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
  entrySource: string;
  paymentMode: string;
  from: string;
  to: string;
};

const EMPTY_SUMMARY: Summary = {
  universalBalance: 0,
  totalReceivable: 0,
  totalPayable: 0,
  netMovement: 0,
  lastEntryAt: null,
};

const COLUMNS: {
  key: keyof ReRdsRow;
  title: string;
  type?: "money" | "balance" | "reSettlement";
  width: string;
  align?: "left" | "center" | "right";
}[] = [
  { key: "RERDSId", title: "RE RDS Id", width: "3.2%", align: "center" },
  { key: "RestroRDSId", title: "Restro RDS Id", width: "3.4%", align: "center" },
  { key: "OrderId", title: "Order / Ref.", width: "6.2%" },
  { key: "EntrySource", title: "Entry Source", width: "4.5%", align: "center" },
  { key: "RestroCode", title: "Restro Code", width: "3.8%", align: "center" },
  { key: "RestroName", title: "Restro Name", width: "5.7%" },
  { key: "StationCode", title: "Station", width: "3.1%", align: "center" },
  { key: "Status", title: "Status", width: "3.9%" },
  { key: "SubStatus", title: "Sub Status", width: "4.2%" },
  { key: "PaymentMode", title: "Payment", width: "3.4%", align: "center" },
  { key: "BasePrice", title: "Base Price", type: "money", width: "3.5%", align: "right" },
  { key: "DiscountedBasePrice", title: "Discounted Base", type: "money", width: "4%", align: "right" },
  { key: "Commission", title: "Commission", type: "money", width: "3.4%", align: "right" },
  { key: "GSTAmount", title: "GST", type: "money", width: "2.8%", align: "right" },
  { key: "PlatformCharge", title: "Platform", type: "money", width: "3.2%", align: "right" },
  { key: "RestroDiscount", title: "Restro Disc.", type: "money", width: "3.5%", align: "right" },
  { key: "REDiscount", title: "RE Disc.", type: "money", width: "3.1%", align: "right" },
  { key: "TotalAmount", title: "Total", type: "money", width: "3.3%", align: "right" },
  { key: "CODAmount", title: "COD", type: "money", width: "3%", align: "right" },
  { key: "PPDAmount", title: "PPD", type: "money", width: "3%", align: "right" },
  { key: "OrderPenalty", title: "Penalty", type: "money", width: "3%", align: "right" },
  { key: "IGST", title: "IGST", type: "money", width: "2.7%", align: "right" },
  { key: "OrderCharges", title: "Order Charges", type: "money", width: "3.5%", align: "right" },
  { key: "RestroSettlementAmount", title: "Restro Settle.", type: "money", width: "3.8%", align: "right" },
  { key: "RESettlementAmount", title: "RE Settle.", type: "reSettlement", width: "3.8%", align: "right" },
  { key: "PreviousBal", title: "Previous Bal.", type: "money", width: "3.8%", align: "right" },
  { key: "CurrentBal", title: "Current Bal.", type: "balance", width: "4%", align: "right" },
  { key: "CreatedAt", title: "Created At", width: "4.4%", align: "center" },
];

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: unknown) {
  return numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function inputDateTimeToDisplay(value: string) {
  if (!value) return "";
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = (datePart || "").split("-");
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}${timePart ? ` ${timePart}` : ""}`;
}

function alignClass(align?: "left" | "center" | "right") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

function entrySourceDetails(value: unknown) {
  const source = textValue(value) || "-";
  const normalized = source.toLowerCase().replace(/[^a-z]/g, "");

  if (normalized === "order") {
    return { label: "Order", className: "border-blue-200 bg-blue-50 text-blue-700" };
  }
  if (normalized === "creditnote") {
    return { label: "Credit Note", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }
  if (normalized === "debitnote") {
    return { label: "Debit Note", className: "border-red-200 bg-red-50 text-red-700" };
  }
  return { label: source, className: "border-slate-200 bg-slate-50 text-slate-700" };
}

function statusClass(value: unknown) {
  const status = textValue(value).toLowerCase();
  if (status === "delivered") return "border-green-200 bg-green-50 text-green-700";
  if (status.includes("cancel")) return "border-red-200 bg-red-50 text-red-700";
  if (status.includes("notdelivered") || status.includes("not delivered")) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  if (status.includes("partial") || status.includes("bad")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function paymentModeClass(value: unknown) {
  const mode = textValue(value).toUpperCase();
  if (["PPD", "PREPAID", "ONLINE"].includes(mode)) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }
  if (mode === "-") return "border-slate-200 bg-slate-50 text-slate-600";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function summaryValueClass(value: number) {
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-red-700";
  return "text-slate-900";
}

export default function ReRdsTable() {
  const [rows, setRows] = useState<ReRdsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [selectedRestro, setSelectedRestro] = useState<SelectedRestro | null>(null);

  const [restroCodeInput, setRestroCodeInput] = useState("");
  const [entrySourceInput, setEntrySourceInput] = useState("");
  const [paymentModeInput, setPaymentModeInput] = useState("");
  const [fromDateTimeInput, setFromDateTimeInput] = useState("");
  const [toDateTimeInput, setToDateTimeInput] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    restroCode: "",
    entrySource: "",
    paymentMode: "",
    from: "",
    to: "",
  });

  const fetchRows = useCallback(async (
    requestedPage: number,
    requestedPageSize: PageSize,
    filters: AppliedFilters
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(requestedPage));
      params.set("pageSize", String(requestedPageSize));
      if (filters.restroCode) params.set("restroCode", filters.restroCode);
      if (filters.entrySource) params.set("entrySource", filters.entrySource);
      if (filters.paymentMode) params.set("paymentMode", filters.paymentMode);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);

      const response = await fetch(`/api/admin/re-rds?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const json: ApiResponse = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Unable to load RE RDS");
      }

      const nextTotalPages = Math.max(1, Number(json.totalPages ?? 1));
      setRows(Array.isArray(json.rows) ? json.rows : []);
      setTotal(Number(json.total ?? 0));
      setPage(Math.min(Number(json.page ?? requestedPage), nextTotalPages));
      setTotalPages(nextTotalPages);
      setSelectedRestro(json.selectedRestro ?? null);
      setSummary(json.summary ?? EMPTY_SUMMARY);
    } catch (fetchError: any) {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
      setSelectedRestro(null);
      setSummary(EMPTY_SUMMARY);
      setError(fetchError?.message || "Unable to load RE RDS");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows(1, 20, {
      restroCode: "",
      entrySource: "",
      paymentMode: "",
      from: "",
      to: "",
    });
  }, [fetchRows]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    const nextFilters: AppliedFilters = {
      restroCode: restroCodeInput.replace(/\D/g, "").trim(),
      entrySource: entrySourceInput,
      paymentMode: paymentModeInput,
      from: fromDateTimeInput,
      to: toDateTimeInput,
    };

    if (nextFilters.from && nextFilters.to && new Date(nextFilters.from) > new Date(nextFilters.to)) {
      setError("From Date-Time, To Date-Time se bada nahi ho sakta.");
      return;
    }

    setAppliedFilters(nextFilters);
    setPage(1);
    fetchRows(1, pageSize, nextFilters);
  }

  function handleClear() {
    const cleared: AppliedFilters = {
      restroCode: "",
      entrySource: "",
      paymentMode: "",
      from: "",
      to: "",
    };

    setRestroCodeInput("");
    setEntrySourceInput("");
    setPaymentModeInput("");
    setFromDateTimeInput("");
    setToDateTimeInput("");
    setAppliedFilters(cleared);
    setSelectedRestro(null);
    setError(null);
    setPage(1);
    fetchRows(1, pageSize, cleared);
  }

  function handlePageSizeChange(value: string) {
    const parsed = Number(value) as PageSize;
    const nextPageSize: PageSize = [20, 50, 100, 500].includes(parsed) ? parsed : 20;
    setPageSize(nextPageSize);
    setPage(1);
    fetchRows(1, nextPageSize, appliedFilters);
  }

  function goToPage(nextPage: number) {
    if (loading || nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    setPage(nextPage);
    fetchRows(nextPage, pageSize, appliedFilters);
  }

  const firstVisibleRecord = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisibleRecord = Math.min(page * pageSize, total);

  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (appliedFilters.restroCode) parts.push(`Restro ${appliedFilters.restroCode}`);
    if (appliedFilters.entrySource) parts.push(`Entry ${appliedFilters.entrySource}`);
    if (appliedFilters.paymentMode) parts.push(`Payment ${appliedFilters.paymentMode}`);
    if (appliedFilters.from) parts.push(`From ${inputDateTimeToDisplay(appliedFilters.from)}`);
    if (appliedFilters.to) parts.push(`To ${inputDateTimeToDisplay(appliedFilters.to)}`);
    return parts.join(" • ");
  }, [appliedFilters]);

  function renderCell(row: ReRdsRow, column: (typeof COLUMNS)[number]) {
    const value = row[column.key];

    if (column.key === "EntrySource") {
      const details = entrySourceDetails(value);
      return (
        <span className={["inline-flex max-w-full rounded border px-1 py-0.5 font-semibold", details.className].join(" ")}>
          <span className="truncate">{details.label}</span>
        </span>
      );
    }

    if (column.key === "Status") {
      const status = textValue(value) || "-";
      return (
        <span className={["inline-flex max-w-full rounded border px-1 py-0.5 font-semibold", statusClass(status)].join(" ")}>
          <span className="truncate">{status}</span>
        </span>
      );
    }

    if (column.key === "PaymentMode") {
      const mode = textValue(value) || "-";
      return <span className={["inline-flex rounded border px-1 py-0.5 font-bold", paymentModeClass(mode)].join(" ")}>{mode}</span>;
    }

    if (column.type === "balance") {
      const amount = numberValue(value);
      return <span className={["block text-[11px] font-extrabold", amount < 0 ? "text-red-700" : amount > 0 ? "text-green-700" : "text-slate-900"].join(" ")}>{formatMoney(amount)}</span>;
    }

    if (column.type === "reSettlement") {
      const amount = numberValue(value);
      return <span className={["font-extrabold", amount > 0 ? "text-emerald-700" : amount < 0 ? "text-red-700" : "text-slate-700"].join(" ")}>{formatMoney(amount)}</span>;
    }

    if (column.type === "money") {
      const amount = numberValue(value);
      return <span className={amount < 0 ? "font-semibold text-red-700" : ""}>{formatMoney(amount)}</span>;
    }

    const text = textValue(value);
    return <span className="block break-words leading-tight" title={text}>{text || "-"}</span>;
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">RE RDS Management</h3>
          <p className="mt-1 text-xs font-medium text-slate-500">RailEats All-India universal company ledger.</p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="re-rds-page-size" className="text-sm font-medium text-slate-600">Rows</label>
          <select id="re-rds-page-size" value={pageSize} onChange={(e) => handlePageSizeChange(e.target.value)} disabled={loading} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold">
            <option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value={500}>500</option>
          </select>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-blue-600">Universal Balance</div>
          <div className={["mt-1 text-2xl font-extrabold", summaryValueClass(summary.universalBalance)].join(" ")}>₹{formatMoney(summary.universalBalance)}</div>
          <div className="mt-1 text-xs text-slate-500">Last entry: {summary.lastEntryAt || "-"}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Total Receivable</div>
          <div className="mt-1 text-xl font-extrabold text-emerald-700">₹{formatMoney(summary.totalReceivable)}</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-red-700">Total Payable</div>
          <div className="mt-1 text-xl font-extrabold text-red-700">₹{formatMoney(summary.totalPayable)}</div>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Filtered Net Movement</div>
          <div className={["mt-1 text-xl font-extrabold", summaryValueClass(summary.netMovement)].join(" ")}>₹{formatMoney(summary.netMovement)}</div>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[0.9fr_0.9fr_0.8fr_1fr_1fr_auto] xl:items-end">
          <div><label className="mb-1 block text-sm text-slate-600">Restro Code</label><input value={restroCodeInput} onChange={(e) => setRestroCodeInput(e.target.value.replace(/\D/g, ""))} className="search-pill-sm w-full" placeholder="1032" /></div>
          <div><label className="mb-1 block text-sm text-slate-600">Entry Source</label><select value={entrySourceInput} onChange={(e) => setEntrySourceInput(e.target.value)} className="search-pill-sm w-full"><option value="">All Entries</option><option value="Order">Order</option><option value="CreditNote">Credit Note</option><option value="DebitNote">Debit Note</option><option value="Manual">Manual</option></select></div>
          <div><label className="mb-1 block text-sm text-slate-600">Payment</label><select value={paymentModeInput} onChange={(e) => setPaymentModeInput(e.target.value)} className="search-pill-sm w-full"><option value="">All</option><option value="COD">COD</option><option value="PPD">PPD</option><option value="ONLINE">ONLINE</option><option value="PREPAID">PREPAID</option></select></div>
          <div><label className="mb-1 block text-sm text-slate-600">From Date &amp; Time</label><input type="datetime-local" value={fromDateTimeInput} onChange={(e) => setFromDateTimeInput(e.target.value)} className="search-pill-sm w-full" /></div>
          <div><label className="mb-1 block text-sm text-slate-600">To Date &amp; Time</label><input type="datetime-local" value={toDateTimeInput} onChange={(e) => setToDateTimeInput(e.target.value)} className="search-pill-sm w-full" /></div>
          <div className="flex gap-2"><button type="button" onClick={handleClear} disabled={loading} className="h-10 rounded-lg border px-4 text-sm font-semibold">Clear</button><button type="submit" disabled={loading} className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white">{loading ? "Loading..." : "Search"}</button></div>
        </div>
      </form>

      {selectedRestro && <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm"><strong>{selectedRestro.RestroCode}</strong> / {selectedRestro.RestroName || "-"} / {selectedRestro.StationCode || "-"}{selectedRestro.StationName ? ` — ${selectedRestro.StationName}` : ""}</div>}
      {filterDescription && <div className="mb-3 rounded-lg border bg-slate-50 px-3 py-2 text-xs">Active Filters: <strong>{filterDescription}</strong></div>}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="w-full overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full table-fixed border-collapse">
          <colgroup>{COLUMNS.map((c) => <col key={c.key} style={{ width: c.width }} />)}</colgroup>
          <thead><tr className="bg-slate-100">{COLUMNS.map((c) => <th key={c.key} className={["border-b border-r px-1 py-2 text-[9px] font-bold", alignClass(c.align)].join(" ")}>{c.title}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={COLUMNS.length} className="p-10 text-center">Loading RE RDS...</td></tr> : rows.length === 0 ? <tr><td colSpan={COLUMNS.length} className="p-10 text-center text-slate-400">No RE RDS records found</td></tr> : rows.map((row, index) => <tr key={`${row.RERDSId}-${row.OrderId}-${index}`} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>{COLUMNS.map((c) => <td key={c.key} className={["border-b border-r px-1 py-2 align-top text-[9px]", alignClass(c.align), c.key === "CurrentBal" ? "bg-blue-50/60" : "", c.key === "RESettlementAmount" ? "bg-violet-50/40" : ""].join(" ")}>{renderCell(row, c)}</td>)}</tr>)}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 text-sm lg:flex-row lg:items-center lg:justify-between">
        <div>Showing <strong>{firstVisibleRecord}</strong> - <strong>{lastVisibleRecord}</strong> of <strong>{total}</strong></div>
        <div className="flex items-center gap-2"><button onClick={() => goToPage(1)} disabled={loading || page <= 1} className="rounded border px-3 py-2">«</button><button onClick={() => goToPage(page - 1)} disabled={loading || page <= 1} className="rounded border px-3 py-2">Prev</button><span className="rounded border bg-slate-50 px-4 py-2 font-bold">{page} / {totalPages}</span><button onClick={() => goToPage(page + 1)} disabled={loading || page >= totalPages} className="rounded border px-3 py-2">Next</button><button onClick={() => goToPage(totalPages)} disabled={loading || page >= totalPages} className="rounded border px-3 py-2">»</button></div>
      </div>
    </div>
  );
}
