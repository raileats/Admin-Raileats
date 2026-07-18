"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type Row = {
  Id: number | string;
  RequestNo: string | null;
  RestroCode: number | string;
  RestroName: string | null;

  RequestDateFormatted: string | null;
  ApprovedDateFormatted?: string | null;
  RejectedDateFormatted?: string | null;
  PaidDateFormatted?: string | null;
  UpdatedAtFormatted?: string | null;

  Amount: number;
  CurrentBalance: number;
  LiveCurrentBalance?: number;
  BalanceAtRequest?: number;
  AvailableBalanceBeforeRequest: number;
  AvailableBalanceAtRequest?: number;
  PendingAmountBeforeRequest?: number;

  Status: string;

  VendorRemarks: string | null;
  AdminRemarks: string | null;

  ApprovedBy?: string | null;
  RejectedBy?: string | null;
  PaidBy?: string | null;

  UTR: string | null;
  PaymentMode?: string | null;

  BankName?: string | null;
  AccountNo?: string | null;
  IFSC?: string | null;

  LedgerRDSId?: number | string | null;
  RERDSId?: number | string | null;
};

type Action = "APPROVE" | "REJECT" | "PAID";

type ApiResponse = {
  ok: boolean;
  rows?: Row[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error?: string;
  message?: string;
};

const PAYMENT_MODES = [
  "NEFT",
  "RTGS",
  "IMPS",
  "UPI",
  "BANK TRANSFER",
  "CHEQUE",
  "CASH",
] as const;

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return numberValue(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function textValue(value: unknown) {
  return String(value ?? "").trim();
}

function statusClass(status: string) {
  if (status === "Paid") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "Approved") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "Rejected") {
    return "bg-red-100 text-red-800";
  }

  if (status === "Cancelled") {
    return "bg-slate-200 text-slate-700";
  }

  return "bg-amber-100 text-amber-800";
}

function todayIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map: Record<string, string> = {};

  for (const part of parts) {
    map[part.type] = part.value;
  }

  return `${map.year}-${map.month}-${map.day}`;
}

function maskAccount(value: unknown) {
  const text = textValue(value);

  if (!text) {
    return "-";
  }

  if (text.length <= 4) {
    return text;
  }

  return `${"•".repeat(Math.max(0, text.length - 4))}${text.slice(-4)}`;
}

function DetailBox({
  label,
  value,
  moneyValue = false,
  tone = "slate",
}: {
  label: string;
  value: unknown;
  moneyValue?: boolean;
  tone?: "slate" | "blue" | "emerald" | "amber" | "red";
}) {
  const toneClass = {
    slate: "border-slate-200 bg-slate-50",
    blue: "border-blue-200 bg-blue-50",
    emerald: "border-emerald-200 bg-emerald-50",
    amber: "border-amber-200 bg-amber-50",
    red: "border-red-200 bg-red-50",
  }[tone];

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="text-[9px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-black text-slate-950">
        {moneyValue
          ? `₹${money(value)}`
          : textValue(value) || "-"}
      </div>
    </div>
  );
}

