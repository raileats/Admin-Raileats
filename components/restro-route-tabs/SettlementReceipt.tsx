// components/restro-route-tabs/SettlementReceipt.tsx
"use client";

import React, {
  useEffect,
  useState,
} from "react";

type Props = {
  restroCode:
    string | number;
  settlementId:
    string | number;
};

type ReceiptData = {
  ok: boolean;
  receiptNumber?: string;
  generatedAt?: string | null;
  settlement?: any;
  restro?: any;
  ledger?: any;
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

function typeLabel(
  value: unknown
) {
  const key =
    textValue(value)
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        ""
      );

  if (
    key ===
    "paymentreceived"
  ) {
    return "Payment Received from Restaurant";
  }

  if (
    key ===
    "paymentpaid"
  ) {
    return "Payment Paid to Restaurant";
  }

  return textValue(value) || "-";
}

function ReceiptField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-bold text-slate-900">
        {value || "-"}
      </div>
    </div>
  );
}

export default function SettlementReceipt({
  restroCode,
  settlementId,
}: Props) {
  const [
    data,
    setData,
  ] =
    useState<ReceiptData | null>(
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

  useEffect(() => {
    let active =
      true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response =
          await fetch(
            `/api/restros/${encodeURIComponent(
              String(
                restroCode
              )
            )}/settlement/receipt?settlementId=${encodeURIComponent(
              String(
                settlementId
              )
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const json:
          ReceiptData =
          await response
            .json();

        if (
          !response.ok ||
          !json.ok
        ) {
          throw new Error(
            json.error ||
            "Unable to load receipt"
          );
        }

        if (active) {
          setData(
            json
          );
        }
      } catch (
        loadError: any
      ) {
        if (active) {
          setError(
            loadError
              ?.message ||
            "Unable to load receipt"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [
    restroCode,
    settlementId,
  ]);

  if (loading) {
    return (
      <div className="p-10 text-center text-sm font-semibold text-slate-500">
        Loading receipt...
      </div>
    );
  }

  if (
    error ||
    !data
  ) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error ||
            "Receipt not found"}
        </div>
      </div>
    );
  }

  const settlement =
    data.settlement ||
    {};

  const restro =
    data.restro ||
    {};

  const ledger =
    data.ledger ||
    {};

  const isReceived =
    textValue(
      settlement
        .SettlementType
    )
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        ""
      ) ===
    "paymentreceived";

  const signedAmount =
    `${isReceived ? "+" : "-"}₹${formatMoney(
      settlement.Amount
    )}`;

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-4xl justify-end gap-2">
        <button
          type="button"
          onClick={() =>
            window.close()
          }
          className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700"
        >
          Close
        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white"
        >
          Print / Save PDF
        </button>
      </div>

      <article className="receipt-page mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-xl print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-slate-900 pb-5">
          <div>
            <div className="text-3xl font-black tracking-tight text-slate-950">
              RailEats
            </div>

            <div className="mt-1 text-sm font-semibold text-slate-500">
              Restaurant Settlement Receipt
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Receipt Number
            </div>

            <div className="mt-1 text-lg font-extrabold text-slate-950">
              {data.receiptNumber ||
                "-"}
            </div>

            <div className="mt-1 text-xs font-medium text-slate-500">
              Settlement ID:{" "}
              {settlement.SettlementId ||
                "-"}
            </div>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-slate-700">
              Restaurant Details
            </h2>

            <ReceiptField
              label="Restro Code"
              value={
                restro.RestroCode
              }
            />

            <ReceiptField
              label="Restro Name"
              value={
                restro.RestroName
              }
            />

            <ReceiptField
              label="Station"
              value={[
                restro.StationCode,
                restro.StationName,
                restro.State,
              ]
                .filter(
                  Boolean
                )
                .join(
                  " - "
                )}
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h2 className="mb-2 text-sm font-extrabold uppercase tracking-wide text-slate-700">
              Payment Details
            </h2>

            <ReceiptField
              label="Settlement Type"
              value={
                typeLabel(
                  settlement
                    .SettlementType
                )
              }
            />

            <ReceiptField
              label="Payment Date"
              value={
                formatDate(
                  settlement
                    .PaymentDate
                )
              }
            />

            <ReceiptField
              label="Payment Mode"
              value={
                settlement
                  .PaymentMode
              }
            />

            <ReceiptField
              label="Bank"
              value={
                settlement
                  .BankName
              }
            />

            <ReceiptField
              label="UTR"
              value={
                settlement.UTR
              }
            />

            <ReceiptField
              label="Reference Number"
              value={
                settlement
                  .ReferenceNo
              }
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl border-2 border-slate-900 p-5">
          <div className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Settlement Amount
          </div>

          <div
            className={[
              "mt-2 text-center text-4xl font-black",
              isReceived
                ? "text-emerald-700"
                : "text-red-700",
            ].join(" ")}
          >
            {signedAmount}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 p-4">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-700">
            Ledger Details
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ReceiptField
              label="Previous Balance"
              value={`₹${formatMoney(
                ledger.PreviousBal
              )}`}
            />

            <ReceiptField
              label="Settlement Effect"
              value={
                ledger.SettlementAmount !==
                  undefined &&
                ledger.SettlementAmount !==
                  null
                  ? `${numberValue(
                      ledger.SettlementAmount
                    ) >= 0
                      ? "+"
                      : "-"}₹${formatMoney(
                      Math.abs(
                        numberValue(
                          ledger.SettlementAmount
                        )
                      )
                    )}`
                  : signedAmount
              }
            />

            <ReceiptField
              label="Current Balance"
              value={`₹${formatMoney(
                ledger.CurrentBal
              )}`}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReceiptField
              label="Restro RDS ID"
              value={
                settlement
                  .RestroRDSId
              }
            />

            <ReceiptField
              label="RE RDS ID"
              value={
                settlement
                  .RERDSId
              }
            />
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Remarks
          </div>

          <div className="mt-2 whitespace-pre-wrap text-sm font-semibold text-amber-950">
            {settlement.Remarks ||
              "No remarks"}
          </div>
        </section>

        <footer className="mt-8 grid grid-cols-1 gap-6 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:grid-cols-2">
          <div>
            <div>
              Generated By:{" "}
              <strong className="text-slate-800">
                {settlement.CreatedBy ||
                  "Admin"}
              </strong>
            </div>

            <div className="mt-1">
              Generated On:{" "}
              <strong className="text-slate-800">
                {data.generatedAt ||
                  settlement.CreatedAtFormatted ||
                  "-"}
              </strong>
            </div>
          </div>

          <div className="text-right">
            <div className="font-semibold text-slate-700">
              For RailEats
            </div>

            <div className="mt-8 border-t border-slate-400 pt-1">
              Authorised Signatory
            </div>
          </div>
        </footer>
      </article>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .receipt-page {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
