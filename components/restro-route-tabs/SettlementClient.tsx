// components/restro-route-tabs/SettlementClient.tsx
"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type RestroInfo = {
  RestroCode: number | string;
  RestroName: string | null;
  StationCode: string | null;
  StationName: string | null;
};

type SettlementRow = {
  SettlementId: number | string | null;
  RestroCode: number | string | null;
  RestroName: string | null;
  StationCode: string | null;
  SettlementType: string | null;
  Amount: number | string | null;
  PaymentDate: string | null;
  PaymentMode: string | null;
  BankName: string | null;
  UTR: string | null;
  ReferenceNo: string | null;
  Remarks: string | null;
  RestroRDSId: number | string | null;
  RERDSId: number | string | null;
  CreatedBy: string | null;
  CreatedAt: string | null;
  CreatedAtFormatted?: string | null;
  UpdatedAt: string | null;
};

type GetResponse = {
  ok: boolean;
  restro?: RestroInfo;
  currentBalance?: number;
  lastRdsAt?: string | null;
  lastRdsAtFormatted?: string | null;
  settlements?: SettlementRow[];
  error?: string;
};

type PostResponse = {
  ok: boolean;
  message?: string;
  settlement?: {
    settlementId?: number | string | null;
    referenceId?: string | null;
    settlementType?: string | null;
    amount?: number;
    restroSettlementAmount?: number;
    previousBalance?: number;
    currentBalance?: number;
    restroRdsId?: number | string | null;
    reRdsId?: number | string | null;
    paymentDate?: string | null;
    paymentMode?: string | null;
    bankName?: string | null;
    utr?: string | null;
    referenceNo?: string | null;
    remarks?: string | null;
    createdBy?: string | null;
  };
  error?: string;
};

type Props = {
  restroCode: string | number;
  currentUserName?: string | null;
};

type FormState = {
  paymentDate: string;
  amount: string;
  paymentMode: string;
  bankName: string;
  utr: string;
  referenceNo: string;
  remarks: string;
};

const PAYMENT_MODES = [
  "NEFT",
  "RTGS",
  "IMPS",
  "UPI",
  "BANK TRANSFER",
  "CHEQUE",
  "CASH",
];

function getIndiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function textValue(value: unknown) {
  return value === null || value === undefined
    ? ""
    : String(value).trim();
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

function formatDate(value: unknown) {
  const text = textValue(value);

  if (!text) {
    return "-";
  }

  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return text;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function balanceClass(value: unknown) {
  const amount = numberValue(value);

  if (amount > 0) {
    return "text-emerald-700";
  }

  if (amount < 0) {
    return "text-red-700";
  }

  return "text-slate-900";
}

function settlementTypeLabel(value: unknown) {
  const key = textValue(value)
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (key === "paymentpaid") {
    return "Payment Paid";
  }

  if (key === "paymentreceived") {
    return "Payment Received";
  }

  return textValue(value) || "-";
}

function settlementTypeClass(value: unknown) {
  const key = textValue(value)
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  if (key === "paymentpaid") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (key === "paymentreceived") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function SettlementClient({
  restroCode,
  currentUserName = null,
}: Props) {
  const code = String(restroCode ?? "").trim();

  const [restro, setRestro] =
    useState<RestroInfo | null>(null);

  const [currentBalance, setCurrentBalance] =
    useState(0);

  const [lastRdsAt, setLastRdsAt] =
    useState<string | null>(null);

  const [settlements, setSettlements] =
    useState<SettlementRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [exporting, setExporting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<FormState>({
      paymentDate: getIndiaToday(),
      amount: "",
      paymentMode: "NEFT",
      bankName: "",
      utr: "",
      referenceNo: "",
      remarks: "",
    });

  const isCash =
    form.paymentMode === "CASH";

  const loadData = useCallback(async () => {
    if (!code) {
      setError("Invalid RestroCode");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/restros/${encodeURIComponent(
          code
        )}/settlement`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const json: GetResponse =
        await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(
          json.error ||
            "Unable to load settlement details"
        );
      }

      setRestro(json.restro ?? null);

      setCurrentBalance(
        Number(json.currentBalance ?? 0)
      );

      setLastRdsAt(
        json.lastRdsAtFormatted ??
          json.lastRdsAt ??
          null
      );

      setSettlements(
        Array.isArray(json.settlements)
          ? json.settlements
          : []
      );
    } catch (loadError: any) {
      setRestro(null);
      setCurrentBalance(0);
      setLastRdsAt(null);
      setSettlements([]);
      setError(
        loadError?.message ||
          "Unable to load settlement details"
      );
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError(null);
    setSuccess(null);
  }

  const enteredAmount = useMemo(
    () =>
      numberValue(
        form.amount.replace(/,/g, "")
      ),
    [form.amount]
  );

  const estimatedBalance = useMemo(
    () =>
      Math.round(
        (currentBalance - enteredAmount) *
          100
      ) / 100,
    [currentBalance, enteredAmount]
  );

  const totalSettlementAmount =
    useMemo(
      () =>
        settlements.reduce(
          (
            total,
            row
          ) =>
            total +
            numberValue(
              row.Amount
            ),
          0
        ),
      [
        settlements,
      ]
    );

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
      const response =
        await fetch(
          `/api/restros/${encodeURIComponent(
            code
          )}/settlement/export`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      if (
        !response.ok
      ) {
        let message =
          "Unable to export settlement history";

        try {
          const errorJson =
            await response.json();

          message =
            errorJson?.error ||
            message;
        } catch {
          // Keep default error.
        }

        throw new Error(
          message
        );
      }

      const blob =
        await response.blob();

      const disposition =
        response.headers.get(
          "content-disposition"
        ) || "";

      const fileMatch =
        disposition.match(
          /filename="?([^"]+)"?/i
        );

      const fileName =
        fileMatch
          ? fileMatch[1]
          : `Settlement-${code}.xlsx`;

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
        exportError?.message ||
        "Unable to export settlement history"
      );
    } finally {
      setExporting(
        false
      );
    }
  }

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const amount = Number(
      form.amount
        .replace(/,/g, "")
        .replace(/[^\d.-]/g, "")
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Amount must be greater than 0"
      );
      return;
    }

    if (!form.paymentDate) {
      setError("Payment Date is required");
      return;
    }

    if (!form.paymentMode) {
      setError("Payment Mode is required");
      return;
    }

    if (
      !isCash &&
      !form.utr.trim() &&
      !form.referenceNo.trim()
    ) {
      setError(
        "UTR or Reference Number is required for non-cash settlement"
      );
      return;
    }

    const confirmMessage =
      `Confirm settlement payment of ₹${formatMoney(
        amount
      )} for Restro ${code}?`;

    if (
      typeof window !== "undefined" &&
      !window.confirm(confirmMessage)
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/restros/${encodeURIComponent(
          code
        )}/settlement`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            paymentDate:
              form.paymentDate,
            amount,
            paymentMode:
              form.paymentMode,
            bankName:
              form.bankName.trim() ||
              null,
            utr:
              form.utr.trim() || null,
            referenceNo:
              form.referenceNo.trim() ||
              null,
            remarks:
              form.remarks.trim() || null,
            createdBy:
              textValue(
                currentUserName
              ) || null,
          }),
        }
      );

      const json: PostResponse =
        await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(
          json.error ||
            "Unable to save settlement"
        );
      }

      setSuccess(
        json.message ||
          "Settlement saved successfully"
      );

      setForm({
        paymentDate: getIndiaToday(),
        amount: "",
        paymentMode: "NEFT",
        bankName: "",
        utr: "",
        referenceNo: "",
        remarks: "",
      });

      await loadData();
    } catch (saveError: any) {
      setError(
        saveError?.message ||
          "Unable to save settlement"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500">
        Loading settlement details...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Restaurant
            </div>

            <div className="mt-2 text-lg font-extrabold text-slate-950">
              {restro?.RestroCode ?? code}
              {restro?.RestroName
                ? ` / ${restro.RestroName}`
                : ""}
            </div>

            <div className="mt-1 text-sm font-semibold text-slate-600">
              {restro?.StationCode || "-"}
              {restro?.StationName
                ? ` — ${restro.StationName}`
                : ""}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Current Outstanding
            </div>

            <div
              className={[
                "mt-2 text-3xl font-extrabold",
                balanceClass(
                  currentBalance
                ),
              ].join(" ")}
            >
              ₹{formatMoney(currentBalance)}
            </div>

            <div className="mt-2 text-xs font-medium text-slate-500">
              Last ledger entry:{" "}
              {lastRdsAt || "-"}
            </div>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-violet-600">
              Balance After This Settlement
            </div>

            <div
              className={[
                "mt-2 text-2xl font-extrabold",
                balanceClass(
                  estimatedBalance
                ),
              ].join(" ")}
            >
              ₹{formatMoney(
                estimatedBalance
              )}
            </div>

            <div className="mt-2 text-xs font-medium text-slate-500">
              Preview only. Final balance SQL transaction se calculate hoga.
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-5">
            <h2 className="text-lg font-extrabold text-slate-950">
              Add Settlement
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Restaurant payout save hote hi RestroRDS aur RERDS dono update honge.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Payment Date
              </label>

              <input
                type="date"
                value={form.paymentDate}
                onChange={(event) =>
                  updateField(
                    "paymentDate",
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Amount
              </label>

              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) =>
                  updateField(
                    "amount",
                    event.target.value
                      .replace(/[^\d.]/g, "")
                      .replace(
                        /(\..*)\./g,
                        "$1"
                      )
                  )
                }
                placeholder="0.00"
                className="search-pill-sm w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Payment Mode
              </label>

              <select
                value={form.paymentMode}
                onChange={(event) =>
                  updateField(
                    "paymentMode",
                    event.target.value
                  )
                }
                className="search-pill-sm w-full"
              >
                {PAYMENT_MODES.map(
                  (mode) => (
                    <option
                      key={mode}
                      value={mode}
                    >
                      {mode}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Bank Name
              </label>

              <input
                type="text"
                value={form.bankName}
                onChange={(event) =>
                  updateField(
                    "bankName",
                    event.target.value
                  )
                }
                placeholder="Example: HDFC Bank"
                className="search-pill-sm w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                UTR
                {!isCash ? (
                  <span className="ml-1 text-red-600">
                    *
                  </span>
                ) : null}
              </label>

              <input
                type="text"
                value={form.utr}
                onChange={(event) =>
                  updateField(
                    "utr",
                    event.target.value
                      .toUpperCase()
                      .replace(/\s+/g, "")
                  )
                }
                placeholder={
                  isCash
                    ? "Optional for cash"
                    : "Bank transaction UTR"
                }
                className="search-pill-sm w-full"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Reference Number
              </label>

              <input
                type="text"
                value={form.referenceNo}
                onChange={(event) =>
                  updateField(
                    "referenceNo",
                    event.target.value
                  )
                }
                placeholder="Cheque / internal reference"
                className="search-pill-sm w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Remarks
              </label>

              <textarea
                value={form.remarks}
                onChange={(event) =>
                  updateField(
                    "remarks",
                    event.target.value
                  )
                }
                rows={3}
                placeholder="Settlement remarks..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 min-w-[180px] items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving Settlement..."
                : "Save Settlement"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">
              Settlement History
            </h2>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Latest 50 settlement entries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={
                handleExportExcel
              }
              disabled={
                loading ||
                saving ||
                exporting
              }
              className="h-10 rounded-lg border border-emerald-300 bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting
                ? "Exporting..."
                : "Export Excel"}
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={loading || saving}
              className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs font-semibold text-slate-500">
              Current Outstanding
            </div>

            <div
              className={[
                "mt-1 text-lg font-extrabold",
                balanceClass(
                  currentBalance
                ),
              ].join(" ")}
            >
              ₹{formatMoney(
                currentBalance
              )}
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-600">
              Total Settlements
            </div>

            <div className="mt-1 text-lg font-extrabold text-blue-700">
              {settlements.length}
            </div>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="text-xs font-semibold text-red-600">
              Total Amount Paid
            </div>

            <div className="mt-1 text-lg font-extrabold text-red-700">
              ₹{formatMoney(
                totalSettlementAmount
              )}
            </div>
          </div>

          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
            <div className="text-xs font-semibold text-violet-600">
              Last Settlement Date
            </div>

            <div className="mt-1 text-lg font-extrabold text-violet-700">
              {settlements.length > 0
                ? formatDate(
                    settlements[0]
                      .PaymentDate
                  )
                : "-"}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left text-xs font-bold text-slate-700">
                <th className="border-b border-r px-3 py-3">
                  Settlement ID
                </th>
                <th className="border-b border-r px-3 py-3">
                  Date
                </th>
                <th className="border-b border-r px-3 py-3">
                  Type
                </th>
                <th className="border-b border-r px-3 py-3 text-right">
                  Amount
                </th>
                <th className="border-b border-r px-3 py-3">
                  Mode
                </th>
                <th className="border-b border-r px-3 py-3">
                  Bank
                </th>
                <th className="border-b border-r px-3 py-3">
                  UTR
                </th>
                <th className="border-b border-r px-3 py-3">
                  Reference
                </th>
                <th className="border-b border-r px-3 py-3">
                  Restro RDS
                </th>
                <th className="border-b border-r px-3 py-3">
                  RE RDS
                </th>
                <th className="border-b border-r px-3 py-3">
                  Created At
                </th>
                <th className="border-b px-3 py-3">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody>
              {settlements.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-sm font-semibold text-slate-400"
                  >
                    No settlement records found
                  </td>
                </tr>
              ) : (
                settlements.map(
                  (row, index) => (
                    <tr
                      key={`${row.SettlementId}-${index}`}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50"
                      }
                    >
                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-800">
                        {textValue(
                          row.SettlementId
                        ) || "-"}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {formatDate(
                          row.PaymentDate
                        )}
                      </td>

                      <td className="border-b border-r px-3 py-3">
                        <span
                          className={[
                            "inline-flex rounded border px-2 py-1 text-xs font-bold",
                            settlementTypeClass(
                              row.SettlementType
                            ),
                          ].join(" ")}
                        >
                          {settlementTypeLabel(
                            row.SettlementType
                          )}
                        </span>
                      </td>

                      <td className="border-b border-r px-3 py-3 text-right text-xs font-extrabold text-red-700">
                        ₹{formatMoney(
                          row.Amount
                        )}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {textValue(
                          row.PaymentMode
                        ) || "-"}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {textValue(
                          row.BankName
                        ) || "-"}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {textValue(
                          row.UTR
                        ) || "-"}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {textValue(
                          row.ReferenceNo
                        ) || "-"}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {textValue(
                          row.RestroRDSId
                        ) || "-"}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {textValue(
                          row.RERDSId
                        ) || "-"}
                      </td>

                      <td className="border-b border-r px-3 py-3 text-xs font-semibold text-slate-700">
                        {row.CreatedAtFormatted ||
                          textValue(
                            row.CreatedAt
                          ) ||
                          "-"}
                      </td>

                      <td
                        title={
                          textValue(
                            row.Remarks
                          ) || "-"
                        }
                        className="max-w-[260px] border-b px-3 py-3 text-xs font-semibold text-slate-700"
                      >
                        <span className="block truncate">
                          {textValue(
                            row.Remarks
                          ) || "-"}
                        </span>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
