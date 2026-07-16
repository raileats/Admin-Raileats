// app/admin/restros/[code]/edit/credit-debit-note/page.tsx
"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

type NoteType =
  | "CreditNote"
  | "DebitNote";

type RestroSummary = {
  RestroCode:
    | number
    | string;

  RestroName:
    string | null;

  StationCode:
    string | null;

  StationName:
    string | null;
};

type NoteRow = {
  RDSId:
    number | string | null;

  OrderId:
    string | null;

  EntrySource:
    string | null;

  Remarks:
    string | null;

  SettlementAmount:
    number | string | null;

  PreviousBal:
    number | string | null;

  CurrentBal:
    number | string | null;

  CreatedAt:
    string | null;
};

type GetResponse = {
  ok: boolean;

  restro?:
    RestroSummary;

  currentBalance?:
    number;

  lastRdsAt?:
    string | null;

  notes?:
    NoteRow[];

  error?:
    string;
};

type PostResponse = {
  ok: boolean;

  message?:
    string;

  restro?:
    RestroSummary;

  note?: {
    rdsId:
      number | string | null;

    referenceId:
      string | null;

    entrySource:
      string;

    amount:
      number;

    settlementAmount:
      number;

    previousBalance:
      number;

    currentBalance:
      number;

    remarks:
      string | null;
  };

  error?:
    string;

  data?:
    any;
};

type Props = {
  params: {
    code: string;
  };
};

/* =========================================================
   HELPERS
   ========================================================= */

function cleanText(
  value: unknown
) {
  return String(
    value ?? ""
  ).trim();
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

function formatIndiaDateTime(
  value: unknown
) {
  const text =
    cleanText(value);

  if (!text) {
    return "-";
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return text;
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone:
          "Asia/Kolkata",

        day:
          "2-digit",

        month:
          "2-digit",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",

        second:
          "2-digit",

        hour12:
          false,
      }
    ).formatToParts(date);

  const map:
    Record<string, string> =
    {};

  parts.forEach(
    (part) => {
      map[part.type] =
        part.value;
    }
  );

  return (
    `${map.day}-` +
    `${map.month}-` +
    `${map.year} ` +
    `${map.hour}:` +
    `${map.minute}:` +
    `${map.second}`
  );
}

function noteTypeLabel(
  value: unknown
) {
  const key =
    cleanText(value)
      .toLowerCase();

  if (
    key ===
    "creditnote"
  ) {
    return "Credit Note";
  }

  if (
    key ===
    "debitnote"
  ) {
    return "Debit Note";
  }

  return (
    cleanText(value) ||
    "-"
  );
}

function amountClass(
  value: unknown
) {
  const amount =
    numberValue(value);

  if (amount > 0) {
    return "text-emerald-700";
  }

  if (amount < 0) {
    return "text-red-700";
  }

  return "text-slate-700";
}

/* =========================================================
   PAGE
   ========================================================= */

