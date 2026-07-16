"use client";

// components/restro-route-tabs/AccountingDashboardClient.tsx

import Link from "next/link";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

type Props = {
  restroCode:
    string | number;
};

type ApiResponse = {
  ok: boolean;
  restro?: any;
  period?: {
    from: string;
    to: string;
  };
  summary?: any;
  lastTransaction?: any;
  lastSettlement?: any;
  generatedAt?: string | null;
  error?: string;
};

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

  const match =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) {
    return text || "-";
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

function Card({
  label,
  value,
  sub,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={[
        "rounded-xl border p-4 shadow-sm",
        className,
      ].join(" ")}
    >
      <div className="text-xs font-bold uppercase tracking-wide opacity-80">
        {label}
      </div>

      <div
        className={[
          "mt-2 text-2xl font-extrabold",
          valueClassName ||
            "",
        ].join(" ")}
      >
        {value}
      </div>

      {sub ? (
        <div className="mt-1 text-xs font-semibold opacity-70">
          {sub}
        </div>
      ) : null}
    </div>
  );
}

export default function AccountingDashboardClient({
  restroCode,
}: Props) {
  const code =
    String(
      restroCode ?? ""
    ).trim();

  const [
    data,
    setData,
  ] =
    useState<ApiResponse | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const loadData =
    useCallback(
      async () => {
        if (!code) {
          setError(
            "Invalid RestroCode"
          );
          setLoading(
            false
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
          const response =
            await fetch(
              `/api/restros/${encodeURIComponent(
                code
              )}/accounting`,
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
              "Unable to load accounting dashboard"
            );
          }

          setData(
            json
          );
        } catch (
          loadError: any
        ) {
          setData(
            null
          );

          setError(
            loadError
              ?.message ||
            "Unable to load accounting dashboard"
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
    loadData();
  }, [
    loadData,
  ]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
        Loading accounting dashboard...
      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
        {error ||
          "Unable to load accounting dashboard"}
      </div>
    );
  }

  const restro =
    data.restro ||
    {};

  const summary =
    data.summary ||
    {};

  const lastTransaction =
    data.lastTransaction ||
    null;

  const lastSettlement =
    data.lastSettlement ||
    null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-blue-50 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Restaurant Accounting
          </div>

          <div className="mt-2 text-xl font-extrabold text-slate-950">
            {restro.RestroCode ??
              code}
            {restro.RestroName
              ? ` / ${restro.RestroName}`
              : ""}
          </div>

          <div className="mt-1 text-sm font-semibold text-slate-600">
            {[
              restro.StationCode,
              restro.StationName,
              restro.State,
            ]
              .filter(
                Boolean
              )
              .join(
                " - "
              ) ||
              "-"}
          </div>

          <div className="mt-2 text-xs font-medium text-slate-500">
            Current Month:{" "}
            {formatDate(
              data.period?.from
            )}{" "}
            to{" "}
            {formatDate(
              data.period?.to
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={
            loadData
          }
          className="h-10 rounded-lg border border-blue-300 bg-white px-4 text-sm font-bold text-blue-700 hover:bg-blue-100"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          label="Current Balance"
          value={`₹${formatMoney(
            summary.currentBalance
          )}`}
          sub="Latest RestroRDS balance"
          className="border-slate-200 bg-slate-50 text-slate-800"
          valueClassName={
            balanceClass(
              summary.currentBalance
            )
          }
        />

        <Card
          label="This Month Orders"
          value={
            summary.orderCount ??
            0
          }
          sub={`Business ₹${formatMoney(
            summary.totalBusiness
          )}`}
          className="border-blue-200 bg-blue-50 text-blue-700"
        />

        <Card
          label="Payment Paid"
          value={`₹${formatMoney(
            summary.paymentPaidAmount
          )}`}
          sub={`${summary.paymentPaidCount ?? 0} entries`}
          className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
        />

        <Card
          label="Payment Received"
          value={`₹${formatMoney(
            summary.paymentReceivedAmount
          )}`}
          sub={`${summary.paymentReceivedCount ?? 0} entries`}
          className="border-cyan-200 bg-cyan-50 text-cyan-700"
        />

        <Card
          label="Credit Notes"
          value={`₹${formatMoney(
            summary.creditNoteAmount
          )}`}
          sub={`${summary.creditNoteCount ?? 0} entries`}
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        />

        <Card
          label="Debit Notes"
          value={`₹${formatMoney(
            summary.debitNoteAmount
          )}`}
          sub={`${summary.debitNoteCount ?? 0} entries`}
          className="border-red-200 bg-red-50 text-red-700"
        />

        <Card
          label="Net Settlement"
          value={`₹${formatMoney(
            summary.netSettlement
          )}`}
          sub="Received - Paid"
          className="border-violet-200 bg-violet-50 text-violet-700"
          valueClassName={
            balanceClass(
              summary.netSettlement
            )
          }
        />

        <Card
          label="Generated At"
          value={
            data.generatedAt ||
            "-"
          }
          sub="Asia/Kolkata"
          className="border-amber-200 bg-amber-50 text-amber-800"
          valueClassName="text-base"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-extrabold text-slate-950">
            Last Transaction
          </div>

          {lastTransaction ? (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Reference
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {lastTransaction.OrderId ||
                    "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Entry Source
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {lastTransaction.EntrySource ||
                    "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Settlement Effect
                </div>

                <div
                  className={[
                    "mt-1 font-extrabold",
                    balanceClass(
                      lastTransaction.SettlementAmount
                    ),
                  ].join(" ")}
                >
                  ₹{formatMoney(
                    lastTransaction.SettlementAmount
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Current Balance
                </div>

                <div
                  className={[
                    "mt-1 font-extrabold",
                    balanceClass(
                      lastTransaction.CurrentBal
                    ),
                  ].join(" ")}
                >
                  ₹{formatMoney(
                    lastTransaction.CurrentBal
                  )}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-xs font-semibold text-slate-500">
                  Created At
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {lastTransaction.CreatedAtFormatted ||
                    lastTransaction.CreatedAt ||
                    "-"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm font-semibold text-slate-400">
              No transaction found
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-extrabold text-slate-950">
            Last Settlement
          </div>

          {lastSettlement ? (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Settlement ID
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {lastSettlement.SettlementId ||
                    "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Type
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {lastSettlement.SettlementType ||
                    "-"}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Amount
                </div>

                <div className="mt-1 font-extrabold text-slate-900">
                  ₹{formatMoney(
                    lastSettlement.Amount
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500">
                  Payment Mode
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {lastSettlement.PaymentMode ||
                    "-"}
                </div>
              </div>

              <div className="col-span-2">
                <div className="text-xs font-semibold text-slate-500">
                  Created At
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  {lastSettlement.CreatedAtFormatted ||
                    lastSettlement.CreatedAt ||
                    "-"}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm font-semibold text-slate-400">
              No settlement found
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-extrabold text-slate-950">
          Quick Actions
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/admin/restros/${encodeURIComponent(
              code
            )}/statement`}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            View Statement
          </Link>

          <Link
            href={`/admin/restros/${encodeURIComponent(
              code
            )}/edit/settlement`}
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
          >
            Add Settlement
          </Link>

          <Link
            href={`/admin/restros/${encodeURIComponent(
              code
            )}/edit/credit-debit-note`}
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Credit / Debit Note
          </Link>

          <Link
            href={`/admin/restro-rds?restroCode=${encodeURIComponent(
              code
            )}`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Restro RDS
          </Link>
        </div>
      </div>
    </div>
  );
}