export default function SettlementRequestsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Pending");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState<Row | null>(null);
  const [action, setAction] = useState<Action | null>(null);

  const [remarks, setRemarks] = useState("");
  const [utr, setUtr] = useState("");
  const [paidDate, setPaidDate] = useState(todayIndia());
  const [paymentMode, setPaymentMode] = useState("NEFT");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (status) {
        query.set("status", status);
      }

      if (search) {
        query.set("search", search);
      }

      const response = await fetch(
        `/api/admin/payment-requests?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json: ApiResponse = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(
          json.error || "Unable to load payment requests"
        );
      }

      setRows(Array.isArray(json.rows) ? json.rows : []);
      setTotal(Number(json.total || 0));
      setTotalPages(Math.max(1, Number(json.totalPages || 1)));
    } catch (loadError: any) {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
      setError(
        loadError?.message || "Unable to load payment requests"
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        close();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, saving]);

  function doSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function open(row: Row, nextAction: Action | null) {
    setSelected(row);
    setAction(nextAction);
    setRemarks("");
    setUtr("");
    setPaidDate(todayIndia());
    setPaymentMode(
      PAYMENT_MODES.includes(
        String(row.PaymentMode || "").toUpperCase() as any
      )
        ? String(row.PaymentMode).toUpperCase()
        : "NEFT"
    );
    setError("");
    setSuccess("");
  }

  function close() {
    if (saving) {
      return;
    }

    setSelected(null);
    setAction(null);
    setRemarks("");
    setUtr("");
    setPaymentMode("NEFT");
  }

  async function submit() {
    if (!selected || !action) {
      return;
    }

    if (action === "REJECT" && !remarks.trim()) {
      setError("Rejection reason is required");
      return;
    }

    if (action === "PAID" && !utr.trim()) {
      setError("UTR number is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/payment-requests",
        {
          method: "PATCH",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requestId: selected.Id,
            action,
            adminRemarks: remarks,
            utr,
            paidDate,
            paymentMode,
          }),
        }
      );

      const json: ApiResponse = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(
          json.error || "Unable to update settlement request"
        );
      }

      setSuccess(json.message || "Payment request updated");
      setSelected(null);
      setAction(null);
      await load();
    } catch (submitError: any) {
      setError(
        submitError?.message || "Unable to update settlement request"
      );
    } finally {
      setSaving(false);
    }
  }

  const modalTitle = useMemo(() => {
    if (action === "APPROVE") {
      return "Approve Payment Request";
    }

    if (action === "REJECT") {
      return "Reject Payment Request";
    }

    if (action === "PAID") {
      return "Mark Payment Paid";
    }

    return "Payment Request Details";
  }, [action]);

  const liveBalance = selected
    ? numberValue(
        selected.LiveCurrentBalance ?? selected.CurrentBalance
      )
    : 0;

  const requestBalance = selected
    ? numberValue(
        selected.BalanceAtRequest ?? selected.CurrentBalance
      )
    : 0;

  const availableAtRequest = selected
    ? numberValue(
        selected.AvailableBalanceAtRequest ??
          selected.AvailableBalanceBeforeRequest
      )
    : 0;

  return (
    <div className="p-4">
      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_180px_110px]">
        <form onSubmit={doSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Request No, Restro Code, Name or UTR"
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
          />

          <button
            type="submit"
            className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-black text-white"
          >
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Paid">Paid</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={pageSize}
          onChange={(event) => {
            setPageSize(Number(event.target.value));
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
        >
          {[20, 50, 100, 500].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[1080px] w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Request",
                "Restaurant",
                "Amount",
                "Balance",
                "Status",
                "Date",
                "Actions",
              ].map((title) => (
                <th
                  key={title}
                  className="border-b border-slate-200 px-3 py-3 text-[10px] font-black uppercase text-slate-500"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-14 text-center font-bold text-slate-400"
                >
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-14 text-center font-bold text-slate-400"
                >
                  No payment request found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={String(row.Id)}
                  className="border-b border-slate-100 align-top"
                >
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => open(row, null)}
                      className="text-xs font-black text-blue-700 hover:underline"
                    >
                      {row.RequestNo || `#${row.Id}`}
                    </button>
                  </td>

                  <td className="px-3 py-3 text-xs font-black">
                    {row.RestroCode} / {row.RestroName || "-"}
                  </td>

                  <td className="px-3 py-3 text-sm font-black">
                    ₹{money(row.Amount)}
                  </td>

                  <td className="px-3 py-3 text-xs">
                    <b>
                      Current ₹
                      {money(
                        row.LiveCurrentBalance ?? row.CurrentBalance
                      )}
                    </b>

                    <div className="mt-1 text-slate-400">
                      At Request ₹
                      {money(
                        row.BalanceAtRequest ?? row.CurrentBalance
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-black ${statusClass(
                        row.Status
                      )}`}
                    >
                      {row.Status}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-xs text-slate-500">
                    {row.RequestDateFormatted || "-"}
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {row.Status === "Pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => open(row, "APPROVE")}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black text-white"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => open(row, "REJECT")}
                            className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      {row.Status === "Approved" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => open(row, "PAID")}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white"
                          >
                            Mark Paid
                          </button>

                          <button
                            type="button"
                            onClick={() => open(row, "REJECT")}
                            className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => open(row, null)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-black"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between">
        <div className="text-xs font-bold text-slate-500">
          Total {total} • Page {page} of {totalPages}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() =>
              setPage((current) =>
                Math.min(totalPages, current + 1)
              )
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {selected ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={close}
        >
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  {modalTitle}
                </h2>

                <p className="mt-1 text-xs font-bold text-blue-700">
                  {selected.RequestNo || `#${selected.Id}`}
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-black"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailBox
                  label="Restaurant"
                  value={`${selected.RestroCode} / ${
                    selected.RestroName || "-"
                  }`}
                  tone="blue"
                />

                <DetailBox
                  label="Requested Amount"
                  value={selected.Amount}
                  moneyValue
                  tone="emerald"
                />

                <DetailBox
                  label="Status"
                  value={selected.Status}
                  tone={
                    selected.Status === "Paid"
                      ? "emerald"
                      : selected.Status === "Rejected"
                      ? "red"
                      : selected.Status === "Approved"
                      ? "blue"
                      : "amber"
                  }
                />

                <DetailBox
                  label="Request Date"
                  value={selected.RequestDateFormatted}
                />
              </section>

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-black text-slate-950">
                  Balance Details
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailBox
                    label="Balance At Request"
                    value={requestBalance}
                    moneyValue
                  />

                  <DetailBox
                    label="Available At Request"
                    value={availableAtRequest}
                    moneyValue
                  />

                  <DetailBox
                    label="Current Live Balance"
                    value={liveBalance}
                    moneyValue
                    tone="emerald"
                  />

                  <DetailBox
                    label="Pending Before Request"
                    value={selected.PendingAmountBeforeRequest}
                    moneyValue
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-black text-slate-950">
                  Payment & Bank Details
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailBox
                    label="Payment Mode"
                    value={selected.PaymentMode}
                  />

                  <DetailBox
                    label="UTR"
                    value={selected.UTR}
                  />

                  <DetailBox
                    label="Bank Name"
                    value={selected.BankName}
                  />

                  <DetailBox
                    label="Account No."
                    value={maskAccount(selected.AccountNo)}
                  />

                  <DetailBox
                    label="IFSC"
                    value={selected.IFSC}
                  />

                  <DetailBox
                    label="Restro RDS ID"
                    value={selected.LedgerRDSId}
                  />

                  <DetailBox
                    label="RE RDS ID"
                    value={selected.RERDSId}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-black text-slate-950">
                  Status Timeline
                </h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailBox
                    label="Approved Date"
                    value={selected.ApprovedDateFormatted}
                  />

                  <DetailBox
                    label="Approved By"
                    value={selected.ApprovedBy}
                  />

                  <DetailBox
                    label="Paid Date"
                    value={selected.PaidDateFormatted}
                  />

                  <DetailBox
                    label="Paid By"
                    value={selected.PaidBy}
                  />

                  <DetailBox
                    label="Rejected Date"
                    value={selected.RejectedDateFormatted}
                  />

                  <DetailBox
                    label="Rejected By"
                    value={selected.RejectedBy}
                  />

                  <DetailBox
                    label="Last Updated"
                    value={selected.UpdatedAtFormatted}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 p-4">
                <h3 className="text-sm font-black text-slate-950">
                  Remarks
                </h3>

                <div className="mt-3 space-y-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[9px] font-black uppercase text-slate-400">
                      Vendor Remarks
                    </div>

                    <div className="mt-1 font-semibold text-slate-700">
                      {selected.VendorRemarks || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-[9px] font-black uppercase text-slate-400">
                      Admin Remarks
                    </div>

                    <div className="mt-1 font-semibold text-slate-700">
                      {selected.AdminRemarks || "-"}
                    </div>
                  </div>
                </div>
              </section>

              {action ? (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-[10px] font-black uppercase text-slate-500">
                    Admin Remarks {action === "REJECT" ? "*" : ""}
                  </label>

                  <textarea
                    value={remarks}
                    onChange={(event) =>
                      setRemarks(event.target.value.slice(0, 500))
                    }
                    rows={3}
                    placeholder={
                      action === "REJECT"
                        ? "Rejection reason *"
                        : "Optional admin remarks"
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />

                  <div className="mt-1 text-right text-[9px] font-bold text-slate-400">
                    {remarks.length}/500
                  </div>

                  {action === "PAID" ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">
                          Payment Mode *
                        </label>

                        <select
                          value={paymentMode}
                          onChange={(event) =>
                            setPaymentMode(event.target.value)
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500"
                        >
                          {PAYMENT_MODES.map((mode) => (
                            <option key={mode} value={mode}>
                              {mode}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">
                          UTR / Reference *
                        </label>

                        <input
                          value={utr}
                          onChange={(event) =>
                            setUtr(event.target.value.slice(0, 100))
                          }
                          placeholder="Enter UTR"
                          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500">
                          Payment Date *
                        </label>

                        <input
                          type="date"
                          value={paidDate}
                          onChange={(event) =>
                            setPaidDate(event.target.value)
                          }
                          className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {action ? (
                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className={[
                    "h-11 w-full rounded-xl text-sm font-black text-white disabled:opacity-50",
                    action === "APPROVE"
                      ? "bg-blue-600"
                      : action === "REJECT"
                      ? "bg-red-600"
                      : "bg-emerald-600",
                  ].join(" ")}
                >
                  {saving
                    ? "Saving..."
                    : action === "APPROVE"
                    ? "Confirm Approve"
                    : action === "REJECT"
                    ? "Confirm Reject"
                    : "Confirm Payment Paid"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