export default function CreditDebitNotePage({
  params,
}: Props) {
  const searchParams =
    useSearchParams();

  const requestedReference =
    cleanText(
      searchParams?.get(
        "reference"
      )
    );

  const requestedRowRef =
    useRef<HTMLTableRowElement | null>(
      null
    );
  const restroCode =
    Number(params.code);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null
    );

  const [
    restro,
    setRestro,
  ] =
    useState<RestroSummary | null>(
      null
    );

  const [
    currentBalance,
    setCurrentBalance,
  ] = useState(0);

  const [
    lastRdsAt,
    setLastRdsAt,
  ] =
    useState<string | null>(
      null
    );

  const [
    notes,
    setNotes,
  ] =
    useState<NoteRow[]>([]);

  const [
    noteType,
    setNoteType,
  ] =
    useState<NoteType>(
      "CreditNote"
    );

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    remarks,
    setRemarks,
  ] = useState("");

  const [
    latestResult,
    setLatestResult,
  ] =
    useState<
      PostResponse["note"] | null
    >(null);

  /* =======================================================
     LOAD CURRENT BALANCE + NOTES
     ======================================================= */

  const loadData =
    useCallback(
      async () => {
        if (
          !restroCode ||
          !Number.isFinite(
            restroCode
          )
        ) {
          setError(
            "Invalid RestroCode"
          );

          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response =
            await fetch(
              `/api/restros/${encodeURIComponent(
                String(
                  restroCode
                )
              )}/credit-debit-note`,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                headers: {
                  "Cache-Control":
                    "no-store",
                },
              }
            );

          const json:
            GetResponse =
            await response.json();

          if (
            !response.ok ||
            !json.ok
          ) {
            throw new Error(
              json.error ||
                "Unable to load Credit/Debit Note details"
            );
          }

          setRestro(
            json.restro ??
              null
          );

          setCurrentBalance(
            numberValue(
              json.currentBalance
            )
          );

          setLastRdsAt(
            json.lastRdsAt ??
              null
          );

          setNotes(
            Array.isArray(
              json.notes
            )
              ? json.notes
              : []
          );
        } catch (
          loadError: any
        ) {
          console.error(
            "CREDIT DEBIT NOTE LOAD ERROR =>",
            loadError
          );

          setError(
            loadError?.message ||
              "Unable to load Credit/Debit Note details"
          );
        } finally {
          setLoading(false);
        }
      },
      [restroCode]
    );

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (
      !requestedReference ||
      loading
    ) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        requestedRowRef.current
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 250);

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    requestedReference,
    loading,
    notes,
  ]);

  /* =======================================================
     VALUES
     ======================================================= */

  const numericAmount =
    useMemo(() => {
      const parsed =
        Number(
          String(amount)
            .replace(
              /,/g,
              ""
            )
            .trim()
        );

      if (
        !Number.isFinite(
          parsed
        )
      ) {
        return 0;
      }

      return (
        Math.round(
          Math.abs(
            parsed
          ) * 100
        ) / 100
      );
    }, [amount]);

  const settlementPreview =
    noteType ===
    "CreditNote"
      ? numericAmount
      : -numericAmount;

  const balancePreview =
    Math.round(
      (
        currentBalance +
        settlementPreview
      ) * 100
    ) / 100;

  /* =======================================================
     SUBMIT
     ======================================================= */

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    setError(null);
    setSuccess(null);
    setLatestResult(null);

    if (
      !restroCode ||
      !Number.isFinite(
        restroCode
      )
    ) {
      setError(
        "Invalid RestroCode"
      );

      return;
    }

    if (
      numericAmount <= 0
    ) {
      setError(
        "Amount must be greater than 0"
      );

      return;
    }

    const confirmationText =
      noteType ===
      "CreditNote"
        ? `Credit Note of ₹${formatMoney(
            numericAmount
          )} add karna hai?`
        : `Debit Note of ₹${formatMoney(
            numericAmount
          )} add karna hai?`;

    const confirmed =
      window.confirm(
        confirmationText
      );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const response =
        await fetch(
          `/api/restros/${encodeURIComponent(
            String(restroCode)
          )}/credit-debit-note`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Cache-Control":
                "no-store",
            },

            body:
              JSON.stringify(
                {
                  noteType,
                  amount:
                    numericAmount,
                  remarks:
                    remarks.trim() ||
                    null,
                }
              ),
          }
        );

      const json:
        PostResponse =
        await response.json();

      if (
        !response.ok ||
        !json.ok
      ) {
        throw new Error(
          json.error ||
            "Unable to create Credit/Debit Note"
        );
      }

      setLatestResult(
        json.note ??
          null
      );

      setSuccess(
        json.message ||
          `${
            noteType ===
            "CreditNote"
              ? "Credit Note"
              : "Debit Note"
          } added successfully`
      );

      setAmount("");
      setRemarks("");

      await loadData();
    } catch (
      submitError: any
    ) {
      console.error(
        "CREDIT DEBIT NOTE SUBMIT ERROR =>",
        submitError
      );

      setError(
        submitError?.message ||
          "Unable to create Credit/Debit Note"
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     INVALID RESTRO
     ======================================================= */

  if (
    !restroCode ||
    !Number.isFinite(
      restroCode
    )
  ) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm font-semibold text-red-700">
        Invalid RestroCode
      </div>
    );
  }

  /* =======================================================
     JSX
     ======================================================= */

  return (
    <div className="space-y-5">
      {/* Restaurant summary */}

      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Restaurant Account
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {restro
                ? `${restro.RestroCode} / ${
                    restro.RestroName ||
                    "Restaurant"
                  }`
                : `Restro Code ${restroCode}`}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-600">
              {restro?.StationCode ||
                "-"}
              {restro?.StationName
                ? ` — ${restro.StationName}`
                : ""}
            </p>
          </div>

          <div className="min-w-[230px] rounded-xl border border-blue-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Current Balance
            </p>

            <p
              className={[
                "mt-1 text-2xl font-extrabold",
                amountClass(
                  currentBalance
                ),
              ].join(" ")}
            >
              ₹
              {formatMoney(
                currentBalance
              )}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Last RDS:{" "}
              {formatIndiaDateTime(
                lastRdsAt
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Error */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Success */}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      )}

      {/* Latest inserted note result */}

      {latestResult && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="text-sm font-bold text-emerald-800">
            Latest Note Result
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs font-semibold text-slate-500">
                Reference
              </div>

              <div className="mt-1 font-bold text-slate-900">
                {latestResult.referenceId ||
                  "-"}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500">
                Settlement
              </div>

              <div
                className={[
                  "mt-1 font-extrabold",
                  amountClass(
                    latestResult.settlementAmount
                  ),
                ].join(" ")}
              >
                ₹
                {formatMoney(
                  latestResult.settlementAmount
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500">
                Previous Balance
              </div>

              <div className="mt-1 font-bold text-slate-900">
                ₹
                {formatMoney(
                  latestResult.previousBalance
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-500">
                Current Balance
              </div>

              <div
                className={[
                  "mt-1 text-base font-extrabold",
                  amountClass(
                    latestResult.currentBalance
                  ),
                ].join(" ")}
              >
                ₹
                {formatMoney(
                  latestResult.currentBalance
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entry form */}

      <form
        onSubmit={
          handleSubmit
        }
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-950">
            Add Credit / Debit
            Note
          </h3>

          <p className="mt-1 text-sm font-medium text-slate-500">
            Credit Note balance
            ko increase karega aur
            Debit Note balance ko
            decrease karega.
          </p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Note type */}

            <div>
              <label
                htmlFor="note-type"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Note Type
              </label>

              <select
                id="note-type"
                value={noteType}
                onChange={(
                  event
                ) =>
                  setNoteType(
                    event
                      .target
                      .value as NoteType
                  )
                }
                disabled={
                  submitting
                }
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="CreditNote">
                  Credit Note
                </option>

                <option value="DebitNote">
                  Debit Note
                </option>
              </select>
            </div>

            {/* Amount */}

            <div>
              <label
                htmlFor="note-amount"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Amount
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
                  ₹
                </span>

                <input
                  id="note-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(
                    event
                  ) =>
                    setAmount(
                      event
                        .target
                        .value
                    )
                  }
                  disabled={
                    submitting
                  }
                  placeholder="0.00"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Remarks */}

            <div className="lg:col-span-2">
              <label
                htmlFor="note-remarks"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Remarks
              </label>

              <textarea
                id="note-remarks"
                value={remarks}
                onChange={(
                  event
                ) =>
                  setRemarks(
                    event
                      .target
                      .value
                  )
                }
                disabled={
                  submitting
                }
                rows={4}
                maxLength={500}
                placeholder="Credit/Debit Note ka reason enter karein..."
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />

              <div className="mt-1 text-right text-xs font-medium text-slate-400">
                {remarks.length}/500
              </div>
            </div>
          </div>

          {/* Calculation preview */}

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-900">
              Balance Preview
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-white px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">
                  Previous Balance
                </div>

                <div className="mt-1 font-bold text-slate-900">
                  ₹
                  {formatMoney(
                    currentBalance
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-white px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">
                  Settlement Amount
                </div>

                <div
                  className={[
                    "mt-1 font-extrabold",
                    amountClass(
                      settlementPreview
                    ),
                  ].join(" ")}
                >
                  {settlementPreview >
                  0
                    ? "+"
                    : ""}
                  ₹
                  {formatMoney(
                    settlementPreview
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="text-xs font-semibold text-slate-500">
                  New Current
                  Balance
                </div>

                <div
                  className={[
                    "mt-1 text-base font-extrabold",
                    amountClass(
                      balancePreview
                    ),
                  ].join(" ")}
                >
                  ₹
                  {formatMoney(
                    balancePreview
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                numericAmount <=
                  0
              }
              className={[
                "inline-flex h-11 min-w-[170px] items-center justify-center rounded-lg px-5 text-sm font-bold text-white shadow-sm transition",
                noteType ===
                "CreditNote"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700",
                "disabled:cursor-not-allowed disabled:opacity-50",
              ].join(" ")}
            >
              {submitting
                ? "Submitting..."
                : noteType ===
                  "CreditNote"
                ? "Add Credit Note"
                : "Add Debit Note"}
            </button>
          </div>
        </div>
      </form>

      {/* Recent notes */}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Recent Credit /
              Debit Notes
            </h3>

            <p className="mt-1 text-sm font-medium text-slate-500">
              Latest 20 manual
              financial adjustments
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadData
            }
            disabled={
              loading ||
              submitting
            }
            className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border-b border-r border-slate-200 px-3 py-3 text-left text-xs font-bold text-slate-700">
                  RDS Id
                </th>

                <th className="border-b border-r border-slate-200 px-3 py-3 text-left text-xs font-bold text-slate-700">
                  Reference
                </th>

                <th className="border-b border-r border-slate-200 px-3 py-3 text-left text-xs font-bold text-slate-700">
                  Type
                </th>

                <th className="border-b border-r border-slate-200 px-3 py-3 text-left text-xs font-bold text-slate-700">
                  Remarks
                </th>

                <th className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs font-bold text-slate-700">
                  Settlement
                </th>

                <th className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs font-bold text-slate-700">
                  Previous Bal.
                </th>

                <th className="border-b border-r border-slate-200 px-3 py-3 text-right text-xs font-bold text-slate-700">
                  Current Bal.
                </th>

                <th className="border-b border-slate-200 px-3 py-3 text-center text-xs font-bold text-slate-700">
                  Created At
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                  >
                    Loading notes...
                  </td>
                </tr>
              ) : notes.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm font-semibold text-slate-400"
                  >
                    No Credit /
                    Debit Notes found
                  </td>
                </tr>
              ) : (
                notes.map(
                  (
                    row,
                    index
                  ) => {
                    const isCredit =
                      cleanText(
                        row.EntrySource
                      ).toLowerCase() ===
                      "creditnote";

                    const isRequested =
                      Boolean(
                        requestedReference &&
                        cleanText(
                          row.OrderId
                        ).toLowerCase() ===
                          requestedReference.toLowerCase()
                      );

                    return (
                      <tr
                        ref={
                          isRequested
                            ? requestedRowRef
                            : null
                        }
                        key={`${row.RDSId}-${row.OrderId}-${index}`}
                        className={
                          isRequested
                            ? "bg-amber-100 ring-2 ring-inset ring-amber-400"
                            : index % 2 ===
                              0
                            ? "bg-white"
                            : "bg-slate-50"
                        }
                      >
                        <td className="border-b border-r border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                          {row.RDSId ??
                            "-"}
                        </td>

                        <td className="border-b border-r border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800">
                          {row.OrderId ||
                            "-"}
                        </td>

                        <td className="border-b border-r border-slate-200 px-3 py-3 text-sm">
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-xs font-bold",
                              isCredit
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700",
                            ].join(
                              " "
                            )}
                          >
                            {noteTypeLabel(
                              row.EntrySource
                            )}
                          </span>
                        </td>

                        <td className="max-w-[300px] border-b border-r border-slate-200 px-3 py-3 text-sm text-slate-700">
                          <span
                            title={
                              row.Remarks ||
                              ""
                            }
                            className="block truncate"
                          >
                            {row.Remarks ||
                              "-"}
                          </span>
                        </td>

                        <td
                          className={[
                            "border-b border-r border-slate-200 px-3 py-3 text-right text-sm font-extrabold",
                            amountClass(
                              row.SettlementAmount
                            ),
                          ].join(
                            " "
                          )}
                        >
                          {numberValue(
                            row.SettlementAmount
                          ) > 0
                            ? "+"
                            : ""}
                          ₹
                          {formatMoney(
                            row.SettlementAmount
                          )}
                        </td>

                        <td className="border-b border-r border-slate-200 px-3 py-3 text-right text-sm font-semibold text-slate-700">
                          ₹
                          {formatMoney(
                            row.PreviousBal
                          )}
                        </td>

                        <td
                          className={[
                            "border-b border-r border-slate-200 bg-blue-50/40 px-3 py-3 text-right text-base font-extrabold",
                            amountClass(
                              row.CurrentBal
                            ),
                          ].join(
                            " "
                          )}
                        >
                          ₹
                          {formatMoney(
                            row.CurrentBal
                          )}
                        </td>

                        <td className="border-b border-slate-200 px-3 py-3 text-center text-xs font-semibold text-slate-600">
                          {formatIndiaDateTime(
                            row.CreatedAt
                          )}
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
