// app/api/admin/payment-requests/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabaseServer";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const ALLOWED_PAGE_SIZES = [20, 50, 100, 500] as const;
const ALLOWED_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "Paid",
  "Cancelled",
] as const;

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };
}

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizePageSize(value: unknown) {
  const parsed = positiveInteger(value, 20);
  return ALLOWED_PAGE_SIZES.includes(parsed as any) ? parsed : 20;
}

function normalizeStatus(value: unknown) {
  const text = cleanText(value);
  return ALLOWED_STATUSES.includes(text as any) ? text : "";
}

function normalizePaymentMode(value: unknown) {
  const raw = cleanText(value).toUpperCase();
  if (!raw) return "NEFT";

  const key = raw.replace(/[^A-Z0-9]/g, "");

  if (key === "BANKTRANSFER") return "BANK TRANSFER";
  if (["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "CASH"].includes(key)) {
    return key;
  }

  return "NEFT";
}

function formatIndiaDateTime(value: unknown) {
  const text = cleanText(value);
  if (!text) return "";

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getJwtSecret() {
  return (
    process.env.ADMIN_JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    ""
  );
}

async function getAdminName() {
  try {
    const token = cookies().get("admin_auth")?.value;
    const secret = getJwtSecret();

    if (!token || !secret) return "Admin";

    const payload = jwt.verify(token, secret) as any;

    return cleanText(
      payload?.name ||
        payload?.email ||
        payload?.mobile ||
        payload?.user_id ||
        "Admin"
    );
  } catch {
    return "Admin";
  }
}

function buildPaidDateTime(value: unknown) {
  const selectedDate = cleanText(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    return new Date().toISOString();
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const hour = map.hour === "24" ? "00" : map.hour || "00";

  return new Date(
    `${selectedDate}T${hour}:${map.minute || "00"}:${map.second || "00"}+05:30`
  ).toISOString();
}

async function getLiveBalances(restroCodes: number[]) {
  const result = new Map<number, number>();

  if (restroCodes.length === 0) return result;

  const { data, error } = await serviceClient
    .from("RestroRDS")
    .select("RDSId, RestroCode, CurrentBal")
    .in("RestroCode", restroCodes)
    .order("RDSId", { ascending: false })
    .limit(5000);

  if (error) throw new Error(error.message);

  for (const row of data || []) {
    const code = Number(row.RestroCode);

    if (Number.isFinite(code) && !result.has(code)) {
      result.set(code, numberValue(row.CurrentBal));
    }
  }

  return result;
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const page = positiveInteger(params.get("page"), 1);
    const pageSize = normalizePageSize(params.get("pageSize"));
    const status = normalizeStatus(params.get("status"));
    const search = cleanText(params.get("search"));

    const fromIndex = (page - 1) * pageSize;
    const toIndex = fromIndex + pageSize - 1;

    let query = serviceClient
      .from("SettlementRequests")
      .select(
        `
          Id,
          RequestNo,
          RestroCode,
          RestroName,
          RequestDate,
          Amount,
          CurrentBalance,
          AvailableBalanceBeforeRequest,
          PendingAmountBeforeRequest,
          BankName,
          AccountNo,
          IFSC,
          Status,
          VendorRemarks,
          AdminRemarks,
          ApprovedBy,
          ApprovedDate,
          RejectedBy,
          RejectedDate,
          PaidBy,
          PaidDate,
          UTR,
          LedgerRDSId,
          CreatedAt,
          UpdatedAt
        `,
        { count: "exact" }
      );

    if (status) query = query.eq("Status", status);

    if (search) {
      const safeSearch = search.replace(/[%_,]/g, "").slice(0, 100);
      const numericSearch = safeSearch.replace(/[^\d]/g, "");

      const filters = [
        `RequestNo.ilike.%${safeSearch}%`,
        `RestroName.ilike.%${safeSearch}%`,
        `UTR.ilike.%${safeSearch}%`,
      ];

      if (numericSearch) {
        filters.push(`RestroCode.eq.${Number(numericSearch)}`);
      }

      query = query.or(filters.join(","));
    }

    const { data, error, count } = await query
      .order("Id", { ascending: false })
      .range(fromIndex, toIndex);

    if (error) throw new Error(error.message);

    const rawRows = Array.isArray(data) ? data : [];

    const uniqueRestroCodes = Array.from(
      new Set(
        rawRows
          .map((row: any) => Number(row.RestroCode))
          .filter((code) => Number.isFinite(code) && code > 0)
      )
    );

    const liveBalanceMap = await getLiveBalances(uniqueRestroCodes);

    const rows = rawRows.map((row: any) => {
      const restroCode = Number(row.RestroCode);
      const balanceAtRequest = numberValue(row.CurrentBalance);
      const availableAtRequest = numberValue(row.AvailableBalanceBeforeRequest);
      const liveCurrentBalance = liveBalanceMap.has(restroCode)
        ? numberValue(liveBalanceMap.get(restroCode))
        : balanceAtRequest;

      return {
        ...row,
        BalanceAtRequest: balanceAtRequest,
        AvailableBalanceAtRequest: availableAtRequest,
        LiveCurrentBalance: liveCurrentBalance,
        CurrentBalance: liveCurrentBalance,
        AvailableBalanceBeforeRequest: liveCurrentBalance,
        Amount: numberValue(row.Amount),
        PendingAmountBeforeRequest: numberValue(row.PendingAmountBeforeRequest),
        RequestDateFormatted: formatIndiaDateTime(row.RequestDate || row.CreatedAt),
        ApprovedDateFormatted: formatIndiaDateTime(row.ApprovedDate),
        RejectedDateFormatted: formatIndiaDateTime(row.RejectedDate),
        PaidDateFormatted: formatIndiaDateTime(row.PaidDate),
        UpdatedAtFormatted: formatIndiaDateTime(row.UpdatedAt),
      };
    });

    const total = Number(count || 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return NextResponse.json(
      {
        ok: true,
        rows,
        total,
        page,
        pageSize,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
        filters: {
          status: status || null,
          search: search || null,
        },
      },
      { status: 200, headers: noStoreHeaders() }
    );
  } catch (error: any) {
    console.error("ADMIN SETTLEMENT GET ERROR =>", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to load payment requests",
      },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const requestId = positiveInteger(body?.requestId, 0);
    const action = cleanText(body?.action).toUpperCase();
    const adminRemarks = cleanText(body?.adminRemarks).slice(0, 500);
    const utr = cleanText(body?.utr).slice(0, 100);
    const paidDate = cleanText(body?.paidDate);
    const paymentMode = normalizePaymentMode(body?.paymentMode);

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment request" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    if (!["APPROVE", "REJECT", "PAID"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    if (action === "REJECT" && !adminRemarks) {
      return NextResponse.json(
        { ok: false, error: "Rejection reason is required" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    if (action === "PAID" && !utr) {
      return NextResponse.json(
        { ok: false, error: "UTR number is required" },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    const adminName = await getAdminName();
    const paidDateValue = action === "PAID" ? buildPaidDateTime(paidDate) : null;

    const { data, error } = await serviceClient.rpc(
      "admin_update_settlement_request",
      {
        p_request_id: requestId,
        p_action: action,
        p_admin_name: adminName,
        p_admin_remarks: adminRemarks || null,
        p_utr: utr || null,
        p_paid_date: paidDateValue,
        p_payment_mode: paymentMode,
      }
    );

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400, headers: noStoreHeaders() }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          action === "APPROVE"
            ? "Payment request approved"
            : action === "REJECT"
            ? "Payment request rejected"
            : "Payment marked paid; Restro RDS and RE RDS updated",
        result: data,
      },
      { status: 200, headers: noStoreHeaders() }
    );
  } catch (error: any) {
    console.error("ADMIN SETTLEMENT PATCH ERROR =>", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unable to update settlement request",
      },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}
