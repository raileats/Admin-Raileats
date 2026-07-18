"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Row = {
  Id: number | string;
  RequestNo: string | null;
  RestroCode: number | string;
  RestroName: string | null;
  Amount: number;
  PaymentDate: string;
  PaymentMode: string;
  BankName: string | null;
  UTR: string;
  ReferenceNo: string | null;
  ScreenshotUrl: string | null;
  Status: string;
  VendorRemarks: string | null;
  AdminRemarks: string | null;
  RequestedAtFormatted: string | null;
  ReceivedAtFormatted: string | null;
  RejectedAtFormatted: string | null;
  LedgerRDSId: number | string | null;
  RERDSId: number | string | null;
};

type Action = "RECEIVED" | "REJECT";

function money(value: unknown) {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function statusClass(status: string) {
  if (status === "Received") return "bg-emerald-100 text-emerald-800";
  if (status === "Rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export default function PaymentRequestsTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Requested");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const q = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (status) q.set("status", status);
      if (search) q.set("search", search);

      const response = await fetch(
        `/api/admin/deposited-update?${q.toString()}`,
        { cache: "no-store" }
      );

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Unable to load deposit updates");
      }

      setRows(Array.isArray(json.rows) ? json.rows : []);
      setTotalPages(Math.max(1, Number(json.totalPages || 1)));
    } catch (e: any) {
      setRows([]);
      setError(e?.message || "Unable to load deposit updates");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  function doSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function open(row: Row, nextAction: Action | null) {
    setSelected(row);
    setAction(nextAction);
    setRemarks("");
    setError("");
  }

  async function submit() {
    if (!selected || !action) return;

    if (action === "REJECT" && !remarks.trim()) {
      setError("Rejection reason is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/deposited-update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selected.Id,
          action,
          adminRemarks: remarks,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.error || "Unable to update payment request");
      }

      setSuccess(json.message || "Deposit update updated");
      setSelected(null);
      setAction(null);
      await load();
    } catch (e: any) {
      setError(e?.message || "Unable to update payment request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_190px]">
        <form onSubmit={doSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Request, Restro, UTR or reference"
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <button className="rounded-xl bg-slate-900 px-4 text-xs font-black text-white">
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold"
        >
          <option value="">All Status</option>
          <option>Requested</option>
          <option>Received</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-[1100px] w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              {[
                "Request",
                "Restaurant",
                "Amount",
                "UTR",
                "Mode",
                "Date",
                "Status",
                "Actions",
              ].map((title) => (
                <th
                  key={title}
                  className="border-b px-3 py-3 text-[10px] font-black uppercase text-slate-500"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-14 text-center font-bold text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center font-bold text-slate-400">
                  No deposit update found
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={String(row.Id)} className="border-b align-top">
                  <td className="px-3 py-3 text-xs font-black text-blue-700">
                    {row.RequestNo || `#${row.Id}`}
                  </td>
                  <td className="px-3 py-3 text-xs font-black">
                    {row.RestroCode} / {row.RestroName || "-"}
                  </td>
                  <td className="px-3 py-3 text-sm font-black">
                    ₹{money(row.Amount)}
                  </td>
                  <td className="px-3 py-3 text-xs font-bold">{row.UTR}</td>
                  <td className="px-3 py-3 text-xs font-bold">{row.PaymentMode}</td>
                  <td className="px-3 py-3 text-xs">{row.PaymentDate}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-lg px-2 py-1 text-[10px] font-black ${statusClass(row.Status)}`}>
                      {row.Status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      {row.Status === "Requested" ? (
                        <>
                          <button
                            onClick={() => open(row, "RECEIVED")}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-black text-white"
                          >
                            Yes Received
                          </button>
                          <button
                            onClick={() => open(row, "REJECT")}
                            className="rounded-lg bg-red-600 px-3 py-2 text-[10px] font-black text-white"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      <button
                        onClick={() => open(row, null)}
                        className="rounded-lg border px-3 py-2 text-[10px] font-black"
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

      <div className="mt-4 flex justify-end gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40"
        >
          Previous
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border px-3 py-2 text-xs font-black disabled:opacity-40"
        >
          Next
        </button>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-black">
                  {action === "RECEIVED"
                    ? "Confirm Deposit Received"
                    : action === "REJECT"
                    ? "Reject Deposit Update"
                    : "Deposit Update Details"}
                </h2>
                <div className="text-xs font-bold text-blue-700">
                  {selected.RequestNo}
                </div>
              </div>
              <button
                onClick={() => {
                  if (!saving) {
                    setSelected(null);
                    setAction(null);
                  }
                }}
                className="rounded-lg border px-3 py-2 text-xs font-black"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <small>Restaurant</small>
                  <div className="font-black">
                    {selected.RestroCode} / {selected.RestroName}
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <small>Amount</small>
                  <div className="text-lg font-black text-emerald-700">
                    ₹{money(selected.Amount)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <small>UTR</small>
                  <div className="break-all font-black">{selected.UTR}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <small>Mode / Date</small>
                  <div className="font-black">
                    {selected.PaymentMode} / {selected.PaymentDate}
                  </div>
                </div>
              </div>

              {selected.ScreenshotUrl ? (
                <a
                  href={selected.ScreenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-blue-200 bg-blue-50 p-3 text-center text-sm font-black text-blue-700"
                >
                  Open Payment Screenshot / PDF
                </a>
              ) : null}

              <div className="rounded-xl border p-3 text-sm">
                <div><b>Vendor Remarks:</b> {selected.VendorRemarks || "-"}</div>
                <div className="mt-2"><b>Admin Remarks:</b> {selected.AdminRemarks || "-"}</div>
                <div className="mt-2"><b>Restro RDS ID:</b> {selected.LedgerRDSId || "-"}</div>
                <div className="mt-2"><b>RE RDS ID:</b> {selected.RERDSId || "-"}</div>
              </div>

              {action ? (
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder={
                    action === "REJECT"
                      ? "Rejection reason *"
                      : "Optional confirmation remarks"
                  }
                  className="w-full rounded-xl border px-3 py-3 text-sm"
                />
              ) : null}

              {action ? (
                <button
                  onClick={submit}
                  disabled={saving}
                  className={`h-11 w-full rounded-xl text-sm font-black text-white disabled:opacity-50 ${
                    action === "RECEIVED" ? "bg-emerald-600" : "bg-red-600"
                  }`}
                >
                  {saving
                    ? "Saving..."
                    : action === "RECEIVED"
                    ? "Yes, Deposit Received"
                    : "Confirm Reject"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
